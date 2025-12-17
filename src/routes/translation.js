import express from 'express';
import { callOpenRouterCompletion } from '../utils/openRouterApi.js';

const router = express.Router();

router.post('/gemini/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    // Validation
    if (!text) {
      return res.status(400).json({ error: 'Text is required', details: 'Please provide text to translate' });
    }
    if (!targetLanguage) {
      return res.status(400).json({ error: 'Target language is required', details: 'Please provide a target language code' });
    }

    const prompt = `Translate the following text to ${targetLanguage}. Only provide the translation, no explanations or additional text:\n\n${text}`;
    const translatedText = await callOpenRouterCompletion(
      [{ role: 'user', content: prompt }],
      undefined, // Use default model from config
      0.3,       // Temperature
      2048       // Max tokens
    );

    res.json({
      success: true,
      translatedText,
      originalLength: text.length,
      translatedLength: translatedText.length,
      targetLanguage,
      provider: 'OpenRouter',
      model: 'gemini-2.0-flash-exp' // Assuming this is the model used for translation
    });

  } catch (error) {
    console.error('Error in /api/gemini/translate endpoint:', error);
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    res.status(status).json({
      success: false,
      error: message,
      details: error.details || 'An unexpected error occurred.'
    });
  }
});

// Alias for /api/gemini/translate for consistency
router.post('/translate', async (req, res) => {
  req.url = '/gemini/translate'; // Adjust URL for internal routing
  router.handle(req, res); // Re-route the request internally
});


export default router;
