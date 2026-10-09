import { randomUUID } from "node:crypto";
import type {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput
} from "../utils/customer.types";

export class CustomerRepository {
  private readonly customers = new Map<string, Customer>();

  list(): Customer[] {
    return [...this.customers.values()].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
  }

  findById(id: string): Customer | undefined {
    return this.customers.get(id);
  }

  findByEmail(email: string): Customer | undefined {
    const normalizedEmail = email.toLowerCase();
    return [...this.customers.values()].find(
      (customer) => customer.email.toLowerCase() === normalizedEmail
    );
  }

  create(input: CreateCustomerInput): Customer {
    const now = new Date().toISOString();
    const customer: Customer = {
      id: randomUUID(),
      name: input.name,
      email: input.email,
      createdAt: now,
      updatedAt: now
    };

    this.customers.set(customer.id, customer);
    return customer;
  }

  update(id: string, input: UpdateCustomerInput): Customer | undefined {
    const existing = this.customers.get(id);
    if (!existing) return undefined;

    const updated: Customer = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString()
    };

    this.customers.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.customers.delete(id);
  }

  clear(): void {
    this.customers.clear();
  }
}
