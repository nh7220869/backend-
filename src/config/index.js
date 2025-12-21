import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const config = {
  port: process.env.CENTRAL_BACKEND_PORT || 3000,
  db: {
    connectionString: process.env.DATABASE_URL,
  },
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    chatModel: process.env.OPENROUTER_CHAT_MODEL || 'google/gemini-2.0-flash-exp:free',
    embeddingModel: process.env.OPENROUTER_EMBEDDING_MODEL || 'openai/text-embedding-ada-002'
  },
  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: process.env.QDRANT_COLLECTION_NAME || 'book_content',
  },
  cors: {
    allowedOrigins: [
      'https://physical-ai-humanoid-robotics-book-eight-kappa.vercel.app',
      'https://ai-native-book-tf39.vercel.app',
      'https://ai-native-book-*.vercel.app',
      'https://Ai-Native-Book.vercel.app',
      'https://physical-ai-humanoid-robotics-book-eosin.vercel.app',
      'http://localhost:3000',
      'http://localhost:5001',
      'http://localhost:3001'
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cookie',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Set-Cookie'],
    credentials: true,
    maxAge: 86400,
  }
};

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
