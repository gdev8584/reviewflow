import { CustomerRepository } from "../repository/customer.respository";
import type { CreateCustomerInput, UpdateCustomerInput } from "../utils/customer.types";

export class CustomerError extends Error {
  constructor(
    public readonly code: "CUSTOMER_NOT_FOUND" | "EMAIL_ALREADY_EXISTS",
    message: string
  ) {
    super(message);
    this.name = "CustomerError";
  }
}

export class CustomerService {
  constructor(private readonly repository: CustomerRepository) {}

  listCustomers(limit: number, offset: number) {
    return this.repository.list(limit, offset);
  }

  getCustomer(id: string) {
    const customer = this.repository.findById(id);
    if (!customer) {
      throw new CustomerError("CUSTOMER_NOT_FOUND", "Customer not found");
    }
    return customer;
  }

  createCustomer(input: CreateCustomerInput) {
    if (this.repository.findByEmail(input.email)) {
      throw new CustomerError("EMAIL_ALREADY_EXISTS", "A customer with this email already exists");
    }
    return this.repository.create(input);
  }

  updateCustomer(id: string, input: UpdateCustomerInput) {
    const existing = this.getCustomer(id);

    if (input.email && input.email.toLowerCase() !== existing.email.toLowerCase()) {
      const duplicate = this.repository.findByEmail(input.email);
      if (duplicate) {
        throw new CustomerError("EMAIL_ALREADY_EXISTS", "A customer with this email already exists");
      }
    }

    const updated = this.repository.update(id, input);
    if (!updated) {
      throw new CustomerError("CUSTOMER_NOT_FOUND", "Customer not found");
    }
    return updated;
  }

  deleteCustomer(id: string): void {
    const deleted = this.repository.delete(id);
    if (!deleted) {
      throw new CustomerError("CUSTOMER_NOT_FOUND", "Customer not found");
    }
  }
}
