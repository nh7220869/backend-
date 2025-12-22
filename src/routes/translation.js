import express from 'express';
import axios from 'axios';
import config from '../config/index.js';

const router = express.Router();

/**
 * Translation endpoint using OpenRouter (Gemini)
 * POST /api/gemini/translate
 */
router.post('/gemini/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    // Validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: 'Text is required and must be a string'
      });
    }

    if (!targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: 'Target language is required'
      });
    }

    // Check if API key is configured
    if (!config.openRouter.apiKey) {
      return res.status(503).json({
        success: false,
        error: 'Service unavailable',
        details: 'OpenRouter API key not configured'
      });
    }

    // Call OpenRouter API for translation
    const response = await axios.post(
      `${config.openRouter.baseUrl}/chat/completions`,
      {
        model: config.openRouter.chatModel,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given text to ${targetLanguage}. Only return the translated text, nothing else.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openRouter.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': config.openRouter.baseUrl,
          'X-Title': 'Physical AI Book Translation'
        }
      }
    );

    const translatedText = response.data.choices[0]?.message?.content;

    if (!translatedText) {
      throw new Error('No translation returned from API');
    }

    res.json({
      success: true,
      translatedText: translatedText.trim(),
      sourceLanguage: 'auto-detected',
      targetLanguage
    });

  } catch (error) {
    console.error('Translation error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Translation failed',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * Alternative translation endpoint
 * POST /api/translate
 */
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Text and target language are required'
      });
    }

    // Use same logic as gemini/translate
    const response = await axios.post(
      `${config.openRouter.baseUrl}/chat/completions`,
      {
        model: config.openRouter.chatModel,
        messages: [
          {
            role: 'system',
            content: `Translate from ${sourceLanguage || 'auto-detect'} to ${targetLanguage}. Return only the translation.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openRouter.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      translatedText: response.data.choices[0]?.message?.content.trim(),
      targetLanguage
    });

  } catch (error) {
    console.error('Translation error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Translation failed',
      details: error.message
    });
  }
});

export default router;
