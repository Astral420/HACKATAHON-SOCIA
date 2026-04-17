const Meeting = require('../models/Meeting');
const StorageService = require('../services/storageService');
const CacheService = require('../services/cacheService');
const UrlService = require('../services/urlService');
const logger = require('../utils/logger');

class MeetingController {
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
