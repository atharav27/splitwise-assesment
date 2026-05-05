const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// Activity — append-only event log / feed
//
// Design decisions:
//   • TTL index on createdAt auto-expires documents after 90 days.
//   • `metadata` is Mixed so each action type can carry its own payload
//     without bloating the schema (e.g. expense amount, member name, etc.).
//   • Paginate reads with cursor-based pagination on createdAt + _id.
// ---------------------------------------------------------------------------

const ACTIVITY_ACTIONS = [
  'expense.created',
  'expense.updated',
  'expense.deleted',
  'settlement.paid',
  'group.created',
  'member.added',
  'member.removed',
];

const activitySchema = new mongoose.Schema(
  {
    // The user who performed the action
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
    action: {
      type: String,
      enum: {
        values: ACTIVITY_ACTIONS,
        message: '{VALUE} is not a valid action',
      },
      required: [true, 'action is required'],
    },
    entityType: {
      type: String,
      enum: {
        values: ['Expense', 'Settlement', 'Group', 'User'],
        message: '{VALUE} is not a valid entityType',
      },
      required: [true, 'entityType is required'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'entityId is required'],
      // refPath would require a constant ref; we keep it generic since
      // entityType covers the routing at the application layer.
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    // Recipients that should see this item in "My Activity" even if not the actor.
    audienceUserIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    // Flexible payload — e.g. { amount: 500, description: 'Dinner' }
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // No updatedAt — activity log entries are immutable
    timestamps: false,
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

// TTL — auto-delete entries older than 90 days
activitySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90, name: 'ttl_90_days' }
);

// Global feed for a user (e.g. "your recent activity")
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ audienceUserIds: 1, createdAt: -1 });

// Group feed (e.g. "what happened in this group")
activitySchema.index({ groupId: 1, createdAt: -1 });

// Look up all activity touching a specific entity
activitySchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
export {};
