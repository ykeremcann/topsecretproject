const mongoose = require('mongoose');

const DietCompletionRecordSchema = new mongoose.Schema({
	completedAt: { type: Date, required: true },
	notes: { type: String }
}, { _id: false });

const DietSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	name: { type: String, required: true },
	description: { type: String },
	duration: { type: Number, required: true }, // gün
	period: { type: String, enum: ['daily', 'weekly', 'monthly', 'custom'], required: true },
	customPeriod: { type: Number },
	completedCount: { type: Number, default: 0 },
	isActive: { type: Boolean, default: true },
	startDate: { type: Date, required: true },
	endDate: { type: Date },
	completionHistory: [DietCompletionRecordSchema],
}, { timestamps: true });

module.exports = mongoose.model('Diet', DietSchema);