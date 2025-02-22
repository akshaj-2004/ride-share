"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapIcon, CarFront } from "lucide-react";
import Link from "next/link";

// Reusable FeatureCard component
const FeatureCard = ({ title, description, icon: Icon, children }: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <Icon className="h-12 w-12 text-primary mb-4" />
      <p className="text-muted-foreground">{children}</p>
    </CardContent>
  </Card>
);

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center space-y-8 mb-16">
          <CarFront className="h-16 w-16 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            RideShare
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Experience seamless ride-sharing with real-time tracking, multiple payment options, 
            and the ability to share rides with others.
          </p>
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="outline" size="lg">Create Account</Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <FeatureCard
            title="Easy Booking"
            description="Book your ride in just a few clicks"
            icon={MapIcon}
          >
            Set your pickup and destination locations easily with our interactive map interface.
          </FeatureCard>

          <FeatureCard
            title="Multiple Options"
            description="Choose what suits you best"
            icon={CarFront}
          >
            Select from various ride types including economy and premium options.
          </FeatureCard>

          <FeatureCard
            title="Ride Sharing"
            description="Share rides and split costs"
            icon={MapIcon}
          >
            Share your ride with others heading in the same direction and split the fare.
          </FeatureCard>
        </div>
      </div>
    </main>
  );
}