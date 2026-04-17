const MeetingController = require('./meetingController');
const Meeting = require('../models/Meeting');
const Transcript = require('../models/Transcript');
const UrlService = require('../services/urlService');

// Mock dependencies
jest.mock('../models/Meeting');
jest.mock('../models/Transcript');
jest.mock('../models/Client');
jest.mock('../services/urlService');
jest.mock('../services/storageService');
jest.mock('../services/cacheService');
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('MeetingController', () => {
  describe('createMeeting', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        body: {
          clientName: 'Test Client',
          title: 'Test Meeting'
        }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();

      // Reset mocks
      jest.clearAllMocks();
    });

    it('should create a meeting with client name and title', async () => {
      // Arrange
      const mockToken = 'abc123def456';
      const mockMeeting = {
        id: 'meeting-123',
        title: 'Test Meeting',
        share_token: mockToken,
        status: 'pending',
        created_at: new Date()
      };

      UrlService.generateToken.mockReturnValue(mockToken);
      Meeting.create.mockResolvedValue(mockMeeting);

      // Act
      await MeetingController.createMeeting(req, res, next);

      // Assert
      expect(UrlService.generateToken).toHaveBeenCalledTimes(1);
      expect(Meeting.create).toHaveBeenCalledWith({
        clientName: 'Test Client',
        title: 'Test Meeting',
        shareToken: mockToken
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        meeting: {
          id: mockMeeting.id,
          title: mockMeeting.title,
          clientName: 'Test Client',
          shareToken: mockMeeting.share_token,
          status: mockMeeting.status,
          createdAt: mockMeeting.created_at
        }
      });
      const logger = require('../utils/logger');
      expect(logger.info).toHaveBeenCalledWith(
        { meetingId: mockMeeting.id, shareToken: mockToken },
        'Meeting created'
      );
    });

    it('should call next with error if Meeting.create fails', async () => {
      // Arrange
      const mockError = new Error('Database error');
      UrlService.generateToken.mockReturnValue('token123');
      Meeting.create.mockRejectedValue(mockError);

      // Act
      await MeetingController.createMeeting(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should generate unique share token for each meeting', async () => {
      // Arrange
      const mockToken = 'unique-token-123';
      const mockMeeting = {
        id: 'meeting-456',
        title: 'Another Meeting',
        share_token: mockToken,
        status: 'pending',
        created_at: new Date()
      };

      UrlService.generateToken.mockReturnValue(mockToken);
      Meeting.create.mockResolvedValue(mockMeeting);

      // Act
      await MeetingController.createMeeting(req, res, next);

      // Assert
      expect(UrlService.generateToken).toHaveBeenCalled();
      expect(Meeting.create).toHaveBeenCalledWith(
        expect.objectContaining({
          shareToken: mockToken
        })
      );
    });

    it('should return meeting with status pending', async () => {
      // Arrange
      const mockMeeting = {
        id: 'meeting-789',
        title: 'Test Meeting',
        share_token: 'token789',
        status: 'pending',
        created_at: new Date()
      };

      UrlService.generateToken.mockReturnValue('token789');
      Meeting.create.mockResolvedValue(mockMeeting);

      // Act
      await MeetingController.createMeeting(req, res, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          meeting: expect.objectContaining({
            status: 'pending'
          })
        })
      );
    });
  });

  describe('getMeetings', () => {
    let req, res, next;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();

      // Reset mocks
      jest.clearAllMocks();
    });

    it('should fetch 50 most recent meetings sorted by created_at DESC', async () => {
      // Arrange
      const mockMeetings = [
        {
          id: 'meeting-1',
          title: 'Meeting 1',
          client_name: 'Client A',
          status: 'done',
          created_at: new Date('2024-01-15')
        },
        {
          id: 'meeting-2',
          title: 'Meeting 2',
          client_name: 'Client B',
          status: 'pending',
          created_at: new Date('2024-01-14')
        }
      ];

      Meeting.findAll.mockResolvedValue(mockMeetings);

      // Act
      await MeetingController.getMeetings(req, res, next);

      // Assert
      expect(Meeting.findAll).toHaveBeenCalledWith({ limit: 50 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        meetings: [
          {
            id: 'meeting-1',
            title: 'Meeting 1',
            clientName: 'Client A',
            status: 'done',
            createdAt: mockMeetings[0].created_at
          },
          {
            id: 'meeting-2',
            title: 'Meeting 2',
            clientName: 'Client B',
            status: 'pending',
            createdAt: mockMeetings[1].created_at
          }
        ]
      });
      const logger = require('../utils/logger');
      expect(logger.info).toHaveBeenCalledWith(
        { count: 2 },
        'Meetings retrieved'
      );
    });

    it('should return empty array when no meetings exist', async () => {
      // Arrange
      Meeting.findAll.mockResolvedValue([]);

      // Act
      await MeetingController.getMeetings(req, res, next);

      // Assert
      expect(Meeting.findAll).toHaveBeenCalledWith({ limit: 50 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        meetings: []
      });
    });

    it('should include required fields: id, title, clientName, status, createdAt', async () => {
      // Arrange
      const mockMeetings = [
        {
          id: 'meeting-123',
          title: 'Test Meeting',
          client_name: 'Test Client',
          status: 'processing',
          created_at: new Date('2024-01-10'),
          // Extra fields that should not be included
          share_token: 'token123',
          updated_at: new Date()
        }
      ];

      Meeting.findAll.mockResolvedValue(mockMeetings);

      // Act
      await MeetingController.getMeetings(req, res, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        meetings: [
          {
            id: 'meeting-123',
            title: 'Test Meeting',
            clientName: 'Test Client',
            status: 'processing',
            createdAt: mockMeetings[0].created_at
          }
        ]
      });
      // Verify share_token and updated_at are not included
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.meetings[0]).not.toHaveProperty('share_token');
      expect(responseData.meetings[0]).not.toHaveProperty('updated_at');
    });

    it('should call next with error if Meeting.findAll fails', async () => {
      // Arrange
      const mockError = new Error('Database error');
      Meeting.findAll.mockRejectedValue(mockError);

      // Act
      await MeetingController.getMeetings(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('uploadTranscript', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        params: {
          id: 'meeting-123'
        },
        body: {
          content: 'This is a test transcript content'
        }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();

      // Reset mocks
      jest.clearAllMocks();
    });

    it('should upload transcript for existing meeting', async () => {
      // Arrange
      const mockMeeting = {
        id: 'meeting-123',
        title: 'Test Meeting',
        status: 'pending'
      };
      const mockTranscript = {
        id: 'transcript-123',
        meeting_id: 'meeting-123',
        content: 'This is a test transcript content',
        source: 'text',
        created_at: new Date()
      };

      Meeting.findById.mockResolvedValue(mockMeeting);
      Transcript.upsert.mockResolvedValue(mockTranscript);

      // Act
      await MeetingController.uploadTranscript(req, res, next);

      // Assert
      expect(Meeting.findById).toHaveBeenCalledWith('meeting-123');
      expect(Transcript.upsert).toHaveBeenCalledWith({
        meetingId: 'meeting-123',
        content: 'This is a test transcript content',
        source: 'text'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        transcript: {
          id: mockTranscript.id,
          meetingId: mockTranscript.meeting_id,
          source: mockTranscript.source,
          createdAt: mockTranscript.created_at
        }
      });
      const logger = require('../utils/logger');
      expect(logger.info).toHaveBeenCalledWith(
        { meetingId: 'meeting-123', transcriptId: mockTranscript.id },
        'Transcript uploaded'
      );
    });

    it('should return 404 for non-existent meeting', async () => {
      // Arrange
      Meeting.findById.mockResolvedValue(undefined);

      // Act
      await MeetingController.uploadTranscript(req, res, next);

      // Assert
      expect(Meeting.findById).toHaveBeenCalledWith('meeting-123');
      expect(Transcript.upsert).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Meeting not found' });
    });

    it('should replace existing transcript (upsert behavior)', async () => {
      // Arrange
      const mockMeeting = {
        id: 'meeting-123',
        title: 'Test Meeting'
      };
      const mockTranscript = {
        id: 'transcript-123',
        meeting_id: 'meeting-123',
        content: 'Updated transcript content',
        source: 'text',
        created_at: new Date()
      };

      req.body.content = 'Updated transcript content';
      Meeting.findById.mockResolvedValue(mockMeeting);
      Transcript.upsert.mockResolvedValue(mockTranscript);

      // Act
      await MeetingController.uploadTranscript(req, res, next);

      // Assert
      expect(Transcript.upsert).toHaveBeenCalledWith({
        meetingId: 'meeting-123',
        content: 'Updated transcript content',
        source: 'text'
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should set source to "text"', async () => {
      // Arrange
      const mockMeeting = { id: 'meeting-123' };
      const mockTranscript = {
        id: 'transcript-123',
        meeting_id: 'meeting-123',
        content: 'Test content',
        source: 'text',
        created_at: new Date()
      };

      Meeting.findById.mockResolvedValue(mockMeeting);
      Transcript.upsert.mockResolvedValue(mockTranscript);

      // Act
      await MeetingController.uploadTranscript(req, res, next);

      // Assert
      expect(Transcript.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'text'
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          transcript: expect.objectContaining({
            source: 'text'
          })
        })
      );
    });

    it('should call next with error if Transcript.upsert fails', async () => {
      // Arrange
      const mockMeeting = { id: 'meeting-123' };
      const mockError = new Error('Database error');
      
      Meeting.findById.mockResolvedValue(mockMeeting);
      Transcript.upsert.mockRejectedValue(mockError);

      // Act
      await MeetingController.uploadTranscript(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
