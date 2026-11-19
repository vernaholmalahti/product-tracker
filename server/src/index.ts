// Entry point for the Ripe API server: builds the app and starts listening.
import { createApp } from "./api/app";
import { config } from "./config";

// Port comes from server/.env (PORT), default 4000.
// 3000 is often taken by other dev servers; Expo uses 8081.
const port = config.port;

createApp().listen(port, () => {
  console.log(`Ripe API listening on http://localhost:${port}`);
});
