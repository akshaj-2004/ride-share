"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Share2, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Constants
const RIDE_TYPES = [
  { id: "economy", name: "Economy Shared", basePrice: 50, pricePerKm: 10 },
  { id: "premium", name: "Premium Shared", basePrice: 100, pricePerKm: 15 },
];

const SEAT_OPTIONS = ["1", "2", "3", "4"];

// Utility function to calculate price per person
const calculatePricePerPerson = (rideType: string, distance: number, passengers: number) => {
  const selectedRideType = RIDE_TYPES.find((type) => type.id === rideType);
  if (!selectedRideType) return 0;

  const totalPrice = selectedRideType.basePrice + distance * selectedRideType.pricePerKm;
  return Math.round(totalPrice / passengers);
};

export default function SharePage() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(SEAT_OPTIONS[0]);
  const [rideType, setRideType] = useState(RIDE_TYPES[0].id);
  const [distance, setDistance] = useState<number | null>(null);
  const [sharedRides, setSharedRides] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Function to calculate distance using a map API (e.g., Google Maps or Mapbox)
  const calculateDistance = useCallback(async (pickup: string, destination: string) => {
    setIsLoading(true);

    try {
      // Replace with your map API logic
      const distanceInKm = await fetchDistanceFromMapAPI(pickup, destination);
      setDistance(distanceInKm);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to calculate distance. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Mock function to simulate distance calculation (replace with actual API call)
  const fetchDistanceFromMapAPI = async (pickup: string, destination: string) => {
    // Simulate an API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return a mock distance (in km)
    return Math.floor(Math.random() * 100) + 1; // Random distance between 1 and 100 km
  };

  // Calculate distance when pickup or destination changes
  useEffect(() => {
    if (pickup && destination) {
      calculateDistance(pickup, destination);
    } else {
      setDistance(null);
    }
  }, [pickup, destination, calculateDistance]);

  // Handle creating a shared ride
  const handleCreateSharedRide = () => {
    if (!pickup || !destination || !date || !distance) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call or async operation
    setTimeout(() => {
      const pricePerPerson = calculatePricePerPerson(rideType, distance, parseInt(passengers));

      const newRide = {
        id: Date.now().toString(),
        host: {
          name: "You",
          avatar: "https://i.pravatar.cc/150?u=yourprofile",
        },
        from: pickup,
        to: destination,
        departure: date,
        seats: parseInt(passengers),
        type: RIDE_TYPES.find((type) => type.id === rideType)?.name || "",
        pricePerPerson,
      };

      setSharedRides([...sharedRides, newRide]);
      toast({ title: "Success", description: "Your shared ride has been created!" });

      // Reset fields
      setPickup("");
      setDestination("");
      setDate("");
      setPassengers(SEAT_OPTIONS[0]);
      setRideType(RIDE_TYPES[0].id);
      setDistance(null);
      setIsLoading(false);
    }, 1000);
  };

  // Filter shared rides based on search query
  const filteredRides = sharedRides.filter(
    (ride) =>
      ride.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.to.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Create Shared Ride Section */}
      <Card>
        <CardHeader>
          <CardTitle>Create a Shared Ride</CardTitle>
          <CardDescription>Share your ride with others and split the costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Pickup Location"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
              />
              <Input
                placeholder="Destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Select value={passengers} onValueChange={setPassengers}>
                <SelectTrigger>
                  <SelectValue placeholder="Select seats" />
                </SelectTrigger>
                <SelectContent>
                  {SEAT_OPTIONS.map((seat) => (
                    <SelectItem key={seat} value={seat}>
                      {seat} seat{seat !== "1" ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={rideType} onValueChange={setRideType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ride type" />
                </SelectTrigger>
                <SelectContent>
                  {RIDE_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {distance !== null && (
              <p className="text-sm text-gray-600">
                Estimated Distance: {distance} km | Price per Person: ₹
                {calculatePricePerPerson(rideType, distance, parseInt(passengers))}
              </p>
            )}
            <Button className="w-full" onClick={handleCreateSharedRide} disabled={isLoading}>
              <Share2 className="h-4 w-4 mr-2" />
              {isLoading ? "Creating..." : "Create Shared Ride"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Shared Rides Section */}
      <Card>
        <CardHeader>
          <CardTitle>Available Shared Rides</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search rides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRides.length === 0 ? (
              <p className="text-gray-500">No shared rides found.</p>
            ) : (
              filteredRides.map((ride) => (
                <Card key={ride.id} className="bg-muted">
                  <CardContent className="pt-6">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={ride.host.avatar} />
                          <AvatarFallback>{ride.host.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{ride.host.name}</h3>
                        </div>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">From:</span> {ride.from}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">To:</span> {ride.to}
                      </p>
                      <div className="flex justify-between items-center">
  <Badge variant="secondary">{ride.type}</Badge>
  <Badge variant="default">₹{ride.pricePerPerson} per person</Badge>
</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}