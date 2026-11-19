import { useCallback, useEffect, useState } from "react";
import { followProduct, getFollows, registerDevice, unfollowProduct } from "@/api/client";
import { getDeviceId } from "@/device/deviceId";
import { getPushToken } from "@/notifications/pushToken";

// Asks for notification permission and sends the push token to the server.
// Called when the user follows something – the moment they understand why we ask.
// Following still works if they say no; they just won't get push notifications.
async function enablePushNotifications(deviceId: string): Promise<void> {
  const token = await getPushToken();
  if (token) await registerDevice(deviceId, token);
}

// Follow state for one product: whether this device follows it, and a toggle.
export function useFollow(productSlug: string) {
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(true); // true while loading the state or saving a change
  const [error, setError] = useState<string | null>(null);

  // Load the current state once.
  useEffect(() => {
    let cancelled = false; // ignore the answer if the screen was closed meanwhile
    getDeviceId()
      .then(getFollows)
      .then((follows) => {
        if (!cancelled) setFollowing(follows.some((f) => f.productSlug === productSlug && f.marketCode === null));
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load follow status.");
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true; // cleanup function: runs when the screen unmounts
    };
  }, [productSlug]);

  const toggle = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const deviceId = await getDeviceId();
      if (following) {
        await unfollowProduct(deviceId, productSlug);
        setFollowing(false);
      } else {
        await followProduct(deviceId, productSlug);
        setFollowing(true);
        await enablePushNotifications(deviceId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }, [following, productSlug]);

  return { following, busy, error, toggle };
}
