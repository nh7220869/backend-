import express from 'express';
import axios from 'axios';
import config from '../config/index.js';
import { getQdrantClient, searchSimilarVectors } from '../utils/qdrantClient.js';

const router = express.Router();

/**
 * Generate embeddings for text using OpenRouter
 */
async function generateEmbedding(text) {
  try {
    const response = await axios.post(
      `${config.openRouter.baseUrl}/embeddings`,
      {
        model: config.openRouter.embeddingModel,
        input: text
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openRouter.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation error:', error.message);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * RAG Chat endpoint
 * POST /chat
 *
 * Uses Retrieval-Augmented Generation:
 * 1. Convert user query to embedding
 * 2. Search Qdrant for similar content
 * 3. Use retrieved context to generate response
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    // Validation
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: 'Message is required and must be a non-empty string'
      });
    }

    // Check if services are configured
    if (!config.openRouter.apiKey) {
      return res.status(503).json({
        success: false,
        error: 'Service unavailable',
        details: 'OpenRouter API key not configured'
      });
    }

    const qdrantClient = getQdrantClient();

    let contextDocuments = [];
    let retrievalSuccessful = false;

    // Try to retrieve relevant context from Qdrant
    if (qdrantClient) {
      try {
        // Generate embedding for the user's query
        const queryEmbedding = await generateEmbedding(message);

        // Search for similar content in Qdrant
        const searchResults = await searchSimilarVectors(queryEmbedding, 5);

        // Extract relevant text from search results
        contextDocuments = searchResults.map(result => ({
          text: result.payload?.text || result.payload?.content || '',
          score: result.score,
          metadata: {
            chapter: result.payload?.chapter || 'Unknown',
            section: result.payload?.section || 'Unknown'
          }
        }));

        retrievalSuccessful = true;
        console.log(`✅ Retrieved ${contextDocuments.length} relevant documents from Qdrant`);
      } catch (qdrantError) {
        console.warn('⚠️ Qdrant retrieval failed, falling back to general chat:', qdrantError.message);
        // Continue without RAG context
      }
    }

    // Build the prompt with or without RAG context
    let systemPrompt = `You are an AI assistant specialized in Physical AI and Humanoid Robotics. You help users understand concepts from the Physical AI Book.`;

    let userPrompt = message;

    if (retrievalSuccessful && contextDocuments.length > 0) {
      // RAG-enhanced prompt
      const contextText = contextDocuments
        .map((doc, idx) => `[Document ${idx + 1}] (from ${doc.metadata.chapter}):\n${doc.text}`)
        .join('\n\n');

      systemPrompt += `\n\nYou have access to relevant excerpts from the Physical AI Book. Use this context to provide accurate, detailed answers. If the context doesn't contain the answer, use your general knowledge but mention that.`;

      userPrompt = `Context from the book:\n${contextText}\n\nUser question: ${message}\n\nProvide a helpful answer based on the context above.`;
    } else {
      // Fallback to general chat
      systemPrompt += `\n\nAnswer questions about Physical AI, humanoid robotics, AI agents, and related topics. Be helpful, accurate, and educational.`;
    }

    // Prepare messages with conversation history
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (limit to last 10 messages)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      messages.push(...recentHistory);
    }

    // Add current user message
    messages.push({ role: 'user', content: userPrompt });

    // Generate response using OpenRouter
    const response = await axios.post(
      `${config.openRouter.baseUrl}/chat/completions`,
      {
        model: config.openRouter.chatModel,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openRouter.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': config.openRouter.baseUrl,
          'X-Title': 'Physical AI Book RAG Chat'
        }
      }
    );

    const aiResponse = response.data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI model');
    }

    res.json({
      success: true,
      response: aiResponse.trim(),
      metadata: {
        ragEnabled: retrievalSuccessful,
        documentsRetrieved: contextDocuments.length,
        sources: contextDocuments.map(doc => ({
          chapter: doc.metadata.chapter,
          section: doc.metadata.section,
          relevanceScore: doc.score
        }))
      }
    });

  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Chat request failed',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * Health check for chat service
 * GET /chat/health
 */
router.get('/chat/health', (req, res) => {
  const qdrantClient = getQdrantClient();

  res.json({
    status: 'ok',
    message: 'Chat service is operational',
    features: {
      rag: !!qdrantClient,
      embeddings: !!config.openRouter.apiKey,
      chat: !!config.openRouter.apiKey
    }
  });
});

export default router;
