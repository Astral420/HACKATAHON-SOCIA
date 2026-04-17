const Meeting = require('../models/Meeting');
const AiOutput = require('../models/AiOutput');
const Transcript = require('../models/Transcript');
const Client = require('../models/Client');
const UrlService = require('../services/urlService');
const CacheService = require('../services/cacheService');
const logger = require('../utils/logger');

class ClientViewController {
  static async getPublicMeeting(req, res, next) {
    try {
      const { token } = req.params;

      // Validate token
      const validation = await UrlService.validateToken(token);
      
      if (!validation.valid) {
        return res.status(404).json({ error: 'Invalid or expired share link' });
      }

      const meetingId = validation.meetingId;
      const cacheKey = `public:meeting:${meetingId}`;

      // Check cache
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Fetch meeting data
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      const client = await Client.findById(meeting.client_id);
      const aiOutput = await AiOutput.findByMeetingId(meetingId);
      const transcript = await Transcript.findByMeetingId(meetingId);

      const response = {
        meeting: {
          id: meeting.id,
          title: meeting.title,
          createdAt: meeting.created_at,
        },
        client: client ? {
          name: client.name,
          company: client.company,
        } : null,
        aiOutput: aiOutput ? {
          summary: aiOutput.summary,
          actionItems: JSON.parse(aiOutput.action_items || '[]'),
          keyPoints: JSON.parse(aiOutput.key_points || '[]'),
          sentiment: aiOutput.sentiment,
        } : null,
        transcript: transcript ? transcript.text : null,
      };

      // Cache for 5 minutes
      await CacheService.set(cacheKey, response, 300);
      
      logger.info({ meetingId, token }, 'Public meeting accessed');
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ClientViewController;
