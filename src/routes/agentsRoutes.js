/**
 * AGENT API ROUTES
 *
 * Express routes for BookAgent and subagent operations.
 * Exposes agent functionality through REST API endpoints.
 *
 * INTEGRATION: Add to central-backend/src/app.js:
 * ```javascript
 * import agentsRoutes from './routes/agentsRoutes.js';
 * app.use('/api/agents', agentsRoutes);
 * ```
 */

import express from 'express';
import { initializeFromBackend } from '../../agents/utils/initializeAgents.js';

const router = express.Router();

// Initialize agents once (will be set up when backend starts)
let agents = null;

/**
 * Initialize agents with backend clients
 * Call this from app.js after clients are ready
 */
export function setupAgents({ openRouterClient, embeddingClient, qdrantClient }) {
  agents = initializeFromBackend({
    openRouterClient,
    embeddingClient,
    qdrantClient
  });
  console.log('✅ Agent routes initialized');
}

/**
 * Middleware to ensure agents are initialized
 */
function ensureAgentsReady(req, res, next) {
  if (!agents || !agents.bookAgent) {
    return res.status(503).json({
      success: false,
      error: 'Agents not initialized. Please restart the server.'
    });
  }
  next();
}

// Apply middleware to all routes
router.use(ensureAgentsReady);

/**
 * GET /api/agents/status
 * Check agent system status
 */
