'use server';

import Replicate from "replicate";

// Initialise Replicate with whichever token is available (server or public)
const replicate = new Replicate({
  auth:
    process.env.REPLICATE_API_TOKEN ||
    process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN,
});

export const handleReplicateStream = async (model: `${string}/${string}` | `${string}/${string}:${string}`, input: unknown) => {
  let result = '';
  for await (const event of replicate.stream(model, { input: input as object })) {
    result += event.toString();
  }
  return result;
};