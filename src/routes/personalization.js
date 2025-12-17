import express from 'express';
import { callOpenRouterCompletion } from '../utils/openRouterApi.js';

const router = express.Router();

router.post('/personalize', async (req, res) => {
  try {
    const { content, userBackground } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required', details: 'Please provide content to personalize' });
    }
    if (!userBackground) {
      return res.status(400).json({ error: 'User background is required', details: 'Please provide user background information' });
    }

    const experience_level = userBackground.experienceLevel || 'beginner';
    const software_bg = userBackground.softwareBackground || '';
    const hardware_bg = userBackground.hardwareBackground || '';

    const level_descriptions = {
      'beginner': 'a beginner who is new to robotics and AI. Use simple language, provide more context, and explain technical terms.',
      'intermediate': 'someone with intermediate experience. You can use moderate technical language but still explain complex concepts.',
      'advanced': 'an advanced user or professional. You can use technical jargon and focus on deeper insights.'
    };

    const level_desc = level_descriptions[experience_level] || level_descriptions['beginner'];

    const background_context = [];
    if (software_bg) {
      background_context.push(`Software background: ${software_bg}`);
    }
    if (hardware_bg) {
      background_context.push(`Hardware background: ${hardware_bg}`);
    }

    const background_str = background_context.join(". ") || "No specific background provided";

    const prompt = `You are an expert educator in Physical AI and Humanoid Robotics.

Your task is to adapt the following educational content for a specific learner.

LEARNER PROFILE:
- Experience Level: ${experience_level} - ${level_desc}
- ${background_str}

ORIGINAL CONTENT:
${content}

INSTRUCTIONS:
1. Rewrite the content to match the learner's experience level
2. If the learner has relevant software/hardware background, make connections to their existing knowledge
3. For beginners: Add explanations, analogies, and break down complex concepts
4. For intermediate: Balance technical detail with accessibility
5. For advanced: Focus on nuances, optimizations, and advanced considerations
6. Maintain the core information but adjust the presentation style
7. Keep the same general structure but adapt examples to be relevant to their background

Please provide the personalized version of the content:`;

    const personalizedContent = await callOpenRouterCompletion(
      [{ role: 'user', content: prompt }],
      undefined, // Use default model from config
      0.7,       // Temperature
      4096       // Max tokens
    );

    res.json({
      success: true,
      personalizedContent,
      userLevel: experience_level
    });

  } catch (error) {
    console.error('Error in /api/personalize endpoint:', error);
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
