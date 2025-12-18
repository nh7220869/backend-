import { QdrantClient } from '@qdrant/js-client-rest';
import config from '../config/index.js';
import { callOpenRouterEmbeddings } from './openRouterApi.js';
import pkg from '@dqbd/tiktoken'; // For tokenization if needed for chunking
const { encoding_for_model } = pkg;

const qdrantConfig = config.qdrant;

let qdrantClient;
const QDRANT_COLLECTION_NAME = qdrantConfig.collectionName;
const EMBEDDING_MODEL = config.openRouter.embeddingModel; // Assuming OpenRouter will provide embeddings

const initializeQdrantClient = async () => {
  if (qdrantClient) {
    console.log('✅ Qdrant client already initialized');
    return qdrantClient;
  }

  console.log('🔍 Initializing Qdrant client...');
  console.log('📍 Qdrant URL:', qdrantConfig.url || 'NOT SET');
  console.log('🔑 Qdrant API Key:', qdrantConfig.apiKey ? '***' + qdrantConfig.apiKey.slice(-4) : 'NOT SET');

  if (!qdrantConfig.url) {
    throw new Error('QDRANT_URL environment variable is not set');
  }

  if (!qdrantConfig.apiKey) {
    throw new Error('QDRANT_API_KEY environment variable is not set');
  }

  qdrantClient = new QdrantClient({
    url: qdrantConfig.url,
    apiKey: qdrantConfig.apiKey,
  });

  try {
    console.log('📡 Connecting to Qdrant...');
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(c => c.name === QDRANT_COLLECTION_NAME);

    if (!collectionExists) {
      console.log(`⚠️ Collection '${QDRANT_COLLECTION_NAME}' does not exist. Creating...`);
      await qdrantClient.createCollection(QDRANT_COLLECTION_NAME, {
        vectors: { size: 1536, distance: 'Cosine' },
      });
      console.log(`✅ Collection '${QDRANT_COLLECTION_NAME}' created.`);
    } else {
      console.log(`✅ Collection '${QDRANT_COLLECTION_NAME}' already exists.`);
    }
    return qdrantClient;
  } catch (error) {
    console.error('❌ Failed to initialize Qdrant client:', error.message);
    console.error('Stack:', error.stack);
    qdrantClient = null;
    throw new Error(`Qdrant initialization failed: ${error.message}`);
  }
};

const getQdrantClient = () => {
  if (!qdrantClient) {
    console.warn('Qdrant client not initialized. Call initializeQdrantClient() first.');
  }
  return qdrantClient;
};

// Function to generate embedding for a given text
const generateEmbedding = async (text) => {
  try {
    const embedding = await callOpenRouterEmbeddings(text, EMBEDDING_MODEL);
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};

// Function to ingest content into Qdrant (simplified for demonstration)
const ingestContent = async (id, text, metadata = {}) => {
  const client = getQdrantClient();
  if (!client) {
    throw new Error('Qdrant client not available.');
  }

  try {
    const embedding = await generateEmbedding(text);
    if (!embedding) {
      throw new Error('Failed to generate embedding for content.');
    }

    await client.upsert(QDRANT_COLLECTION_NAME, {
      wait: true,
      points: [
        {
          id: id,
          vector: embedding,
          payload: { text, ...metadata },
        },
      ],
    });
    console.log(`Content with id ${id} ingested into Qdrant.`);
  } catch (error) {
    console.error(`Error ingesting content with id ${id} into Qdrant:`, error);
    throw error;
  }
};

// Function to search Qdrant
const searchQdrant = async (queryText, limit = 5) => {
  const client = getQdrantClient();
  if (!client) {
    throw new Error('Qdrant client not available.');
  }

  try {
    const queryEmbedding = await generateEmbedding(queryText);
    if (!queryEmbedding) {
      throw new Error('Failed to generate embedding for query.');
    }

    const searchResult = await client.search(QDRANT_COLLECTION_NAME, {
      vector: queryEmbedding,
      limit: limit,
      with_payload: true,
    });
    return searchResult;
  } catch (error) {
    console.error(`Error searching Qdrant for query '${queryText}':`, error);
    throw error;
  }
};


export { initializeQdrantClient, getQdrantClient, generateEmbedding, ingestContent, searchQdrant, QDRANT_COLLECTION_NAME };
