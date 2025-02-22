"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type Ride = {
  from: string;
  to: string;
  type: string;
  cost: string;
  status: string;
  date: string;
};

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe"); // Default to Stripe
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false); // Add state for dark mode

  // Check for dark mode after the component mounts (client-side)
  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"));
  }, []);

  // Dynamic styles for CardElement based on light/dark mode
  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: isDarkMode ? "#ffffff" : "#000000", // Text color (white in dark mode, black in light mode)
        fontSize: "16px",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        "::placeholder": {
          color: isDarkMode ? "#a0aec0" : "#6b7280", // Placeholder color (gray in dark mode, gray in light mode)
        },
        iconColor: isDarkMode ? "#ffffff" : "#000000", // Icon color (white in dark mode, black in light mode)
      },
      invalid: {
        color: "#ff5252", // Error color (red for both modes)
        iconColor: "#ff5252",
      },
    },
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(""); // Clear previous messages

    try {
      if (paymentMethod === "stripe") {
        // Handle Stripe payment
        if (!stripe || !elements) {
          throw new Error("Stripe has not been initialized.");
        }

        const response = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 10.0, paymentMethod: "stripe" }), // Example amount
        });

        const { clientSecret, error } = await response.json();

        if (error) {
          setMessage(error);
          toast({ title: "Payment Error", description: error, variant: "destructive" });
          return;
        }

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: elements.getElement(CardElement)! },
        });

        if (stripeError) {
          setMessage(stripeError.message || "An unknown error occurred");
          toast({ title: "Payment Failed", description: stripeError.message || "An unknown error occurred", variant: "destructive" });
        } else {
          setMessage("Payment successful!");
          toast({ title: "Payment Successful", description: "Your payment was processed successfully!" });

          // Update ride status in local storage (client-side only)
          if (typeof window !== "undefined") {
            const rideHistory: Ride[] = JSON.parse(localStorage.getItem("rideHistory") || "[]");
            const latestRide = rideHistory[rideHistory.length - 1]; // Get the latest ride
            if (latestRide) {
              latestRide.status = "Completed"; // Update status to "Completed"
              localStorage.setItem("rideHistory", JSON.stringify(rideHistory));
            }
          }
        }
      } else if (paymentMethod === "paytm" || paymentMethod === "phonepay" || paymentMethod === "gpay") {
        // Simulate redirection to external payment gateway
        setMessage(`You will be redirected to ${paymentMethod.toUpperCase()} to complete your payment.`);
        toast({ title: "Redirecting", description: `You will be redirected to ${paymentMethod.toUpperCase()}.` });

        // Simulate a delay before redirection
        setTimeout(() => {
          setMessage("Payment successful!");
          toast({ title: "Payment Successful", description: "Your payment was processed successfully!" });

          // Update ride status in local storage (client-side only)
          if (typeof window !== "undefined") {
            const rideHistory: Ride[] = JSON.parse(localStorage.getItem("rideHistory") || "[]");
            const latestRide = rideHistory[rideHistory.length - 1]; // Get the latest ride
            if (latestRide) {
              latestRide.status = "Completed"; // Update status to "Completed"
              localStorage.setItem("rideHistory", JSON.stringify(rideHistory));
            }
          }
        }, 3000); // Simulate a 3-second delay
      } else if (paymentMethod === "cash") {
        // Handle cash payment
        setMessage("Payment successful!");
        toast({ title: "Cash Payment", description: "Your payment will be collected in cash." });

        // Update ride status in local storage (client-side only)
        if (typeof window !== "undefined") {
          const rideHistory: Ride[] = JSON.parse(localStorage.getItem("rideHistory") || "[]");
          const latestRide = rideHistory[rideHistory.length - 1]; // Get the latest ride
          if (latestRide) {
            latestRide.status = "Completed"; // Update status to "Completed"
            localStorage.setItem("rideHistory", JSON.stringify(rideHistory));
          }
        }
      }
    } catch (error: any) {
      setMessage(error.message);
      toast({ title: "Payment Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="stripe" id="stripe" />
          <Label htmlFor="stripe">Credit/Debit Card (Stripe)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="paytm" id="paytm" />
          <Label htmlFor="paytm">Paytm</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="phonepay" id="phonepay" />
          <Label htmlFor="phonepay">PhonePe</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="gpay" id="gpay" />
          <Label htmlFor="gpay">Google Pay</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="cash" id="cash" />
          <Label htmlFor="cash">Cash</Label>
        </div>
      </RadioGroup>

      {paymentMethod === "stripe" && (
        <div className="border rounded-md p-3 bg-gray-100 dark:bg-gray-800">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Processing..." : "Pay Now"}
      </Button>

      {message && (
        <p className={`text-center ${message.includes("success") ? "text-green-500" : "text-red-500"}`}>
          {message}
        </p>
      )}
    </form>
  );
};

export default function PaymentsPage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Make a Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise}>
            <CheckoutForm />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}