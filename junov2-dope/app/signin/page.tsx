"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Command,
  // CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  // CommandSeparator,
  // CommandShortcut,
} from "@/components/ui/command";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [step, setStep] = useState<"signUp" | "signIn">("signIn");
  const [isLoading, setIsLoading] = useState(false);
  const [organization, setOrganization] = useState("");
  const [orgSearch, setOrgSearch] = useState("");
  const [name, setName] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  
  // Check authentication status
  const currentUser = useQuery(api.auth.isAuthenticated, {});

  // Redirect to home if already authenticated
  useEffect(() => {
    if (currentUser === true) {
      console.log("currentUser", currentUser);
      router.push("/");
    }
  }, [currentUser, router]);

  // Load employee profiles only when needed for DOPE Marketing selection
  const employeeProfiles = useQuery(
    api.employeeProfiles.getAllEmployeeProfiles,
    step === "signUp" && organization.trim().toLowerCase() === "dope marketing" ? {} : "skip"
  );

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
    <div className="min-h-screen h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl h-[80%] grid grid-cols-1 md:grid-cols-2 rounded-xl border border-gray-200 bg-white shadow overflow-hidden">
  
          {/* Left panel: form */}
          <div className="p-8 md:p-10 overflow-y-scroll">
      
            <div className="mb-4">
              <span className="inline-block bg-[#EB1416] text-white px-3 py-1 rounded-full text-xs font-medium select-none">
                {step === "signIn" ? "Sign In" : "Sign Up"}
              </span>
            </div>

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

              {step === "signUp" && (
                <div>
                  <label className="block select-none text-sm font-medium text-gray-700 mb-1">
                    Organization
                  </label>
                  <div className="border border-gray-300 rounded-lg">
                    <Command>
                      <CommandInput
                        placeholder="Search or type your organization..."
                        value={orgSearch}
                        onValueChange={setOrgSearch}
                      />
                      <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        {orgSearch && (
                          <CommandGroup heading="Custom">
                            <CommandItem onSelect={() => { setOrganization(orgSearch); setOrgSearch(orgSearch); }}>
                              Use &quot;{orgSearch}&quot; as your organization
                            </CommandItem>
                          </CommandGroup>
                        )}
                        <CommandGroup heading="Suggestions">
                          <CommandItem onSelect={() => { setOrganization("DOPE Marketing"); setOrgSearch("DOPE Marketing"); }}>
                            DOPE Marketing
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </div>
                  {organization && (
                    <p className="mt-2 text-xs text-gray-600">
                      Selected: <span className="font-semibold text-[#EB1416]">{organization}</span>
                    </p>
                  )}
                  <input type="hidden" name="organization" value={organization} />
                </div>
              )}

              {step === "signUp" && (
                <div>
                  <label className="block select-none text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  {organization.trim().toLowerCase() === "dope marketing" ? (
                    <>
                      <div className="border border-gray-300 rounded-lg">
                        <Command>
                          <CommandInput
                            placeholder="Search your name..."
                            value={nameSearch}
                            onValueChange={setNameSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            <CommandGroup heading="Employees">
                              {(employeeProfiles || [])
                                .filter((p) => (p.organization || "").trim().toLowerCase() === "dope marketing")
                                .filter((p) =>
                                  nameSearch.trim() === ""
                                    ? true
                                    : p.name.toLowerCase().includes(nameSearch.trim().toLowerCase()),
                                )
                                .map((p) => (
                                  <CommandItem
                                    key={p._id as unknown as string}
                                    onSelect={() => {
                                      setName(p.name);
                                      setNameSearch(p.name);
                                    }}
                                  >
                                    {p.name}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </div>
                      {name && (
                        <p className="mt-2 text-xs text-gray-600">
                          Selected: <span className="font-semibold text-[#EB1416]">{name}</span>
                        </p>
                      )}
                      <input type="hidden" name="name" value={name} />
                    </>
                  ) : (
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Your full name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                    />
                  )}
                </div>
              )}

              <input name="flow" type="hidden" value={step} />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full cursor-pointer select-none bg-[#EB1416] text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
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
                className="text-sm cursor-pointer select-none text-gray-600 hover:text-[#EB1416] transition-colors"
              >
                {step === "signIn" 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </div>

          {/* Right panel: visual placeholder */}
          <div className="hidden md:block bg-gray-100 relative">
            <div className="absolute inset-0 flex items-center justify-center">
            </div>
          </div>

      </div>
    </div>
  );
}
