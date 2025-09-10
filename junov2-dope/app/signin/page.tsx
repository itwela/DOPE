"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [step, setStep] = useState<"signUp" | "signIn">("signIn");
  const [isLoading, setIsLoading] = useState(false);
  
  // Check authentication status
  const currentUser = useQuery(api.auth.isAuthenticated, {});

  // Redirect to home if already authenticated
  useEffect(() => {
    if (currentUser === true) {
      console.log("currentUser", currentUser);
      router.push("/");
    }
  }, [currentUser, router]);

  // Don't render the form if user is already authenticated
  if (currentUser === true) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      void signIn("password", formData);
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
      console.log("isLoading", isLoading);
      console.log("currentUser", currentUser);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="bg-accent text-white px-3 py-1 rounded-full text-xs font-medium mb-4 select-none">
          {step === "signIn" ? "Sign In" : "Sign Up"}
        </div>
        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl select-none font-bold text-[#EB1416] mb-2">DOPE Agent Playground</h1>
          <p className="text-gray-600 select-none text-sm">
            {step === "signIn" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block select-none text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block select-none text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
            />
          </div>

          <input name="flow" type="hidden" value={step} />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full cursor-pointer select-none bg-accent hover:bg-accent-hover text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {step === "signIn" ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              step === "signIn" ? "Sign in" : "Create account"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setStep(step === "signIn" ? "signUp" : "signIn")}
            className="text-sm cursor-pointer select-none text-gray-600 hover:text-accent transition-colors"
          >
            {step === "signIn" 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"
            }
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
