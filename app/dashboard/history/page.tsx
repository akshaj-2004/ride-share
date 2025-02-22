"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    rating: number;
  }; // Make driver optional
  feedback?: string; // Optional feedback field
  ratings?: {
    driver: number; // Optional driver rating
  };
};

export default function RideHistoryPage() {
  const [rideHistory, setRideHistory] = useState<RideHistory[]>([]);

  useEffect(() => {
    // Ensure localStorage is available (client-side only)
    if (typeof window !== "undefined") {
      try {
        const history = JSON.parse(localStorage.getItem("rideHistory") || "[]");
        // Validate the data structure
        if (Array.isArray(history)) {
          setRideHistory(history);
        } else {
          console.error("Invalid ride history data structure");
        }
      } catch (error) {
        console.error("Failed to parse ride history from localStorage", error);
      }
    }
  }, []);

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Ride History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Your recent rides</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Driver Rating</TableHead> {/* Add Driver Rating column */}
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rideHistory.length > 0 ? (
                rideHistory.map((ride, index) => (
                  <TableRow key={ride.id || index}>
                    <TableCell>{ride.from}</TableCell>
                    <TableCell>{ride.to}</TableCell>
                    <TableCell>{ride.type}</TableCell>
                    <TableCell>{ride.cost}</TableCell>
                    <TableCell
                      className={
                        ride.status === "Completed"
                          ? "text-green-500"
                          : ride.status === "Ongoing"
                          ? "text-yellow-500"
                          : "text-red-500"
                      }
                    >
                      {ride.status}
                    </TableCell>
                    <TableCell>{ride.driver?.name || "N/A"}</TableCell> {/* Display driver name or "N/A" if undefined */}
                    <TableCell>⭐ {ride.driver?.rating || "N/A"}</TableCell> {/* Display driver rating or "N/A" if undefined */}
                    <TableCell>{ride.date}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    No ride history found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}