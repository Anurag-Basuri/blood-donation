import express from 'express';
import {
	registerUser,
	loginUser,
	logoutUser,
	refreshAccessToken,
	updateProfile,
	changePassword,
	getDonationHistory,
	getUserActivities,
	getNotifications,
	markNotificationsRead,
	uploadProfilePicture,
	getUserProfile,
	getCurrentUser,
	deleteUserAccount,
	verifyPhoneNumber,
	verifyPhoneOTP,
	sendVerificationEmail,
	verifyEmail,
} from '../../controllers/users/user.controller.js';
import { uploadFields, handleMulterError } from '../../middleware/multer.middleware.js';
import { verifyJWT, requireRoles } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validator.middleware.js';
import { userValidationRules } from '../../validations/user.validations.js';

const router = express.Router();

// Ensure JSON parsing (optional here if done globally in app.js)
router.use(express.json());

/*🔓 PUBLIC ROUTES*/
// User registration and login
router.post('/register', validateRequest(userValidationRules.register), registerUser);

// User login and token refresh
router.post('/login', validateRequest(userValidationRules.login), loginUser);

// Refresh access token
router.post('/refresh-token', refreshAccessToken);

// Verify phone number and OTP
router.post('/verify-phone', verifyPhoneNumber);

// Verify phone OTP
router.post('/verify-phone-otp', verifyPhoneOTP);

// Send verification email and verify email
router.post('/send-verification-email', sendVerificationEmail);

// Verify email
router.post('/verify-email', verifyEmail);

/*🔐 PROTECTED USER ROUTES*/
router.use(verifyJWT, requireRoles(['user'])); // Only allow users

// Logout user
router.post('/logout', logoutUser);

// Upload profile picture
router.post(
	'/upload-profile-picture',
	uploadFields([{ name: 'profilePicture', maxCount: 1 }]),
	validateRequest(userValidationRules.uploadProfilePicture),
	handleMulterError,
	uploadProfilePicture,
);

// Verify phone number
router.put('/profile', validateRequest(userValidationRules.profileUpdate), updateProfile);

// Change password
router.put('/change-password', validateRequest(userValidationRules.passwordChange), changePassword);

// Verify phone number
router.get('/donation-history', getDonationHistory);

// Get user activities
router.get('/activities', getUserActivities);

// Get notifications
router.get('/notifications', getNotifications);

// Mark notifications as read
router.put('/notifications/mark-read', markNotificationsRead);

// Get user profile details
router.get('/profile', getUserProfile);

// Get current user details
router.get('/me', getCurrentUser);

// Delete user account
router.delete('/account', deleteUserAccount);

export default router;
