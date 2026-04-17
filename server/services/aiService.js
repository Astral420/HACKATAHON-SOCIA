const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

const genAI = new GoogleGenerativeAI(process.env.GEN_AI_KEY);

class AiService {
  static async processTranscript(transcript) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
Analyze the following meeting transcript and provide:
1. A concise summary (2-3 paragraphs)
2. Key action items with owners if mentioned
3. Main discussion points
4. Overall sentiment (positive/neutral/negative)

Transcript:
${transcript}

Respond in JSON format:
{
  "summary": "...",
  "actionItems": ["item 1", "item 2"],
  "keyPoints": ["point 1", "point 2"],
  "sentiment": "positive|neutral|negative"
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      logger.info('AI processing completed');
      
      return parsed;
    } catch (err) {
      logger.error({ err }, 'AI processing error');
      throw new Error('AI processing failed');
    }
  }

  static async generateTranscript(audioUrl) {
    // Placeholder for speech-to-text integration
    // Could use Google Speech-to-Text, Whisper API, etc.
    logger.info({ audioUrl }, 'Transcript generation requested');
    throw new Error('Transcript generation not yet implemented');
  }
}

module.exports = AiService;
