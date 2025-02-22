"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CarFront, Loader2 } from "lucide-react";
import Link from "next/link";


const LoginForm = ({ onSubmit, loading, username, setUsername, password, setPassword }: {
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="username">Username</Label>
      <Input
        id="username"
        type="text"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="password">Password</Label>
      <Input
        id="password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
    </div>
    <Button type="submit" className="w-full" disabled={loading}>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
    </Button>
  </form>
);

// Reusable GoogleSignInButton component
const GoogleSignInButton = ({ onClick, loading }: {
  onClick: () => Promise<void>;
  loading: boolean;
}) => (
  <Button variant="secondary" className="w-full" onClick={onClick} disabled={loading}>
    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in with Google"}
  </Button>
);

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false); // Separate loading state for login form
  const [googleLoading, setGoogleLoading] = useState(false); // Separate loading state for Google Sign-In
  const { toast } = useToast();
  const router = useRouter();

  // Handle login with DummyJSON API
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const response = await fetch("https://dummyjson.com/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        toast({ title: "Success!", description: "You have been logged in successfully." });
        router.push("/dashboard");
      } else {
        throw new Error(data.message || "Invalid credentials");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      toast({ variant: "destructive", title: "Google Sign-In Failed", description: "Try again later." });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <CarFront className="h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl font-semibold">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Login Form */}
          <LoginForm
            onSubmit={handleLogin}
            loading={loginLoading}
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
          />

          {/* Divider */}
          <div className="flex items-center my-4">
            <hr className="w-full border-gray-300" />
            <span className="px-2 text-gray-500 text-sm">OR</span>
            <hr className="w-full border-gray-300" />
          </div>

          {/* Google Sign-In Button */}
          <GoogleSignInButton onClick={handleGoogleSignIn} loading={googleLoading} />

          {/* Register Link */}
          <div className="mt-4 text-center text-sm">
          <p>Don&apos;t have an account?</p>
            <Link href="/auth/register" className="text-primary hover:underline">
              Create one
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}