const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// Settlement — immutable payment record
//
// Design decisions:
//   • Never mutated after creation. Each payment = one new document.
//   • Recording a settlement triggers a Ledger upsert in the same MongoDB
//     session (application layer responsibility).
//   • Supports partial payments — amount can be less than the ledger balance.
// ---------------------------------------------------------------------------
const settlementSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'fromUser is required'],
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'toUser is required'],
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    amount: {
      type: Number,
      required: [true, 'Settlement amount is required'],
      min: [0.01, 'Settlement amount must be greater than 0'],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // immutable — no updatedAt
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

// Fetch settlement history between a pair (for audit / statement views)
settlementSchema.index({ fromUser: 1, toUser: 1, createdAt: -1 });

// Fetch all settlements within a group
settlementSchema.index({ groupId: 1, createdAt: -1 });

// Settlements made by or involving a user
settlementSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('Settlement', settlementSchema);
export {};
