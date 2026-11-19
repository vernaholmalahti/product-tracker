import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

function openProductFrom(response: Notifications.NotificationResponse): void {
  const slug = response.notification.request.content.data?.productSlug;
  if (typeof slug === "string") {
    router.push({ pathname: "/product/[slug]", params: { slug } });
  }
}

// When the user taps a Ripe notification, open the product it is about.
// The server puts { productSlug } in the notification's data (notifyFollowers.ts).
export function useNotificationTaps() {
  useEffect(() => {
    if (Platform.OS === "web") return; // no push notifications in the browser

    // The app was closed and opened by tapping a notification.
    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) openProductFrom(lastResponse);

    // The app was open or in the background when the notification was tapped.
    const subscription = Notifications.addNotificationResponseReceivedListener(openProductFrom);
    return () => subscription.remove(); // stop listening when the layout unmounts
  }, []);
}
