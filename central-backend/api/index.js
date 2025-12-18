import app, { initializeServices } from '../src/app.js';

// Initialize services only once (cached across invocations)
let servicesInitialized = false;

const initOnce = async () => {
  if (!servicesInitialized) {
    console.log('🚀 Initializing Central Backend Services...');
    await initializeServices();
    servicesInitialized = true;
    console.log('✅ Services initialized successfully');
  }
};

// Vercel serverless handler
export default async function handler(req, res) {
  try {
    await initOnce();
    return app(req, res);
  } catch (err) {
    console.error('❌ Serverless error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize backend service',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
