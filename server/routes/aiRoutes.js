const express = require('express');
const AiController = require('../controllers/aiController');
const { validate, schemas } = require('../middlewares/validateMiddleware');

const router = express.Router();

router.post('/:id/process', validate(schemas.processMeeting), AiController.processMeeting);
router.get('/:id/ai-output', AiController.getAiOutput);

module.exports = router;
