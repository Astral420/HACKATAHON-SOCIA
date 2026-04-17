const express = require('express');
const MeetingController = require('../controllers/meetingController');
const { validate, schemas } = require('../middlewares/validateMiddleware');

const router = express.Router();

/**
 * Meeting Routes
 * All routes are protected by authMiddleware applied in app.js
 * Requirements: 11.4
 */

// POST /api/meetings - Create new meeting with validation
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
router.post('/', validate(schemas.createMeeting), MeetingController.createMeeting);

// POST /api/meetings/:id/transcript - Upload transcript with validation
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
router.post('/:id/transcript', validate(schemas.uploadTranscript), MeetingController.uploadTranscript);

// GET /api/meetings - List all meetings
// Requirements: 5.1, 5.2, 5.3
router.get('/', MeetingController.getMeetings);

// GET /api/meetings/:id - Get meeting details with AI outputs
// Requirements: 6.1, 6.2, 6.3, 6.4
router.get('/:id', MeetingController.getMeetingResult);

// Additional routes for extended functionality
router.put('/:id', validate(schemas.updateMeeting), MeetingController.update);
router.delete('/:id', MeetingController.delete);
router.post('/:id/upload', MeetingController.uploadRecording);
router.post('/:id/share', MeetingController.createShareLink);

module.exports = router;
