// API tests against the real routes and a real database (local Docker, or Postgres in CI).
// They expect the seed data (`npx prisma db seed`) and clean up everything they create.
// Run: npm test
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { config } from "../config";
import { prisma } from "../db/client";
import { startTestServer, type TestServer } from "./testServer";

let server: TestServer;
const createdDeviceIds: string[] = [];

before(async () => {
  server = await startTestServer();
});

after(async () => {
  // Deleting a device also deletes its follows (onDelete: Cascade in the schema).
  await prisma.device.deleteMany({ where: { id: { in: createdDeviceIds } } });
  await server.close();
  await prisma.$disconnect(); // otherwise open database connections keep the test process alive
});

function get(path: string, headers: Record<string, string> = {}) {
  return fetch(`${server.url}${path}`, { headers });
}

function send(method: "POST" | "DELETE", path: string, body: unknown, headers: Record<string, string> = {}) {
  return fetch(`${server.url}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function newDeviceId(): string {
  const id = randomUUID();
  createdDeviceIds.push(id);
  return id;
}

describe("public routes", () => {
  test("GET /health reports the database as ok", async () => {
    const response = await get("/health");
    assert.equal(response.status, 200);
    const body = (await response.json()) as { status: string; database: string };
    assert.equal(body.database, "ok");
  });

  test("GET /products lists the seeded products with their markets", async () => {
    const response = await get("/products");
    assert.equal(response.status, 200);
    const products = (await response.json()) as { slug: string; markets: { marketCode: string }[] }[];
    const solein = products.find((p) => p.slug === "solein");
    assert.ok(solein, "Solein is seeded");
    assert.deepEqual(solein.markets.map((m) => m.marketCode).sort(), ["EU", "SG", "US"]);
  });

  test("GET /products/:slug returns timelines with date-only event dates and sources", async () => {
    const response = await get("/products/solein");
    assert.equal(response.status, 200);
    const product = (await response.json()) as { markets: { events: { eventDate: string; sourceUrl: string }[] }[] };
    const events = product.markets.flatMap((m) => m.events);
    assert.ok(events.length > 0);
    for (const event of events) {
      assert.match(event.eventDate, /^\d{4}-\d{2}-\d{2}$/, "no time or timezone in event dates");
      assert.match(event.sourceUrl, /^https:\/\//, "ground rule 3: every event has a source");
    }
  });

  test("GET /products/:slug answers 404 for an unknown product", async () => {
    const response = await get("/products/does-not-exist");
    assert.equal(response.status, 404);
  });

  test("GET /markets includes markets without products (UK) and their regions", async () => {
    const markets = (await (await get("/markets")).json()) as { code: string; region: string }[];
    assert.equal(markets.find((m) => m.code === "UK")?.region, "EUROPE");
  });
});

describe("devices and follows", () => {
  test("POST /devices registers a device, twice is fine, bad input is 400", async () => {
    const id = newDeviceId();
    assert.equal((await send("POST", "/devices", { id })).status, 204);
    assert.equal((await send("POST", "/devices", { id })).status, 204);
    assert.equal((await send("POST", "/devices", { id: "not-a-uuid" })).status, 400);
    assert.equal((await send("POST", "/devices", { id, expoPushToken: "nope" })).status, 400);
  });

  test("follow, list, follow again (no duplicate), unfollow", async () => {
    const deviceId = newDeviceId();
    assert.equal((await send("POST", "/follows", { deviceId, productSlug: "solein" })).status, 204);
    assert.equal((await send("POST", "/follows", { deviceId, productSlug: "solein" })).status, 204);

    const follows = (await (await get(`/devices/${deviceId}/follows`)).json()) as unknown[];
    assert.equal(follows.length, 1, "following twice must not create two rows (Postgres NULL uniqueness)");

    assert.equal((await send("DELETE", "/follows", { deviceId, productSlug: "solein" })).status, 204);
    assert.deepEqual(await (await get(`/devices/${deviceId}/follows`)).json(), []);
  });

  test("following an unknown product is 404", async () => {
    const response = await send("POST", "/follows", { deviceId: newDeviceId(), productSlug: "does-not-exist" });
    assert.equal(response.status, 404);
  });
});

describe("admin routes", () => {
  const admin = { Authorization: `Bearer ${config.adminToken}` };

  test("no token or a wrong token is 401; the right token is accepted", async () => {
    assert.equal((await get("/admin/check")).status, 401);
    assert.equal((await get("/admin/check", { Authorization: "Bearer wrong" })).status, 401);
    assert.equal((await get("/admin/check", admin)).status, 204);
  });

  test("approve publishes a pending update exactly once; reject needs a reason", async () => {
    const status = await prisma.productMarketStatus.findFirstOrThrow({
      where: { product: { slug: "nmn" }, marketCode: "EU" },
    });
    const makePending = () =>
      prisma.pendingUpdate.create({
        data: {
          productMarketStatusId: status.id,
          proposedStage: "AUTHORISED",
          eventDate: new Date("2027-01-15"),
          title: "[TEST] API test update",
          summary: "Created by api.test.ts and removed afterwards.",
          sourceUrl: "https://example.com/ripe-api-test",
          sourceType: "OFFICIAL",
          evidenceQuote: "test quote",
          origin: "SOURCE_CHECK",
        },
      });

    const toApprove = await makePending();
    const toReject = await makePending();
    try {
      const approve = () => send("POST", `/admin/pending-updates/${toApprove.id}/approve`, {}, admin);
      assert.equal((await approve()).status, 200);
      assert.equal((await approve()).status, 409, "a second approve must not publish twice");

      const event = await prisma.statusEvent.findFirst({ where: { sourceUrl: "https://example.com/ripe-api-test" } });
      assert.equal(event?.publishedBy, "ADMIN");

      const reject = (body: unknown) => send("POST", `/admin/pending-updates/${toReject.id}/reject`, body, admin);
      assert.equal((await reject({})).status, 400);
      assert.equal((await reject({ reviewNote: "Test reason" })).status, 204);
    } finally {
      // Undo: remove the test rows and put the real stage back.
      await prisma.statusEvent.deleteMany({ where: { sourceUrl: "https://example.com/ripe-api-test" } });
      await prisma.pendingUpdate.deleteMany({ where: { id: { in: [toApprove.id, toReject.id] } } });
      await prisma.productMarketStatus.update({ where: { id: status.id }, data: { currentStage: status.currentStage } });
    }
  });
});
