"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

// const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const convex = new ConvexReactClient('https://silent-seal-180.convex.cloud');

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
