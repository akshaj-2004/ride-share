"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Map, { Source, Layer, NavigationControl, Marker } from "react-map-gl";
import { Car, CarFront, Users, Loader2, MessageSquare, ArrowLeft } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

const INITIAL_VIEW_STATE = {
  longitude: 78.4867,
  latitude: 17.385,
  zoom: 5,
};

const RIDE_TYPES = [
  { id: "economy", name: "Economy", Icon: Car, basePrice: 50, pricePerKm: 10 },
  { id: "premium", name: "Premium", Icon: CarFront, basePrice: 100, pricePerKm: 15 },
  { id: "economy_shared", name: "Economy Shared", Icon: Users, basePrice: 40, pricePerKm: 8 },
  { id: "premium_shared", name: "Premium Shared", Icon: Users, basePrice: 80, pricePerKm: 12 },
];

const DRIVERS = [
  { name: "Suresh", rating: 4.9, vehicle: "Toyota Innova", plate: "AP 01 XY 1234" },
  { name: "Raju", rating: 4.7, vehicle: "Hyundai Verna", plate: "KA 02 AB 5678" },
  { name: "Babu", rating: 4.8, vehicle: "Honda City", plate: "TN 03 CD 9876" },
];

const MAX_DISTANCE_KM = 500;

type Ride = {
  id: string;
  from: string;
  to: string;
  type: string;
  cost: string;
  status: string;
  date: string;
  driver: {
    name: string;
    rating: number;
  };
  feedback?: string;
  ratings?: {
    driver: number;
  };
};

type Suggestion = {
  place_name: string;
  center: [number, number];
};

type Message = {
  sender: string;
  message: string;
};

