import express from 'express';
import axios from 'axios';
import config from '../config/index.js';

const router = express.Router();

/**
 * Personalization endpoint
 * Adapts content based on user's background and experience level
 * POST /api/personalize
 */
router.post('/personalize', async (req, res) => {
  try {
    const {
      content,
      userProfile
    } = req.body;

    // Validation
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: 'Content is required and must be a string'
      });
    }

    // Default user profile if not provided
    const profile = {
      experienceLevel: userProfile?.experienceLevel || 'beginner',
      softwareBackground: userProfile?.softwareBackground || '',
      hardwareBackground: userProfile?.hardwareBackground || ''
    };

    // Check if API key is configured
    if (!config.openRouter.apiKey) {
      return res.status(503).json({
        success: false,
        error: 'Service unavailable',
        details: 'OpenRouter API key not configured'
      });
    }

    // Build personalization prompt based on user profile
    let personalizationPrompt = `You are an AI assistant helping to personalize educational content about Physical AI and Humanoid Robotics.

User Profile:
- Experience Level: ${profile.experienceLevel}
- Software Background: ${profile.softwareBackground || 'Not specified'}
- Hardware Background: ${profile.hardwareBackground || 'Not specified'}

Task: Adapt the following content to match the user's experience level and background.
`;

    if (profile.experienceLevel === 'beginner') {
      personalizationPrompt += `
- Use simple, clear language
- Explain technical terms
- Provide more context and examples
- Break down complex concepts`;
    } else if (profile.experienceLevel === 'intermediate') {
      personalizationPrompt += `
- Use moderate technical language
- Assume basic knowledge
- Focus on practical applications
- Include some advanced concepts`;
    } else if (profile.experienceLevel === 'advanced') {
      personalizationPrompt += `
- Use advanced technical terminology
- Focus on implementation details
- Assume strong foundational knowledge
- Dive into optimization and best practices`;
    }

    personalizationPrompt += `

Original Content:
${content}

Provide the personalized version:`;

    // Call OpenRouter API for personalization
    const response = await axios.post(
      `${config.openRouter.baseUrl}/chat/completions`,
      {
        model: config.openRouter.chatModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator in Physical AI and Robotics. Adapt content to match different learning levels.'
          },
          {
            role: 'user',
            content: personalizationPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openRouter.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': config.openRouter.baseUrl,
          'X-Title': 'Physical AI Book Personalization'
        }
      }
    );

    const personalizedContent = response.data.choices[0]?.message?.content;

    if (!personalizedContent) {
      throw new Error('No personalized content returned from API');
    }

    res.json({
      success: true,
      personalizedContent: personalizedContent.trim(),
      userProfile: profile,
      originalLength: content.length,
      personalizedLength: personalizedContent.length
    });

  } catch (error) {
    console.error('Personalization error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Personalization failed',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

export default router;
