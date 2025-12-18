import app, { initializeServices } from './src/app.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.CENTRAL_BACKEND_PORT || 3001;

// Start server only after initialization completes
(async () => {
  try {
    console.log('🚀 Starting Central Backend Server...');
    console.log('⏳ Initializing services...');

    // Wait for all services to initialize
    await initializeServices();

    // Now start the server
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('✅ Central Backend Server Started');
      console.log('='.repeat(50));
      console.log(`🌐 Server running on: http://localhost:${PORT}`);
      console.log('='.repeat(50));
      console.log('📋 Available endpoints:');
      console.log('   - POST /api/auth/sign-up/email');
      console.log('   - POST /api/auth/sign-in/email');
      console.log('   - POST /api/auth/sign-out');
      console.log('   - GET  /api/auth/session');
      console.log('   - POST /api/gemini/translate');
      console.log('   - POST /api/personalize');
      console.log('   - POST /chat');
      console.log('   - GET  /health');
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();
