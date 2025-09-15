import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import CustomPasswordProvider from "./CustomProfile";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [CustomPasswordProvider],
});

// Returns the current user's identity details (or null if unauthenticated)
export const currentUser = query({
  args: {},
  returns: v.union(
    v.object({
      subject: v.string(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    // Load identity and user document
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;

    

    return {
      subject: identity.subject,
      name: (user as any)?.name ?? identity.name,
      email: (user as any)?.email,
    };
  },
});
