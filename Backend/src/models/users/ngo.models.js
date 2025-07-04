import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../../utils/ApiError.js';

// Constants
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const FACILITIES = [
	'Free Health Checkup',
	'Refreshments',
	'Donation Certificates',
	'Transport',
	'Blood Testing',
	'Blood Storage',
	'Counseling',
	'Emergency Response',
	'Home Collection',
	'Mobile Collection Unit',
	'Platelet Donation',
];

const ngoSchema = new mongoose.Schema(
	{
		// Basic Info
		name: {
			type: String,
			required: [true, 'NGO name is required'],
			trim: true,
			minlength: [3, 'Name must be at least 3 characters'],
		},
		email: {
			type: String,
			required: [true, 'Email is required'],
			unique: true,
			lowercase: true,
			trim: true,
			match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please enter a valid email'],
			index: true,
		},
		password: {
			type: String,
			required: [true, 'Password is required'],
			minlength: [8, 'Password must be at least 8 characters'],
			select: false,
			validate: {
				validator: function (password) {
					return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
						password,
					);
				},
				message: 'Password must contain uppercase, lowercase, number and special character',
			},
		},
		profilePicture: {
			type: String,
			default: 'https://example.com/default-profile-picture.png',
			validate: {
				validator: function (url) {
					return /^(https?:\/\/)?([\w-]+(\.[\w-]+)+(\/[\w- .\/?%&=]*)?)$/.test(url);
				},
				message: 'Invalid URL format for profile picture',
			},
		},

		// logo
		logo: {
			url: {
				type: String,
				required: true,
			},
			publicId: {
				type: String,
				required: true,
			},
			uploadedAt: {
				type: Date,
				default: Date.now,
			},
		},

		// Verification & Auth
		isVerified: { type: Boolean, default: false },
		verificationOTP: {
			code: String,
			expiresAt: Date,
		},
		adminApproved: {
			type: Boolean,
			default: false,
		},
		refreshToken: {
			type: String,
			select: false,
		},
		lastLogin: {
			type: Date,
		},
		loginAttempts: {
			type: Number,
			default: 0,
		},

		deactivated: {
			type: Boolean,
			default: false,
		},
		deactivationReason: {
			type: String,
			enum: ['User Request', 'Inactivity', 'Violation of Terms', 'Other'],
			default: 'User Request',
		},
		lockedUntil: Date,

		// Contact
		contactPerson: {
			name: {
				type: String,
				required: true,
			},
			phone: {
				type: String,
				required: true,
				validate: {
					validator: v => /^\+?[\d\s-]{10,}$/.test(v),
					message: 'Invalid phone number format',
				},
			},
			position: String,
			alternatePhone: String,
			email: String,
		},

		// Address
		address: {
			street: { type: String, required: true },
			city: { type: String, required: true, index: true },
			state: { type: String, required: true },
			pinCode: {
				type: String,
				required: true,
				validate: {
					validator: v => /^\d{6}$/.test(v),
					message: 'Invalid PIN code',
				},
			},
			country: { type: String, default: 'India' },
			location: {
				type: { type: String, enum: ['Point'], default: 'Point' },
				coordinates: {
					type: [Number],
					required: true,
					validate: {
						validator: coords =>
							coords.length === 2 &&
							coords[0] >= -180 &&
							coords[0] <= 180 &&
							coords[1] >= -90 &&
							coords[1] <= 90,
						message: 'Invalid coordinates',
					},
				},
			},
		},

		// Registration Info
		regNumber: {
			type: String,
			unique: true,
			sparse: true,
			validate: {
				validator: v => /^[A-Z0-9-]{5,}$/i.test(v),
				message: 'Invalid registration number format',
			},
		},
		affiliation: {
			type: String,
			enum: ['Government', 'Private', 'Independent', 'Religious', 'Corporate', 'Other'],
			default: 'Independent',
		},
		establishedYear: Number,
		license: {
			number: String,
			validUntil: Date,
			issuedBy: String,
		},

		// Document Uploads (Cloudinary URLs)
		documents: {
			aadhaarCard: {
				url: String,
				publicId: String,
				uploadedAt: { type: Date, default: Date.now },
				status: {
					type: String,
					enum: ['PENDING', 'APPROVED', 'REJECTED'],
					default: 'PENDING',
				},
			},
			panCard: {
				url: String,
				publicId: String,
				uploadedAt: { type: Date, default: Date.now },
				status: {
					type: String,
					enum: ['PENDING', 'APPROVED', 'REJECTED'],
					default: 'PENDING',
				},
			},
			gstCertificate: {
				url: String,
				publicId: String,
				uploadedAt: { type: Date, default: Date.now },
				status: {
					type: String,
					enum: ['PENDING', 'APPROVED', 'REJECTED'],
					default: 'PENDING',
				},
			},
			licenseDocument: {
				url: String,
				publicId: String,
				uploadedAt: { type: Date, default: Date.now },
				status: {
					type: String,
					enum: ['PENDING', 'APPROVED', 'REJECTED'],
					default: 'PENDING',
				},
			},
		},

		// Services
		facilities: [{ type: String, enum: FACILITIES }],
		operatingHours: [
			{
				day: {
					type: String,
					enum: [
						'Monday',
						'Tuesday',
						'Wednesday',
						'Thursday',
						'Friday',
						'Saturday',
						'Sunday',
					],
				},
				open: String,
				close: String,
				is24x7: Boolean,
			},
		],

		// Blood Inventory
		bloodInventory: [
			{
				bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true },
				units: { type: Number, default: 0, min: 0 },
				capacity: { type: Number, default: 100 },
				reserved: { type: Number, default: 0 },
				lastUpdated: { type: Date, default: Date.now },
				expiryAlert: {
					enabled: { type: Boolean, default: true },
					threshold: { type: Number, default: 5 },
				},
			},
		],

		// Stats
		statistics: {
			totalCampsOrganized: { type: Number, default: 0 },
			totalDonationsCollected: { type: Number, default: 0 },
			totalHospitalsServed: { type: Number, default: 0 },
			lastCampDate: Date,
			monthlyStats: [
				{
					month: Date,
					donationsCollected: Number,
					hospitalsServed: Number,
					emergencyRequests: Number,
				},
			],
			successRate: { type: Number, min: 0, max: 100, default: 0 },
		},

		// Config
		settings: {
			notificationsEnabled: { type: Boolean, default: true },
			autoAcceptRequests: { type: Boolean, default: false },
			minBloodLevelAlert: { type: Number, default: 5 },
			emergencyResponseEnabled: { type: Boolean, default: true },
			maxDeliveryRadius: { type: Number, default: 50 },
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
);

