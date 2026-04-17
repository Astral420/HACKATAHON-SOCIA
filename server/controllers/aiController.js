const Meeting = require('../models/Meeting');
const Transcript = require('../models/Transcript');
const AiOutput = require('../models/AiOutput');
const AiService = require('../services/aiService');
const CacheService = require('../services/cacheService');
const logger = require('../utils/logger');

class AiController {
  static async processMeeting(req, res, next) {
    try {
      const { id } = req.params;
      const meeting = await Meeting.findById(id);

      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      // Check if transcript exists
      let transcript = await Transcript.findByMeetingId(id);
      
      if (!transcript) {
        return res.status(400).json({ 
          error: 'No transcript available. Please upload or generate transcript first.' 
        });
      }

      // Check cache first
      const cacheKey = `meeting:${id}:ai-output`;
      const cached = await CacheService.get(cacheKey);
      
      if (cached) {
        logger.info({ meetingId: id }, 'Returning cached AI output');
        return res.json(cached);
      }

      // Process with AI
      logger.info({ meetingId: id }, 'Starting AI processing');
      const aiResult = await AiService.processTranscript(transcript.text);

      // Save to database
      const aiOutput = await AiOutput.create({
        meetingId: id,
        summary: aiResult.summary,
        actionItems: JSON.stringify(aiResult.actionItems),
        keyPoints: JSON.stringify(aiResult.keyPoints),
        sentiment: aiResult.sentiment,
      });

      // Cache for 1 hour
      await CacheService.set(cacheKey, aiOutput, 3600);

      res.json(aiOutput);
    } catch (err) {
      next(err);
    }
  }

  static async getAiOutput(req, res, next) {
    try {
      const { id } = req.params;
      
      const cacheKey = `meeting:${id}:ai-output`;
      const cached = await CacheService.get(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const aiOutput = await AiOutput.findByMeetingId(id);

      if (!aiOutput) {
        return res.status(404).json({ 
          error: 'AI output not found. Process the meeting first.' 
        });
      }

      await CacheService.set(cacheKey, aiOutput, 3600);
      res.json(aiOutput);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AiController;
