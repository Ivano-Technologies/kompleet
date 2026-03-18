import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const env = process.env.APP_ENV ?? "development";
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const IS_DEV = env === "development";
  const IS_PREVIEW = env === "preview";
  const IS_PROD = env === "production";

  const APP_NAME = IS_PROD
    ? "Kompleet"
    : IS_PREVIEW
    ? "Kompleet Preview"
    : "Kompleet Dev";

  const BUNDLE_ID = IS_PROD
    ? "com.ivanotechnologies.kompleet"
    : IS_PREVIEW
    ? "com.ivano.kompleet.preview"
    : "com.ivano.kompleet.dev";

  return {
    ...config,

    name: APP_NAME,
    slug: "kompleet-platform",
    owner: "techivano",

    version: "1.0.0",
    runtimeVersion: "1.0.0",

    scheme: "kompleet",

    ios: {
      bundleIdentifier: BUNDLE_ID,
      buildNumber: "1",
      supportsTablet: true
    },

    android: {
      package: BUNDLE_ID,
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000"
      }
    },

    plugins: [
      "expo-updates",
      "@react-native-firebase/app"
    ],

    updates: {
      url: "https://u.expo.dev/9f1ff663-b1b6-4bfb-9a9f-f6d55ad05107"
    },

    extra: {
      appEnv: env,
      supabaseUrl,
      supabaseAnonKey,
      eas: {
        projectId: "9f1ff663-b1b6-4bfb-9a9f-f6d55ad05107"
      }
    }
  };
};