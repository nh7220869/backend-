import express from 'express';
import { callOpenRouterCompletion } from '../utils/openRouterApi.js';
import { generateEmbedding, searchQdrant, initializeQdrantClient } from '../utils/qdrantClient.js';

const router = express.Router();

// Ensure Qdrant client is initialized before handling chat requests
router.use(async (req, res, next) => {
  try {
    await initializeQdrantClient();
    next();
  } catch (error) {
    console.error("Failed to initialize Qdrant client for chat route:", error);
    res.status(500).json({ success: false, error: "Failed to initialize chat service." });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { question, selected_text } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // 1. Generate embedding for the user query
    const queryEmbedding = await generateEmbedding(question);
    if (!queryEmbedding) {
      return res.status(500).json({ error: 'Failed to generate query embedding.' });
    }

    // 2. Retrieve relevant documents from Qdrant
    const qdrantResults = await searchQdrant(question, 5); // Assuming searchQdrant uses the embedding
    const retrievedChunks = qdrantResults.map(result => result.payload.text);

    // 3. Assemble context for the LLM
    let combinedContext = '';
    if (selected_text) {
      combinedContext = `User selected text for context:\n${selected_text}\n\nRelevant document chunks:\n` + retrievedChunks.join("\n---");
    } else {
      combinedContext = "Relevant document chunks:\n" + retrievedChunks.join("\n---");
    }

    // 4. Generate response using OpenRouter API
    const prompt = `You are a helpful assistant specialized in Physical AI & Humanoid Robotics.
Answer the user's question based ONLY on the provided context.
If the answer cannot be found in the context, state that you don't have enough information.

Context:
${combinedContext}

Question: ${question}`;

    const answer = await callOpenRouterCompletion(
      [{ role: 'user', content: prompt }],
      undefined, // Use default model from config
      0.7,       // Temperature
      1024       // Max tokens
    );

    res.json({ answer: answer });

  } catch (error) {
    console.error('Error in /chat endpoint:', error);
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    res.status(status).json({
      success: false,
      error: message,
      details: error.details || 'An unexpected error occurred.'
    });
  }
});

export default router;
