import { Router } from "express";
import { CustomerError, CustomerService } from "../services/customerService.service";
import { CustomerRepository } from "../repository/customer.respository";
import {
  createCustomerSchema,
  customerListQuerySchema,
  updateCustomerSchema
} from "../schemas/customer.schema";
import type { UpdateCustomerInput } from "../utils/customer.types";

export const customerRouter = Router();
const service = new CustomerService(new CustomerRepository());

customerRouter.get("/", (req, res, next) => {
  try {
    const { limit, offset } = customerListQuerySchema.parse(req.query);
    const result = service.listCustomers(limit, offset);

    res.status(200).json({
      data: result.customers,
      pagination: {
        limit,
        offset,
        total: result.total,
        hasMore: offset + result.customers.length < result.total
      }
    });
  } catch (error) {
    next(error);
  }
});

customerRouter.get("/:id", (req, res, next) => {
  try {
    res.status(200).json({ data: service.getCustomer(req.params.id) });
  } catch (error) {
    next(error);
  }
});

customerRouter.post("/", (req, res, next) => {
  try {
    const input = createCustomerSchema.parse(req.body);
    const customer = service.createCustomer(input);
    res.status(201).json({ data: customer });
  } catch (error) {
    next(error);
  }
});

customerRouter.patch("/:id", (req, res, next) => {
  try {
    const input: any = updateCustomerSchema.parse(req.body);
    const customer = service.updateCustomer(req.params.id, input);
    res.status(200).json({ data: customer });
  } catch (error) {
    next(error);
  }
});

customerRouter.delete("/:id", (req, res, next) => {
  try {
    service.deleteCustomer(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Domain errors are translated into stable HTTP responses at the route boundary.
customerRouter.use((error: unknown, _req: any, res: any, next: any) => {
  if (error instanceof CustomerError) {
    const status = error.code === "CUSTOMER_NOT_FOUND" ? 404 : 409;
    res.status(status).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }
  next(error);
});
