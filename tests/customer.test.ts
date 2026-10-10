import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";

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
    const response = await request(app).get("/api/customers");

    expect(response.status).toBe(200);
    expect(response.body.pagination).toEqual({
      limit: 10,
      offset: 0,
      total: response.body.pagination.total,
      hasMore: response.body.pagination.total > response.body.data.length
    });
    expect(response.body.data).toHaveLength(Math.min(10, response.body.pagination.total));
  });

  it("returns the requested customer page and pagination metadata", async () => {
    const baseline = await request(app)
      .get("/api/customers")
      .query({ limit: 100, offset: 0 });
    const response = await request(app)
      .get("/api/customers")
      .query({ limit: 2, offset: 1 });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(baseline.body.data.slice(1, 3));
    expect(response.body.pagination).toEqual({
      limit: 2,
      offset: 1,
      total: baseline.body.pagination.total,
      hasMore: 3 < baseline.body.pagination.total
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
