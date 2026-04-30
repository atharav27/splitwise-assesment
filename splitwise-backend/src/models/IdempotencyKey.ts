const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// IdempotencyKey — deduplication cache for mutating API calls
//
// Design decisions:
//   • TTL index on createdAt auto-expires records after 24 hours.
//   • `responseBody` stored as a JSON string so we can return the exact
//     original response bytes without re-serializing.
//   • The middleware flow:
//       1. Check for Idempotency-Key header. If absent, skip (no guarantee).
//       2. findOne({ key }). If found and not expired, return cached response.
//       3. If not found, proceed with handler, then save this doc.
//   • Key reuse with a different request body → return original response
//     (don't reprocess). Application middleware enforces this.
// ---------------------------------------------------------------------------
const idempotencyKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Idempotency key is required'],
      unique: true,
      trim: true,
      maxlength: [255, 'Key cannot exceed 255 characters'],
    },
    // The full response body serialized as JSON string
    responseBody: {
      type: String,
      required: [true, 'responseBody is required'],
    },
    statusCode: {
      type: Number,
      required: [true, 'statusCode is required'],
      min: 100,
      max: 599,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // createdAt is defined manually for TTL index
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

// TTL — auto-delete after 24 hours
idempotencyKeySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24, name: 'ttl_24_hours' }
);

// `key` field already has a unique index from `unique: true` in the schema def.

module.exports = mongoose.model('IdempotencyKey', idempotencyKeySchema);
export {};
