import { Stack } from "expo-router";
import PremiumFeaturesScreen from "./src/screens/premium/PremiumFeaturesScreen";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="src/screens/premium/PremiumFeaturesScreen"
        options={{ title: "Premium Features" }}
      />
    </Stack>
  );
}
