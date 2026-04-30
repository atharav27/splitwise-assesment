const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// Sub-schema: one row in splitDetails[]
// Stores the resolved share for each participant.
// For equal splits: only `amount` is populated.
// For percentage splits: both `percentage` and `amount` are populated.
// For unequal splits: only `amount` is populated.
// ---------------------------------------------------------------------------
const splitDetailSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Split amount cannot be negative'],
    },
    percentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
      default: null,
    },
  },
  { _id: false } // no separate _id for subdocs — keeps the array lean
);

// ---------------------------------------------------------------------------
// Sub-schema: one entry in history[] (audit trail / versioning)
// Before any update we push the current document state here.
// ---------------------------------------------------------------------------
const historySnapshotSchema = new mongoose.Schema(
  {
    updatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Full snapshot of the expense fields at the time of this version.
    // Stored as Mixed so we don't have to mirror the entire schema here.
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

// ---------------------------------------------------------------------------
// Main Expense schema
// ---------------------------------------------------------------------------
const expenseSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [255, 'Description cannot exceed 255 characters'],
    },
    // Store as a plain Number; always round to 2dp in application logic
    // before saving. Mongoose doesn't natively enforce decimal places, so
    // the rounding is the service layer's responsibility.
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'paidBy is required'],
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null, // null = personal / non-group expense
    },
    category: {
      type: String,
      enum: {
        values: ['food', 'travel', 'utilities', 'entertainment', 'other'],
        message: '{VALUE} is not a valid category',
      },
      default: 'other',
    },
    splitType: {
      type: String,
      enum: {
        values: ['equal', 'unequal', 'percentage'],
        message: '{VALUE} is not a valid split type',
      },
      required: [true, 'splitType is required'],
    },
    splitDetails: {
      type: [splitDetailSchema],
      validate: {
        validator: (arr: unknown[]) => arr.length > 0,
        message: 'splitDetails must contain at least one entry',
      },
    },
    // Capped at 20 versions in application logic (slice before push).
    history: {
      type: [historySnapshotSchema],
      default: [],
    },
    // Unique sparse index below — null values are excluded from uniqueness check,
    // so expenses without an idempotency key coexist freely.
    idempotencyKey: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

// Idempotency enforcement — sparse so null keys don't conflict
expenseSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

// Common list queries: expenses for a group, excluding deleted
expenseSchema.index({ groupId: 1, isDeleted: 1, createdAt: -1 });

// Expenses paid by a user
expenseSchema.index({ paidBy: 1, isDeleted: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
export {};
