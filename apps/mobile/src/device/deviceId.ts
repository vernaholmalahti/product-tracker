import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";

const STORAGE_KEY = "ripe.deviceId";

// The anonymous ID that identifies this phone to our server (no login, no personal data).
// Created once on first start and stored on the device; deleting the app resets it.
export async function getDeviceId(): Promise<string> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  if (saved) return saved;

  const created = randomUUID();
  await AsyncStorage.setItem(STORAGE_KEY, created);
  return created;
}
