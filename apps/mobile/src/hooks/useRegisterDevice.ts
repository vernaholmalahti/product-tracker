import { useEffect } from "react";
import { registerDevice } from "@/api/client";
import { getDeviceId } from "@/device/deviceId";

// Tells the server about this device once per app start.
// Browsing works without it, so a failure is only logged (it retries on the next start).
export function useRegisterDevice() {
  useEffect(() => {
    getDeviceId()
      .then(registerDevice)
      .catch((error: unknown) => console.warn("Device registration failed:", error));
  }, []);
}