export default function DashboardPage() {
  const [pickup, setPickup] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<Suggestion[]>([]);
  const [selectedRideType, setSelectedRideType] = useState<string | null>(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [distance, setDistance] = useState<number | null>(null);
  const [routeCoords, setRouteCoords] = useState<GeoJSON.Feature | null>(null);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [driver, setDriver] = useState<typeof DRIVERS[number] | null>(null);
  const { toast } = useToast();
  const [chatInput, setChatInput] = useState<string>("");
  const geocodingCache = useRef<Record<string, [number, number]>>({});

  // Use the useSocket hook for live chat
  const roomId = driver ? `ride-${driver.name}` : "";
  const { messages, sendMessage, clearMessages, isConnected } = useSocket<Message>(roomId);

  // Debounced function to fetch suggestions
  const debouncedFetchSuggestions = useMemo(() => {
    let timeout: NodeJS.Timeout;
    return (query: string, setSuggestions: (suggestions: Suggestion[]) => void) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (!query || !MAPBOX_TOKEN) return;
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}`
        )
          .then((res) => res.json())
          .then((data) => setSuggestions(data.features))
          .catch((error) => console.error("Error fetching suggestions:", error));
      }, 300);
    };
  }, []);

  // Handle pickup input change
  const handlePickupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPickup(value);
    debouncedFetchSuggestions(value, setPickupSuggestions);
  };

  // Handle destination input change
  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDestination(value);
    debouncedFetchSuggestions(value, setDestinationSuggestions);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (
    suggestion: Suggestion,
    setInput: (value: string) => void,
    setSuggestions: (suggestions: Suggestion[]) => void,
    setCoords: (coords: [number, number]) => void
  ) => {
    setInput(suggestion.place_name);
    setSuggestions([]);
    setCoords(suggestion.center);
  };

  // Fetch route between pickup and destination
  const fetchRoute = useCallback(async () => {
    if (!pickup || !destination || !MAPBOX_TOKEN) return;

    setIsLoading(true);
    try {
      const [pickupCoords, destinationCoords] = await Promise.all([
        getCoordinates(pickup),
        getCoordinates(destination),
      ]);

      if (!pickupCoords || !destinationCoords) {
        toast({ title: "Invalid locations", description: "Please enter valid locations", variant: "destructive" });
        return;
      }

      setPickupCoords(pickupCoords);
      setDestinationCoords(destinationCoords);

      const [pickupCountry, destinationCountry] = await Promise.all([
        getCountry(pickupCoords),
        getCountry(destinationCoords),
      ]);

      if (pickupCountry !== destinationCountry) {
        toast({ title: "Invalid locations", description: "Pickup and destination must be in the same country", variant: "destructive" });
        return;
      }

      const directionsRes = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupCoords[0]},${pickupCoords[1]};${destinationCoords[0]},${destinationCoords[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
      );

      const directionsData = await directionsRes.json();

      if (!directionsData.routes.length) {
        toast({ title: "Route Error", description: "No available route", variant: "destructive" });
        return;
      }

      const routeDistanceKm = Math.round(directionsData.routes[0].distance / 1000);

      if (routeDistanceKm > MAX_DISTANCE_KM) {
        toast({ title: "Distance too far", description: `Maximum allowed distance is ${MAX_DISTANCE_KM} km`, variant: "destructive" });
        return;
      }

      setDistance(routeDistanceKm);
      setRouteCoords({ type: "Feature", geometry: directionsData.routes[0].geometry });

      // Calculate bounding box of the route
      const coords = directionsData.routes[0].geometry.coordinates;
      const bounds = coords.reduce(
        (acc: [[number, number], [number, number]], coord: [number, number]) => {
          return [
            [Math.min(acc[0][0], coord[0]), Math.min(acc[0][1], coord[1])],
            [Math.max(acc[1][0], coord[0]), Math.max(acc[1][1], coord[1])],
          ];
        },
        [
          [Infinity, Infinity],
          [-Infinity, -Infinity],
        ]
      );

      // Calculate center and zoom level
      const center: [number, number] = [
        (bounds[0][0] + bounds[1][0]) / 2,
        (bounds[0][1] + bounds[1][1]) / 2,
      ];

      const zoom = Math.log2(360 / (bounds[1][0] - bounds[0][0]));

      // Update map view state
      setViewState({
        longitude: center[0],
        latitude: center[1],
        zoom: Math.min(zoom, 15), // Limit max zoom level
      });

    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch route", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [pickup, destination, toast]);

  // Get coordinates for a location
  const getCoordinates = async (location: string): Promise<[number, number] | null> => {
    if (geocodingCache.current[location]) {
      return geocodingCache.current[location];
    }

    const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${MAPBOX_TOKEN}`);
    const data = await res.json();

    if (!data.features.length) {
      return null;
    }

    const coords = data.features[0].center;
    geocodingCache.current[location] = coords;
    return coords;
  };

  // Get country for coordinates
  const getCountry = async (coords: [number, number]): Promise<string | null> => {
    const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?access_token=${MAPBOX_TOKEN}`);
    const data = await res.json();

    if (!data.features.length) {
      return null;
    }

    const country = data.features[0].context.find((ctx: any) => ctx.id.startsWith("country"))?.text;
    return country;
  };

  // Automatically fetch route when pickup and destination are set
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (pickup && destination) {
        fetchRoute();
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [pickup, destination, fetchRoute]);

  // Calculate fare based on ride type and distance
  const calculateFare = (rideType: string): string => {
    const selectedType = RIDE_TYPES.find((type) => type.id === rideType);
    if (!selectedType || distance === null) return "--";
    return `₹${Math.round(selectedType.basePrice + selectedType.pricePerKm * distance)}`;
  };

  // Handle booking a ride
  const handleBookRide = () => {
    if (!pickup || !destination || !selectedRideType) {
      toast({ title: "Error", description: "Please fill all details", variant: "destructive" });
      return;
    }

    const assignedDriver = DRIVERS[Math.floor(Math.random() * DRIVERS.length)];
    setDriver(assignedDriver);
    clearMessages();

    // Add ride to history with status "Ongoing" and driver details
    const rideHistory: Ride[] = JSON.parse(localStorage.getItem("rideHistory") || "[]");
    const newRide: Ride = {
      id: Date.now().toString(), // Generate a unique ID
      from: pickup,
      to: destination,
      type: selectedRideType,
      cost: calculateFare(selectedRideType),
      status: "Ongoing",
      date: new Date().toLocaleString(),
      driver: {
        name: assignedDriver.name,
        rating: assignedDriver.rating,
      },
    };
    rideHistory.push(newRide);
    localStorage.setItem("rideHistory", JSON.stringify(rideHistory));

    toast({ title: "Success", description: `Your ${selectedRideType} ride has been booked!` });
  };

  // Handle cancelling a ride
  const handleCancelRide = () => {
    if (!driver) return;

    // Update ride status to "Cancelled"
    const rideHistory: Ride[] = JSON.parse(localStorage.getItem("rideHistory") || "[]");
    const latestRide = rideHistory[rideHistory.length - 1];
    if (latestRide) {
      latestRide.status = "Cancelled";
      localStorage.setItem("rideHistory", JSON.stringify(rideHistory));
    }

    setDriver(null);
    toast({ title: "Ride Cancelled", description: "Your ride has been cancelled.", variant: "destructive" });
  };

  // Handle going back to booking
  const handleBackToBooking = () => {
    setDriver(null);
    setSelectedRideType(null);
    setPickup("");
    setDestination("");
    clearMessages();
  };

  // Handle sending a chat message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && chatInput.trim()) {
      sendMessage(chatInput, "You"); // Send message as the user
      setChatInput("");
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Section */}
        <div className="space-y-6">
          {!driver ? (
            <Card className="shadow-lg hover:shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl font-bold">Book a Ride</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative">
                  <Input
                    placeholder="Pickup Location"
                    value={pickup}
                    onChange={handlePickupChange}
                    className="w-full"
                  />
                  {pickupSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {pickupSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() =>
                            handleSuggestionSelect(
                              suggestion,
                              setPickup,
                              setPickupSuggestions,
                              setPickupCoords
                            )
                          }
                        >
                          {suggestion.place_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <Input
                    placeholder="Destination"
                    value={destination}
                    onChange={handleDestinationChange}
                    className="w-full"
                  />
                  {destinationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {destinationSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() =>
                            handleSuggestionSelect(
                              suggestion,
                              setDestination,
                              setDestinationSuggestions,
                              setDestinationCoords
                            )
                          }
                        >
                          {suggestion.place_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-4">
                  {RIDE_TYPES.map(({ id, name, Icon }) => (
                    <Card
                      key={id}
                      className={`cursor-pointer p-4 text-center hover:scale-105 transition ${
                        selectedRideType === id ? "border-primary bg-accent" : ""
                      }`}
                      onClick={() => setSelectedRideType(id)}
                    >
                      <Icon className="h-8 w-8 mx-auto" />
                      <h3 className="font-medium">{name}</h3>
                      <p className="text-lg font-bold">{calculateFare(id)}</p>
                    </Card>
                  ))}
                </div>

                <Button className="w-full mt-6" size="lg" onClick={handleBookRide}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Book Now"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mt-4 p-4">
                <Button variant="ghost" className="mb-4" onClick={handleBackToBooking}>
                  <ArrowLeft className="mr-2" /> Back to Booking
                </Button>
                <h3 className="text-lg font-bold">{driver.name} 🚖</h3>
                <p>Vehicle: {driver.vehicle}</p>
                <p>Plate: {driver.plate}</p>
                <p>Rating: ⭐ {driver.rating}</p>
                <Button variant="destructive" className="mt-4 w-full" onClick={handleCancelRide}>
                  Cancel Ride
                </Button>
              </Card>

              <Card className="mt-6 p-4">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2" /> Chat with {driver.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Connection Status */}
                  {!isConnected && (
                    <p className="text-red-500 text-sm">Disconnected from server. Trying to reconnect...</p>
                  )}

                  {/* Chat Messages */}
                  <div className="h-64 overflow-y-auto border p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    {messages.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
                    ) : (
                      messages.map((msg, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded-lg ${
                            msg.sender === "You" ? "bg-blue-100 dark:bg-green-800 text-right" : "bg-gray-100 dark:bg-gray-700 text-left"
                          } mb-2`}
                        >
                          <p className="text-sm font-medium">{msg.sender}</p>
                          <p>{msg.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                    />
                    <Button
                      onClick={() => { sendMessage(chatInput, "You"); setChatInput(""); }}
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
                    >
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Map Section */}
        <Card className="h-[400px] lg:h-[calc(100vh-4rem)]">
          <CardContent className="p-0 h-full relative">
            {MAPBOX_TOKEN && (
              <Map
                {...viewState}
                mapboxAccessToken={MAPBOX_TOKEN}
                mapStyle="mapbox://styles/mapbox/streets-v11"
                onMove={(e) => setViewState(e.viewState)}
                scrollZoom
              >
                <NavigationControl showCompass={false} />
                {routeCoords && (
                  <Source id="route" type="geojson" data={routeCoords}>
                    <Layer id="route" type="line" paint={{ "line-color": "#007AFF", "line-width": 4, "line-opacity": 0.8 }} />
                  </Source>
                )}
                {pickupCoords && (
                  <Marker longitude={pickupCoords[0]} latitude={pickupCoords[1]}>
                    <div className="text-white rounded-full p-2">📍</div>
                  </Marker>
                )}
                {destinationCoords && (
                  <Marker longitude={destinationCoords[0]} latitude={destinationCoords[1]}>
                    <div className="text-white rounded-full p-2">🏁</div>
                  </Marker>
                )}
              </Map>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}