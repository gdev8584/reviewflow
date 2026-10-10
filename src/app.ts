import express, { type ErrorRequestHandler } from "express";
import { json } from "body-parser";
import helmet from "helmet";
import { customerRouter } from "./routes/customer.routes";
import { ZodError } from "zod";

export const app = express();
app.use(json());
app.use(helmet());
app.use(express.json({ limit: "100kb" }));

// health check route
app.get("/health", (_req, res) => {
  res.status(200).send({ status: "ok" });
});

// customer router
app.use("/api/customers", customerRouter);

// catch-all route for unmatched requests
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found"
    }
  });
});

// global error handler

const errorHandler: ErrorRequestHandler = (error: unknown,_req,res,_next,) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  // Express body-parser errors for invalid JSON.
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error
  ) {
    if (error.type === "entity.parse.failed") {
        res.status(400).json({
        error: {
            code: "INVALID_JSON",
            message: "Request body must contain valid JSON",
        },
        });
        return;
    }
    if (error.type === "entity.too.large") {
        res.status(413).json({
        error: {
            code: "PAYLOAD_TOO_LARGE",
            message: "Request body exceeds the allowed size",
        },
        });
        return;
    }
  }
};


app.use(errorHandler);