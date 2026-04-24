import express from 'express';
import { updateUserStatus, getUserProfile, updateUserProfile } from '../controllers/user.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * PATH: /api/users/me
 * METHOD: GET
 * PURPOSE: Fetches the logged-in user's full profile, task stats, and activity.
 * PROTECTED: Yes
 */
router.get("/me", protectRoute, getUserProfile);

/**
 * PATH: /api/users/update
 * METHOD: PATCH
 * PURPOSE: Updates extended profile fields (bio, jobTitle, department, skills, socialLinks).
 * PROTECTED: Yes
 */
router.patch("/update", protectRoute, updateUserProfile);

/**
 * PATH: /api/users/status
 * METHOD: PATCH
 * PURPOSE: Updates the custom text status for the logged-in user.
 * PROTECTED: Yes (req.auth must exist)
 */
router.patch("/status", protectRoute, updateUserStatus);

export default router;
