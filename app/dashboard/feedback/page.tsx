"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star, ThumbsUp } from "lucide-react";

type RideHistory = {
  id: string;
  from: string;
  to: string;
  type: string;
  cost: string;
  status: string;
  date: string;
  driver?: {
    name: string;
    rating?: number;
  }; // Make driver optional
  feedback?: string; // Optional feedback field
  ratings?: {
    driver: number; // Optional driver rating
  };
};

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState("");
  const [selectedRide, setSelectedRide] = useState<string | null>(null);
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [completedRides, setCompletedRides] = useState<RideHistory[]>([]);
  const { toast } = useToast();

  // Fetch completed rides from localStorage on component mount
  useEffect(() => {
    const fetchCompletedRides = () => {
      try {
        const rideHistory = JSON.parse(localStorage.getItem("rideHistory") || "[]");

        if (!Array.isArray(rideHistory)) {
          console.error("Invalid ride data in localStorage. Expected an array.");
          return;
        }

        // Filter rides with status "Completed" and ensure they have a valid driver object
        const completed = rideHistory.filter(
          (ride) => ride.status === "Completed" && ride.driver && ride.driver.name
        );
        setCompletedRides(completed);
      } catch (error) {
        console.error("Error retrieving rides from localStorage:", error);
      }
    };

    fetchCompletedRides();
  }, []);

  // Handle rating selection
  const handleRating = (driverName: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [driverName]: rating }));
  };

  // Handle feedback submission
  const handleSubmitFeedback = (rideId: string, driverName: string) => {
    if (!ratings[driverName]) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a rating for the driver before submitting feedback",
      });
      return;
    }

    // Update localStorage with feedback and ratings
    const updatedRideHistory = JSON.parse(localStorage.getItem("rideHistory") || "[]");
    const updatedRides = updatedRideHistory.map((ride) => {
      if (ride.id === rideId) {
        return {
          ...ride,
          feedback,
          ratings: {
            driver: ratings[driverName] || ride.driver?.rating || 0,
          },
        };
      }
      return ride;
    });

    localStorage.setItem("rideHistory", JSON.stringify(updatedRides));
    setCompletedRides(updatedRides.filter((ride) => ride.status === "Completed"));

    toast({ title: "Success", description: "Thank you for your feedback!" });
    setFeedback("");
    setSelectedRide(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ride Feedback</CardTitle>
          <CardDescription>
            Rate your driver to improve our service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {completedRides.length > 0 ? (
              completedRides.map((ride) => (
                <Card key={ride.id} className="bg-muted">
                  <CardContent className="pt-6">
                    <div className="flex flex-col space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">Ride with {ride.driver?.name || "N/A"}</h3>
                          <p className="text-sm text-muted-foreground">{ride.date}</p>
                          <p className="text-sm mt-2">
                            From: {ride.from} <br />
                            To: {ride.to}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRating(ride.driver?.name || "N/A", star)}
                              className={`p-1 rounded-full transition-colors ${
                                (ratings[ride.driver?.name || "N/A"] || ride.driver?.rating || 0) >= star
                                  ? "text-yellow-400 hover:text-yellow-500"
                                  : "text-gray-300 hover:text-gray-400"
                              }`}
                            >
                              <Star className="h-6 w-6 fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {selectedRide === ride.id ? (
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Share your experience..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="min-h-[100px]"
                          />
                          <div className="flex space-x-2">
                            <Button onClick={() => handleSubmitFeedback(ride.id, ride.driver?.name || "N/A")}>
                              Submit Feedback
                            </Button>
                            <Button variant="ghost" onClick={() => setSelectedRide(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="outline" className="w-full" onClick={() => setSelectedRide(ride.id)}>
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Leave Feedback
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground text-center">No completed rides found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}