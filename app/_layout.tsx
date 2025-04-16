import { Stack } from "expo-router";
import PremiumFeaturesScreen from "./src/screens/premium/PremiumFeaturesScreen";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
