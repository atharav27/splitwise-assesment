const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // never returned in queries by default
    },
    avatar: {
      type: String,
      default: null,
      match: [/^https?:\/\/.+/, 'Avatar must be a valid URL'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Index for soft-delete filtering — most queries only want active users
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);
export {};
