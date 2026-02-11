import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// Extract plugins from the Next.js config to use in rule overrides
const reactConfig = nextCoreWebVitals.find(c => c.plugins?.react);
const reactPlugin = reactConfig?.plugins?.react;
const hooksConfig = nextCoreWebVitals.find(c => c.plugins?.["react-hooks"]);
const hooksPlugin = hooksConfig?.plugins?.["react-hooks"];

export default [
  ...nextCoreWebVitals,
  {
    plugins: {
      react: reactPlugin,
      "react-hooks": hooksPlugin,
    },
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unescaped-entities": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];
