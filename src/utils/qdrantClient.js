import { QdrantClient } from '@qdrant/js-client-rest';
import config from '../config/index.js';

let qdrantClient = null;

/**
 * Initialize Qdrant vector database client
 * Used for RAG (Retrieval-Augmented Generation) functionality
 */
export const initializeQdrantClient = async () => {
  try {
    if (qdrantClient) {
      console.log('📦 Using existing Qdrant client');
      return qdrantClient;
    }

    if (!config.qdrant.url) {
      console.warn('⚠️ QDRANT_URL not configured. Qdrant features will be disabled.');
      return null;
    }

    // Initialize Qdrant client
    qdrantClient = new QdrantClient({
      url: config.qdrant.url,
      apiKey: config.qdrant.apiKey,
    });

    // Test connection by checking if collections exist
    try {
      const collections = await qdrantClient.getCollections();
      console.log('✅ Qdrant vector database connected successfully');
      console.log(`📊 Available collections: ${collections.collections.length}`);

      // Check if our specific collection exists
      const collectionExists = collections.collections.some(
        (col) => col.name === config.qdrant.collectionName
      );

      if (collectionExists) {
        const collectionInfo = await qdrantClient.getCollection(config.qdrant.collectionName);
        console.log(`✅ Collection '${config.qdrant.collectionName}' found with ${collectionInfo.points_count} vectors`);
      } else {
        console.warn(`⚠️ Collection '${config.qdrant.collectionName}' not found. RAG features may not work until collection is created.`);
      }
    } catch (testError) {
      console.warn('⚠️ Could not verify Qdrant collections:', testError.message);
    }

    return qdrantClient;
  } catch (error) {
    console.error('❌ Qdrant initialization failed:', error.message);
    // Don't throw - allow the server to start even if Qdrant fails
    // This makes RAG features optional
    return null;
  }
};

/**
 * Get the existing Qdrant client instance
 * @returns {QdrantClient|null} Qdrant client or null if not initialized
 */
export const getQdrantClient = () => {
  if (!qdrantClient) {
    console.warn('⚠️ Qdrant client not initialized. Call initializeQdrantClient() first.');
  }
  return qdrantClient;
};

/**
 * Search for similar vectors in the collection
 * @param {number[]} embedding - Vector embedding to search for
 * @param {number} limit - Number of results to return
 * @returns {Promise<Array>} Search results
 */
export const searchSimilarVectors = async (embedding, limit = 5) => {
  if (!qdrantClient) {
    throw new Error('Qdrant client not initialized');
  }

  try {
    const searchResult = await qdrantClient.search(config.qdrant.collectionName, {
      vector: embedding,
      limit,
      with_payload: true,
    });

    return searchResult;
  } catch (error) {
    console.error('❌ Qdrant search failed:', error.message);
    throw error;
  }
};

export default { initializeQdrantClient, getQdrantClient, searchSimilarVectors };
