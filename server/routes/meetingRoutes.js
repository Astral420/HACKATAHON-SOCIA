const express = require('express');
const MeetingController = require('../controllers/meetingController');
const { validate, schemas } = require('../middlewares/validateMiddleware');

const router = express.Router();

router.post('/', validate(schemas.createMeeting), MeetingController.create);
router.get('/', MeetingController.getAll);
router.get('/:id', MeetingController.getById);
router.put('/:id', validate(schemas.updateMeeting), MeetingController.update);
router.delete('/:id', MeetingController.delete);
router.post('/:id/upload', MeetingController.uploadRecording);
router.post('/:id/share', MeetingController.createShareLink);

module.exports = router;
