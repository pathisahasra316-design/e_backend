const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(getSettings)
    .put(protect, authorizeRoles('admin'), updateSettings);

module.exports = router;
