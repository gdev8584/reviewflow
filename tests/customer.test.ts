import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";

async function seedCustomers(count: number): Promise<string[]> {
  const ids: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const response = await request(app)
      .post("/api/customers")
      .send({
        name: `Pagination Customer ${randomUUID()}`,
        email: `pagination-${randomUUID()}@example.com`
      });
    expect(response.status).toBe(201);
    ids.push(response.body.data.id);
  }

  return ids;
}

describe("customer API", () => {
  it("returns a healthy status", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("creates and retrieves a customer", async () => {
    const email = `dev-${randomUUID()}@gmail.com`;
    const created = await request(app)
      .post("/api/customers")
      .send({ name: "Devanand", email });

    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ name: "Devanand", email });
    expect(created.body.data.id).toBeTypeOf("string");

    const fetched = await request(app).get(`/api/customers/${created.body.data.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.id).toBe(created.body.data.id);
  });

  it("lists customers with default pagination values", async () => {
    await seedCustomers(11);
    const response = await request(app).get("/api/customers");

    expect(response.status).toBe(200);
    expect(response.body.pagination.limit).toBe(10);
    expect(response.body.pagination.offset).toBe(0);
    expect(response.body.pagination.total).toBeGreaterThanOrEqual(11);
    expect(response.body.pagination.hasMore).toBe(true);
    expect(response.body.data).toHaveLength(10);
  });

  it("returns the requested customer page and pagination metadata", async () => {
    const seededIds = await seedCustomers(4);
    const baseline = await request(app)
      .get("/api/customers")
      .query({ limit: 100, offset: 0 });
    const firstSeededIndex = baseline.body.data.findIndex(
      (customer: { id: string }) => customer.id === seededIds[0]
    );
    const offset = firstSeededIndex + 1;
    const expectedPage = baseline.body.data.slice(offset, offset + 2);
    const response = await request(app)
      .get("/api/customers")
      .query({ limit: 2, offset });

    expect(firstSeededIndex).toBeGreaterThanOrEqual(0);
    expect(expectedPage).toHaveLength(2);
    expect(response.status).toBe(200);
    expect(response.body.data.map((customer: { id: string }) => customer.id)).toEqual(seededIds.slice(1, 3));
    expect(response.body.data).toHaveLength(2);
    expect(response.body.pagination).toEqual({
      limit: 2,
      offset,
      total: baseline.body.pagination.total,
      hasMore: offset + 2 < baseline.body.pagination.total
    });
  });

  it.each([
    ["limit", "0"],
    ["limit", "101"],
    ["limit", "1.5"],
    ["limit", "invalid"],
    ["offset", "-1"]
  ])("rejects invalid pagination query %s=%s", async (key, value) => {
    const response = await request(app)
      .get("/api/customers")
      .query({ [key]: value });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns an empty page when the offset is beyond the last customer", async () => {
    const response = await request(app)
      .get("/api/customers")
      .query({ limit: 10, offset: 1_000_000 });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination).toMatchObject({
      limit: 10,
      offset: 1_000_000,
      hasMore: false
    });
    expect(response.body.pagination.total).toBeGreaterThanOrEqual(0);
  });

  it("rejects an invalid email address", async () => {
    const response = await request(app)
      .post("/api/customers")
      .send({ name: "Devanand", email: "not-an-email" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects an update with no fields", async () => {
    const response = await request(app)
      .patch("/api/customers/non-existent-id")
      .send({});

    expect(response.status).toBe(400);
  });

  it("returns 404 for an unknown customer", async () => {
    const response = await request(app).get("/api/customers/unknown-id");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("CUSTOMER_NOT_FOUND");
  });
});
