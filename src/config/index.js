import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const config = {
  port: process.env.CENTRAL_BACKEND_PORT || 3000,
  db: {
    connectionString: process.env.DATABASE_URL,
  },
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    chatModel: process.env.OPENROUTER_CHAT_MODEL || 'google/gemini-2.0-flash-exp:free',
    embeddingModel: process.env.OPENROUTER_EMBEDDING_MODEL || 'openai/text-embedding-ada-002' // Assuming OpenRouter can provide embeddings
  },
  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: process.env.QDRANT_COLLECTION_NAME || 'book_content',
  },
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS ?
      process.env.CORS_ALLOWED_ORIGINS.split(',') : [
        'https://humanoid-robotics-guidemain.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001',
      ],
  }
};

// Validate essential configurations
if (!config.db.connectionString) {
  console.warn('WARNING: DATABASE_URL is not set. Database functionalities might be limited.');
}
if (!config.openRouter.apiKey) {
  console.warn('WARNING: OPENROUTER_API_KEY is not set. AI functionalities might be limited.');
}
if (!config.qdrant.url) {
  console.warn('WARNING: QDRANT_URL is not set. Qdrant functionalities might be limited.');
}

export default config;
