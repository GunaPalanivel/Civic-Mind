import express from "express";
import cors from "cors";
import intelligenceRoutes from "./routes/intelligence";

export const createApp = (): express.Application => {
  const app = express();

  // Middleware
  app.use(cors({ origin: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({
      success: true,
      message: "Civic Mind API is operational",
      timestamp: new Date().toISOString(),
      environment: "firebase-functions",
      version: "1.0.0",
    });
  });

  // Register route modules
  app.use("/", intelligenceRoutes);

  // 404 handler
  app.use("*", (req, res) => {
    res.status(404).json({
      success: false,
      error: "Endpoint not found",
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  });

  // Error handler
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error("Express error:", err);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      });
    },
  );

  return app;
};