router.get('/status', (req, res) => {
  try {
    const status = agents.bookAgent.getStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agents/generate-chapter
 * Generate a complete chapter with quiz and RAG
 *
 * Body:
 * {
 *   chapterNumber: string,
 *   title: string,
 *   topics: string[],
 *   options?: {
 *     targetAudience?: string,
 *     wordCount?: number,
 *     includeQuiz?: boolean,
 *     includeRAG?: boolean,
 *     includeGlossary?: boolean
 *   }
 * }
 */
router.post('/generate-chapter', async (req, res) => {
  try {
    const { chapterNumber, title, topics, options = {} } = req.body;

    if (!chapterNumber || !title || !topics) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: chapterNumber, title, topics'
      });
    }

    const result = await agents.bookAgent.generateCompleteChapter({
      chapterNumber,
      title,
      topics,
      options
    });

    res.json(result);

  } catch (error) {
    console.error('Generate chapter error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agents/generate-book
 * Generate complete book with all chapters
 *
 * Body:
 * {
 *   chapters: Array<{
 *     chapterNumber: string,
 *     title: string,
 *     topics: string[]
 *   }>,
 *   options?: { targetAudience, wordCount, etc. }
 * }
 */
router.post('/generate-book', async (req, res) => {
  try {
    const { chapters, options = {} } = req.body;

    if (!chapters || !Array.isArray(chapters)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid chapters array'
      });
    }

    const result = await agents.bookAgent.generateCompleteBook({
      chapters,
      options
    });

    res.json(result);

  } catch (error) {
    console.error('Generate book error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agents/refine-content
 * Refine existing content
 *
 * Body:
 * {
 *   content: string,
 *   improvements?: string[],
 *   iterations?: number
 * }
 */
router.post('/refine-content', async (req, res) => {
  try {
    const { content, improvements, iterations, focusArea } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: content'
      });
    }

    const result = await agents.contentRefiner.refineContent({
      content,
      improvements,
      iterations,
      focusArea
    });

    res.json(result);

  } catch (error) {
    console.error('Refine content error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agents/generate-quiz
 * Generate quiz from content
 *
 * Body:
 * {
 *   content: string,
 *   questionCount?: number,
 *   difficulty?: string,
 *   questionTypes?: string[]
 * }
 */
router.post('/generate-quiz', async (req, res) => {
  try {
    const { content, questionCount, difficulty, questionTypes } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: content'
      });
    }

    const result = await agents.quizGenerator.generateQuiz({
      content,
      questionCount,
      difficulty,
      questionTypes
    });

    res.json(result);

  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agents/explain-concept
 * Explain a technical concept
 *
 * Body:
 * {
 *   concept: string,
 *   level?: string,
 *   context?: string
 * }
 */
router.post('/explain-concept', async (req, res) => {
  try {
    const { concept, level, context } = req.body;

    if (!concept) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: concept'
      });
    }

    const result = await agents.conceptExplainer.explainConcept({
      concept,
      level,
      context
    });

    res.json(result);

  } catch (error) {
    console.error('Explain concept error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agents/generate-glossary
 * Generate glossary for multiple concepts
 *
 * Body:
 * {
 *   concepts: string[],
 *   level?: string
 * }
 */
router.post('/generate-glossary', async (req, res) => {
  try {
    const { concepts, level } = req.body;

    if (!concepts || !Array.isArray(concepts)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid concepts array'
      });
    }

    const result = await agents.conceptExplainer.generateGlossary({
      concepts,
      level
    });

    res.json(result);

  } catch (error) {
    console.error('Generate glossary error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agents/translate-content
 * Translate content to target language
 *
 * Body:
 * {
 *   content: string,
 *   targetLanguage: string,
 *   sourceLanguage?: string
 * }
 */
router.post('/translate-content', async (req, res) => {
  try {
    const { content, targetLanguage, sourceLanguage, style } = req.body;

    if (!content || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: content, targetLanguage'
      });
    }

    const result = await agents.translator.translateContent({
      content,
      targetLanguage,
      sourceLanguage,
      style
    });

    res.json(result);

  } catch (error) {
    console.error('Translate content error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agents/prepare-rag
 * Prepare content for RAG (chunking + embeddings)
 *
 * Body:
 * {
 *   content: string,
 *   chapterTitle: string,
 *   chapterNumber: string,
 *   uploadToDb?: boolean
 * }
 */
router.post('/prepare-rag', async (req, res) => {
  try {
    const { content, chapterTitle, chapterNumber, uploadToDb } = req.body;

    if (!content || !chapterTitle || !chapterNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: content, chapterTitle, chapterNumber'
      });
    }

    // Temporarily set autoUpload
    const originalAutoUpload = agents.ragPrep.options.autoUpload;
    agents.ragPrep.options.autoUpload = uploadToDb ?? false;

    try {
      const result = await agents.ragPrep.prepareChapter({
        content,
        chapterTitle,
        chapterNumber
      });

      res.json(result);
    } finally {
      agents.ragPrep.options.autoUpload = originalAutoUpload;
    }

  } catch (error) {
    console.error('Prepare RAG error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agents/educational-package
 * Generate comprehensive educational package
 *
 * Body:
 * {
 *   chapterNumber: string,
 *   title: string,
 *   topics: string[],
 *   targetAudience?: string
 * }
 */
router.post('/educational-package', async (req, res) => {
  try {
    const { chapterNumber, title, topics, targetAudience } = req.body;

    if (!chapterNumber || !title || !topics) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: chapterNumber, title, topics'
      });
    }

    const result = await agents.bookAgent.generateEducationalPackage({
      chapterNumber,
      title,
      topics,
      targetAudience
    });

    res.json(result);

  } catch (error) {
    console.error('Educational package error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agents/update-chapter
 * Update existing chapter with refinement and enhancements
 *
 * Body:
 * {
 *   chapterNumber: string,
 *   title: string,
 *   content: string,
 *   updateOptions: {
 *     refine?: boolean,
 *     addGlossary?: boolean,
 *     regenerateQuiz?: boolean,
 *     updateRAG?: boolean
 *   }
 * }
 */
router.post('/update-chapter', async (req, res) => {
  try {
    const { chapterNumber, title, content, updateOptions } = req.body;

    if (!chapterNumber || !title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: chapterNumber, title, content'
      });
    }

    const result = await agents.bookAgent.updateChapter({
      chapterNumber,
      title,
      content,
      updateOptions: updateOptions || {}
    });

    res.json(result);

  } catch (error) {
    console.error('Update chapter error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agents/translate-book
 * Translate entire book to multiple languages
 *
 * Body:
 * {
 *   chapters: Array<{ chapterNumber, title, content }>,
 *   targetLanguages: string[]
 * }
 */
router.post('/translate-book', async (req, res) => {
  try {
    const { chapters, targetLanguages } = req.body;

    if (!chapters || !targetLanguages) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: chapters, targetLanguages'
      });
    }

    const result = await agents.bookAgent.translateBook({
      chapters,
      targetLanguages
    });

    res.json(result);

  } catch (error) {
    console.error('Translate book error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { setupAgents };
export default router;
