const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3, // ISO 4217 codes — INR, USD, EUR, etc.
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Fetch active groups a user belongs to
groupSchema.index({ members: 1, isActive: 1 });
// Fetch groups created by a user
groupSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Group', groupSchema);
export {};
