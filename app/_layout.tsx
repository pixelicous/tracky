import { Stack } from "expo-router";
import RootNavigator from "./src/navigation";
import { Provider } from "react-redux";
import { store } from "./src/store";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}
