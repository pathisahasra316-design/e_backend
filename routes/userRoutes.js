const express = require('express');
const { getUsers, deleteUser, updateUserProfile, getUserProfile } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.route('/')
    .get(protect, authorizeRoles('admin'), getUsers);

router.route('/:id')
    .delete(protect, authorizeRoles('admin'), deleteUser);

module.exports = router;
