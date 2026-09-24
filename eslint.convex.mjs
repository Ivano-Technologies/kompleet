import convexPlugin from "@convex-dev/eslint-plugin";

/** Convex-only flat config. Run: `pnpm exec eslint -c eslint.convex.mjs convex` */
export default [...convexPlugin.configs.recommended];
