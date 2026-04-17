const Meeting = require('../models/Meeting');
const Client = require('../models/Client');
const Transcript = require('../models/Transcript');
const StorageService = require('../services/storageService');
const CacheService = require('../services/cacheService');
const UrlService = require('../services/urlService');
const logger = require('../utils/logger');

class MeetingController {
  /**
   * Create a new meeting with client information
   * Implements task 8.1: Extract clientName and title, generate share token,
   * create or find client, create meeting with status "pending"
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
   */
  static async createMeeting(req, res, next) {
    try {
      const { clientName, title } = req.body;

      // Generate unique share token
      const shareToken = UrlService.generateToken();

      // Create meeting (Meeting.create handles client creation internally)
      const meeting = await Meeting.create({
        clientName,
        title,
        shareToken
      });

      logger.info({ meetingId: meeting.id, shareToken }, 'Meeting created');

      // Return meeting with id and shareToken
      res.status(201).json({
        meeting: {
          id: meeting.id,
          title: meeting.title,
          clientName: clientName,
          shareToken: meeting.share_token,
          status: meeting.status,
          createdAt: meeting.created_at
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Upload transcript for a meeting
   * Implements task 8.2: Extract meetingId and content, validate transcript,
   * upsert transcript with source "text"
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  static async uploadTranscript(req, res, next) {
    try {
      const { id } = req.params;
      const { content } = req.body;

      // Check if meeting exists
      const meeting = await Meeting.findById(id);
      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      // Upsert transcript with source "text"
      const transcript = await Transcript.upsert({
        meetingId: id,
        content,
        source: 'text'
      });

      logger.info({ meetingId: id, transcriptId: transcript.id }, 'Transcript uploaded');

      // Return transcript details
      res.status(200).json({
        transcript: {
          id: transcript.id,
          meetingId: transcript.meeting_id,
          source: transcript.source,
          createdAt: transcript.created_at
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get list of meetings
   * Implements task 8.3: Fetch 50 most recent meetings sorted by created_at DESC
   * Include id, title, client name, status, created_at
   * Requirements: 5.1, 5.2, 5.3
   */
  static async getMeetings(req, res, next) {
    try {
      // Fetch 50 most recent meetings
      const meetings = await Meeting.findAll({ limit: 50 });

      logger.info({ count: meetings.length }, 'Meetings retrieved');

      // Return meetings with required fields
      res.status(200).json({
        meetings: meetings.map(meeting => ({
          id: meeting.id,
          title: meeting.title,
          clientName: meeting.client_name,
          status: meeting.status,
          createdAt: meeting.created_at
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get meeting result with AI outputs
   * Implements task 8.4: Fetch meeting by id with AI outputs
   * Return 404 if meeting not found, include summary and all JSONB arrays
   * Requirements: 6.1, 6.2, 6.3, 6.4
   */
  static async getMeetingResult(req, res, next) {
    try {
      const { id } = req.params;

      // Fetch meeting with AI outputs
      const meeting = await Meeting.findById(id, { includeAiOutput: true });

      // Return 404 if meeting not found
      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      logger.info({ meetingId: id }, 'Meeting result retrieved');

      // Return meeting with AI outputs
      res.status(200).json({
        meeting: {
          id: meeting.id,
          title: meeting.title,
          clientName: meeting.client_name,
          status: meeting.status,
          createdAt: meeting.created_at,
          updatedAt: meeting.updated_at
        },
        output: meeting.summary ? {
          summary: meeting.summary,
          action_items: meeting.action_items || [],
          key_decisions: meeting.key_decisions || [],
          open_questions: meeting.open_questions || [],
          next_steps: meeting.next_steps || []
        } : null
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const { clientId, title, recordingUrl } = req.body;
      const userId = req.userId;

      const meeting = await Meeting.create({
        clientId,
        title,
        recordingUrl,
        userId,
      });

      logger.info({ meetingId: meeting.id }, 'Meeting created');
      res.status(201).json(meeting);
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req, res, next) {
    try {
      const userId = req.userId;
      const { clientId } = req.query;

      const meetings = await Meeting.findAll(userId, { clientId });
      res.json(meetings);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const meeting = await Meeting.findById(id);

      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      res.json(meeting);
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const meeting = await Meeting.update(id, updates);

      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      await CacheService.invalidatePattern(`meeting:${id}:*`);
      logger.info({ meetingId: id }, 'Meeting updated');
      
      res.json(meeting);
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      await Meeting.delete(id);

      await CacheService.invalidatePattern(`meeting:${id}:*`);
      logger.info({ meetingId: id }, 'Meeting deleted');
      
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  static async uploadRecording(req, res, next) {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const key = StorageService.generateKey(req.userId, file.originalname);
      const url = await StorageService.uploadFile(file, key);

      const meeting = await Meeting.update(id, { recordingUrl: url });
      
      logger.info({ meetingId: id, url }, 'Recording uploaded');
      res.json(meeting);
    } catch (err) {
      next(err);
    }
  }

  static async createShareLink(req, res, next) {
    try {
      const { id } = req.params;
      const meeting = await Meeting.findById(id);

      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      const shareData = await UrlService.createShareUrl(id);
      res.json(shareData);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = MeetingController;
