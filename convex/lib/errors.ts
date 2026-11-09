import { ConvexError } from "convex/values";

export const FORBIDDEN = "FORBIDDEN";

export function throwForbidden(): never {
  throw new ConvexError(FORBIDDEN);
}