// Indexes
ngoSchema.index({ 'address.city': 1, 'address.pinCode': 1 });
ngoSchema.index({ 'address.location': '2dsphere' });
ngoSchema.index({ 'bloodInventory.bloodGroup': 1, 'bloodInventory.units': 1 });
ngoSchema.index({ 'connectedHospitals.hospitalId': 1, 'connectedHospitals.status': 1 });

// Virtuals
ngoSchema.virtual('upcomingCamps', {
	ref: 'DonationCamp',
	localField: '_id',
	foreignField: 'ngoId',
	match: { campDate: { $gte: new Date() } },
});

// Methods
ngoSchema.methods = {
	async comparePassword(candidatePassword) {
		return await bcrypt.compare(candidatePassword, this.password);
	},
	generateAuthToken() {
		return jwt.sign({ id: this._id, email: this.email }, process.env.JWT_SECRET, {
			expiresIn: process.env.JWT_EXPIRY,
		});
	},
	async updateBloodStock(bloodGroup, units, operation = 'add') {
		let inventory = this.bloodInventory.find(item => item.bloodGroup === bloodGroup);
		if (!inventory) {
			inventory = { bloodGroup, units: 0, lastUpdated: new Date() };
			this.bloodInventory.push(inventory);
		}
		switch (operation) {
			case 'add':
				inventory.units += units;
				break;
			case 'subtract':
				if (inventory.units < units) throw new ApiError(400, 'Insufficient blood units');
				inventory.units -= units;
				break;
			case 'set':
				inventory.units = Math.max(0, units);
				break;
			default:
				throw new ApiError(400, 'Invalid operation');
		}
		inventory.lastUpdated = new Date();
		return this.save();
	},
	async findNearbyHospitals(maxDistance = 10000) {
		return mongoose
			.model('Hospital')
			.find({
				'address.location': {
					$near: {
						$geometry: this.address.location,
						$maxDistance: maxDistance,
					},
				},
				isVerified: true,
			})
			.select('name address contactPerson');
	},
	async calculateStatistics() {
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const monthlyStats = {
			month: monthStart,
			donationsCollected: 0,
			hospitalsServed: 0,
			emergencyRequests: 0,
		};
		this.statistics.monthlyStats.push(monthlyStats);
		return this.save();
	},
};

// Middleware
ngoSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();
	try {
		this.password = await bcrypt.hash(this.password, 12);
		next();
	} catch (error) {
		next(error);
	}
});

export const NGO = mongoose.model('NGO', ngoSchema);
export { FACILITIES };
