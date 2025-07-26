export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  host: process.env.HOST || "0.0.0.0",
  nodeEnv: process.env.NODE_ENV || "development",

  // Add this missing property
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || "civic-mind-dev",
    serviceAccountPath:
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      "./service-account-key.json",
  },

  vertexAI: {
    location: process.env.VERTEX_AI_LOCATION || "us-central1",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "default-jwt-secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10), // limit each IP to 100 requests per windowMs
  },
};
