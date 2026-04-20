import express from 'express';
import { updateUserStatus } from '../controllers/user.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * PATH: /api/users/status
 * METHOD: PATCH
 * PURPOSE: Updates the custom text status for the logged-in user.
 * PROTECTED: Yes (req.auth must exist)
 */
router.patch("/status", protectRoute, updateUserStatus);

export default router;
