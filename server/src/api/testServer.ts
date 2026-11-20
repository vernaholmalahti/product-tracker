// Test helper: runs the real Express app on a random free port, so tests send real HTTP
// requests (headers, JSON parsing, status codes) without a separate server running.
// This is why createApp() and listen() were kept apart in Phase 0.
import type { AddressInfo } from "node:net";
import { createApp } from "./app";

export type TestServer = {
  url: string; // e.g. "http://127.0.0.1:53712"
  close: () => Promise<void>;
};

export function startTestServer(): Promise<TestServer> {
  return new Promise((resolve) => {
    const server = createApp().listen(0, "127.0.0.1", () => {
      // Port 0 = "any free port"; the operating system picks one.
      const { port } = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}
