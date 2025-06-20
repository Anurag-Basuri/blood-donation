import { Router } from 'express';
import { validateRequest } from '../../middleware/validator.middleware.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import {
	createBloodRequest,
	updateRequestStatus,
	findDonors,
	getEmergencyRequests,
	trackRequest,
	cancelRequest,
} from '../../controllers/donation/bloodRequest.controller.js';

const router = Router();

// Protect all routes
router.use(verifyJWT);

// Blood Request Routes with rate limiting and validation
router.post('/', validateRequest('bloodRequest.create'), createBloodRequest);

router.patch(
	'/:requestId/status',
	validateRequest('bloodRequest.updateStatus'),
	updateRequestStatus,
);

router.get('/:requestId/donors', validateRequest('bloodRequest.findDonors'), findDonors);

router.get('/emergency', getEmergencyRequests);

router.get('/:requestId/track', validateRequest('bloodRequest.track'), trackRequest);

router.delete('/:requestId', validateRequest('bloodRequest.cancel'), cancelRequest);

// Error handler
router.use((err, req, res, next) => {
	console.error('Blood Request Error:', err);
	if (err.name === 'ValidationError') {
		return res.status(400).json({
			success: false,
			message: err.message,
		});
	}
	next(err);
});

export default router;
