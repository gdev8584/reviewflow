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
