import type { Metadata } from "next";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import AgentProvider from "./providers/agentProvider";

export const metadata: Metadata = {
  title: "DOPE Agent Playground",
  description: "Build and deploy your custom AI agents",
  icons: {
    icon: "/convex.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        <ConvexClientProvider>
          <AgentProvider>
            {children}
          </AgentProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
