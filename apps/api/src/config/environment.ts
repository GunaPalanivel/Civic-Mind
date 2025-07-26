export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    serviceAccountPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  },
  
  vertexAI: {
    location: process.env.VERTEX_AI_LOCATION || 'us-central1',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key',
    expiresIn: '24h',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};
