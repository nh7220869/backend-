import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';

// Import database and Qdrant utility functions
import { connectDb} from './utils/db.js';
import { initializeQdrantClient } from './utils/qdrantClient.js';
import config from './config/index.js'; // Import config to use CORS allowed origins

// Import CORS configuration with wildcard support
import { corsOptions, corsMiddleware } from './middleware/corsConfig.js';

// Import auth initialization and route creator
import { initializeAuth } from './utils/authService.js';
import createAuthRouter from './routes/auth.js'; // Changed to import createAuthRouter

// Import other route modules
import translationRoutes from './routes/translation.js';
import personalizationRoutes from './routes/personalization.js';
import chatRoutes from './routes/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Apply CORS middleware with dynamic origin matching and wildcard support
app.use(cors(corsOptions));

// Backup CORS headers (ensures headers are set even if cors package fails)
app.use(corsMiddleware);

// Parse JSON bodies
app.use(express.json());

// Initialize Database and Qdrant
const initializeServices = async () => {
  try {
    console.log('📦 Initializing database connection...');
    const dbPool = await connectDb(); // Get the initialized pool
    if (!dbPool) {
      throw new Error('Database pool could not be established.');
    }
    console.log('✅ Database connected');

    console.log('🔐 Initializing authentication service...');
    const auth = initializeAuth(dbPool); // Initialize betterAuth with the pool
    const authRouter = createAuthRouter(auth); // Create auth router with the auth object
    app.use('/api/auth', authRouter); // Mount authentication routes
    console.log('✅ Authentication routes mounted');

    console.log('🔍 Initializing Qdrant vector database...');
    await initializeQdrantClient();
    console.log('✅ Qdrant connected');

    // Add catch-all route AFTER all routes are mounted
    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: `The requested endpoint '${req.path}' was not found.`,
        availableEndpoints: [
          'GET /health',
          'GET /api/auth/auth-health',
          'POST /api/auth/sign-up/email',
          'POST /api/auth/sign-in/email',
          'POST /api/auth/sign-out',
          'GET /api/auth/get-session',
          'POST /api/gemini/translate',
          'POST /api/translate',
          'POST /api/personalize',
          'POST /chat'
        ]
      });
    });

    // Global error handler (must be last)
    app.use((err, req, res, next) => {
      console.error('Unhandled error:', err);
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      const details = err.details || 'An unexpected error occurred.';
      res.status(status).json({
        success: false,
        error: message,
        details: details
      });
    });

    console.log('✅ All services initialized successfully!');

  } catch (error) {
    console.error('❌ Failed to initialize services:', error.message);
    console.error('Stack trace:', error.stack);
    throw error; // Throw to be caught in server.js
  }
};

// Mount other routes (these are available immediately)
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Central Backend Server is running',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      qdrant: 'connected',
      auth: 'initialized'
    }
  });
});

// Mount translation routes
app.use('/api', translationRoutes); // Routes are like /api/gemini/translate and /api/translate

// Mount personalization routes
app.use('/api', personalizationRoutes); // Route is like /api/personalize

// Mount chat routes
app.use('/', chatRoutes); // Route is like /chat

// NOTE: Catch-all and error handler are added AFTER auth routes are mounted
// This is done in initializeServices() function to ensure proper route order

// Export both the app and the initialization promise
export default app;
export { initializeServices };
