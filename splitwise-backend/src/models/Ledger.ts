const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// Ledger — live running pairwise balance table
//
// Design decisions:
//   • One document per (fromUser, toUser, groupId) triplet.
//   • Canonical direction: fromUser's ObjectId.toString() < toUser's ObjectId.toString().
//     Application layer must enforce this before every upsert so we never
//     create both A→B and B→A rows for the same pair.
//   • `amount` is always positive. Direction is entirely encoded by from/to.
//     When amount reaches 0 the debt is cleared (application can delete or
//     keep the zeroed row — queries filter by amount > 0).
//   • Updates use atomic $inc inside a MongoDB session to handle concurrency.
// ---------------------------------------------------------------------------
const ledgerSchema = new mongoose.Schema(
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
    // null for personal (non-group) debts; ObjectId for group-scoped debts
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    // Net amount owed from fromUser to toUser. Always >= 0.
    // Round to 2dp in application logic before every upsert.
    amount: {
      type: Number,
      required: true,
      min: [0, 'Ledger amount cannot be negative'],
      default: 0,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // We manage createdAt/updatedAt manually via lastUpdatedAt here because
    // this document is mutated frequently and we only care about the last touch.
    timestamps: false,
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

// THE critical index — enforces one row per pair+group and powers all upserts.
// groupId uses 1 ascending; null values sort consistently in Mongo.
ledgerSchema.index(
  { fromUser: 1, toUser: 1, groupId: 1 },
  {
    unique: true,
    name: 'unique_ledger_pair_group',
  }
);

// Fetch all debts a user is involved in (either side) for balance calculation
ledgerSchema.index({ fromUser: 1, amount: 1 });
ledgerSchema.index({ toUser: 1, amount: 1 });

// Group-level balance queries
ledgerSchema.index({ groupId: 1, amount: 1 });

module.exports = mongoose.model('Ledger', ledgerSchema);
export {};
