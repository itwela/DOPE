import type { Metadata } from "next";
import "./globals.css";
import ConvexClientProvider from "@/app/providers/ConvexClientProvider";
import AgentProvider from "./providers/AgentProvider";
import ToastProvider from "./providers/ToastProvider";

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
            <ToastProvider>
              {children}
            </ToastProvider>
          </AgentProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
