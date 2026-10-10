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


    it("rejects updating a customer with another customer's email", async () => {
        const first = await request(app)
            .post("/api/customers")
            .send({
                name: "Customer One",
                email: `first-${randomUUID()}@example.com`,
            });

        const second = await request(app)
            .post("/api/customers")
            .send({
                name: "Customer Two",
                email: `second-${randomUUID()}@example.com`,
            });

        const response = await request(app)
            .patch(`/api/customers/${second.body.data.id}`)
            .send({ email: first.body.data.email });

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
    });

    it("allows a customer to keep their existing email", async () => {
        const email = `existing-${randomUUID()}@example.com`;

        const created = await request(app)
            .post("/api/customers")
            .send({ name: "Asha Rao", email });

        const response = await request(app)
            .patch(`/api/customers/${created.body.data.id}`)
            .send({ email });

        expect(response.status).toBe(200);
        expect(response.body.data.email).toBe(email);
    });

    it("updates and persists a customer's name and email", async () => {
        const originalEmail = `original-${randomUUID()}@example.com`;
        const updatedEmail = `updated-${randomUUID()}@example.com`;
        const created = await request(app)
            .post("/api/customers")
            .send({ name: "Original Name", email: originalEmail });

        const response = await request(app)
            .patch(`/api/customers/${created.body.data.id}`)
            .send({ name: "Updated Name", email: updatedEmail });

        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({
            id: created.body.data.id,
            name: "Updated Name",
            email: updatedEmail
        });

        const fetched = await request(app).get(`/api/customers/${created.body.data.id}`);
        expect(fetched.body.data).toMatchObject({ name: "Updated Name", email: updatedEmail });
    });

    it("rejects an update when the customer does not exist", async () => {
        const response = await request(app)
            .patch(`/api/customers/${randomUUID()}`)
            .send({ name: "Updated Name" });

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("CUSTOMER_NOT_FOUND");
    });

});
