import { Password } from "@convex-dev/auth/providers/Password";
import type { DataModel } from "./_generated/dataModel";

export default Password<DataModel>({
  profile(params, _ctx) {
    return {
      email: params.email as string,
      name: (params as any).name as string,
      role: (params as any).role as string,
      organization: (params as any).organization as string,
    } as any;
  },
});


