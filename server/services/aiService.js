const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const Meeting = require('../models/Meeting');
const Transcript = require('../models/Transcript');
const AiOutput = require('../models/AiOutput');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are a professional meeting analyst. Your job is to extract structured information from a business meeting transcript.

Return ONLY a valid JSON object — no markdown fences, no preamble, no explanation.

JSON schema (all fields required):
{
  "summary": "2-3 sentence executive summary of the meeting",
  "action_items": [
    "Action item with clear owner and deadline if mentioned",
    ...
  ],
  "key_decisions": [
    "A decision that was made and agreed upon",
    ...
  ],
  "open_questions": [
    "Something that was raised but not resolved",
    ...
  ],
  "next_steps": [
    "Concrete follow-up item to move the relationship forward",
    ...
  ]
}

Rules:
- summary: no more than 3 sentences, neutral tone, no fluff
- action_items: start each with a verb (e.g. "Send", "Review", "Schedule")
- key_decisions: past tense ("Budget was approved", "Team agreed to...")
- open_questions: phrased as a question
- next_steps: future-facing, 1 sentence each
- If a category has no items, return an empty array []
- Do NOT include anything outside the JSON object`;

class AiService {
  /**
   * Process a meeting transcript with AI
   * @param {string} meetingId - Meeting ID to process
   * @returns {Promise<Object>} Parsed AI output
   */
  static async processMeeting(meetingId) {
    try {
      // 1. Update meeting status to "processing"
      await Meeting.updateStatus(meetingId, 'processing');
      logger.info({ meetingId }, 'Started AI processing');

      // 2. Fetch transcript from database
      const transcript = await Transcript.findByMeetingId(meetingId);
      if (!transcript) {
        await Meeting.updateStatus(meetingId, 'error');
        const error = new Error('No transcript found for meeting');
        error.status = 400;
        throw error;
      }

      // 3. Call Gemini API with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI processing timeout')), 30000);
      });

      const processPromise = this.processTranscript(transcript.content);
      const parsed = await Promise.race([processPromise, timeoutPromise]);

      // 4. Save parsed output to ai_outputs table
      await AiOutput.upsert({
        meetingId,
        summary: parsed.summary,
        action_items: parsed.action_items || [],
        key_decisions: parsed.key_decisions || [],
        open_questions: parsed.open_questions || [],
        next_steps: parsed.next_steps || []
      });

      // 5. Update meeting status to "done"
      await Meeting.updateStatus(meetingId, 'done');
      logger.info({ meetingId }, 'AI processing completed successfully');

      return parsed;
    } catch (err) {
      // Update status to "error" on failure
      await Meeting.updateStatus(meetingId, 'error');
      logger.error({ err, meetingId }, 'AI processing failed');
      throw err;
    }
  }

  static async processTranscript(transcript) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `${SYSTEM_PROMPT}

TRANSCRIPT:
${transcript}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Strip markdown fences and extract JSON
      let cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Try to parse JSON
      let parsed;
      try {
        parsed = JSON.parse(cleanedText);
      } catch (parseErr) {
        // Retry with clarification prompt
        logger.warn('Invalid JSON response, retrying with clarification');
        
        const retryResult = await model.generateContent(
          'Your previous response was not valid JSON. Return ONLY the JSON object, nothing else.'
        );
        const retryText = retryResult.response.text();
        const retryCleanedText = retryText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        
        parsed = JSON.parse(retryCleanedText);
      }

      // Validate required fields
      if (!parsed.summary || !Array.isArray(parsed.action_items) || 
          !Array.isArray(parsed.key_decisions) || !Array.isArray(parsed.open_questions) || 
          !Array.isArray(parsed.next_steps)) {
        throw new Error('Invalid AI response structure');
      }

      logger.info('AI transcript processing completed');
      return parsed;
    } catch (err) {
      logger.error({ err }, 'AI transcript processing error');
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
