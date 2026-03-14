const express = require('express');
const { chatAssistant } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/chat', protect, chatAssistant);

module.exports = router;
