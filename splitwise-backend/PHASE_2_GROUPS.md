# Phase 2 — Groups Module

## Goal
Full group lifecycle: create, list, fetch, add/remove members, soft-delete. Admin-only mutation guards. Activity logging stub.

---

## Files to Create / Edit

```
src/modules/groups/
  group.controller.js
  group.service.js
  group.repository.js
  group.validator.js
src/routes/index.js   ← add groups route
```

---

## Implementation

### `src/modules/groups/group.validator.js`
```js
const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');

const createGroupSchema = z.object({
  name:        z.string().trim().min(1, 'Name is required').max(100),
  description: z.string().trim().max(500).optional().default(''),
  members:     z.array(objectId).optional().default([]),
  currency:    z.string().length(3).toUpperCase().optional().default('INR'),
});

const addMemberSchema = z.object({
  userId: objectId,
});

module.exports = { createGroupSchema, addMemberSchema, objectId };
```

---

### `src/modules/groups/group.repository.js`
```js
const { Group } = require('../../models');

const MEMBER_POPULATE = { path: 'members',   select: '_id name email avatar' };
const CREATOR_POPULATE = { path: 'createdBy', select: '_id name email' };

const create = (data) => Group.create(data);

const findById = (id) =>
  Group.findOne({ _id: id, isActive: true })
    .populate(MEMBER_POPULATE)
    .populate(CREATOR_POPULATE);

// All active groups where userId is in members[]
const findByMember = (userId) =>
  Group.find({ members: userId, isActive: true })
    .populate(MEMBER_POPULATE)
    .populate(CREATOR_POPULATE)
    .sort({ createdAt: -1 });

// Add userId to members[] — $addToSet = idempotent (no-op if already present)
const addMember = (groupId, userId) =>
  Group.findByIdAndUpdate(
    groupId,
    { $addToSet: { members: userId } },
    { new: true }
  ).populate(MEMBER_POPULATE).populate(CREATOR_POPULATE);

// Pull userId from members[]
const removeMember = (groupId, userId) =>
  Group.findByIdAndUpdate(
    groupId,
    { $pull: { members: userId } },
    { new: true }
  ).populate(MEMBER_POPULATE).populate(CREATOR_POPULATE);

// Soft-delete
const softDelete = (groupId) =>
  Group.findByIdAndUpdate(groupId, { isActive: false }, { new: true });

module.exports = { create, findById, findByMember, addMember, removeMember, softDelete };
```

---

### `src/modules/groups/group.service.js`
```js
const groupRepo = require('./group.repository');
const AppError  = require('../../utils/AppError');
const { User }  = require('../../models');

// ─── Create ────────────────────────────────────────────────────────────────
const createGroup = async ({ name, description, members, currency }, creatorId) => {
  // Always ensure creator is in members
  const memberSet = [...new Set([...members, creatorId.toString()])];

  // Validate all provided userIds exist and are active
  await assertUsersExist(memberSet);

  const group = await groupRepo.create({
    name,
    description,
    members: memberSet,
    createdBy: creatorId,
    currency,
  });

  return groupRepo.findById(group._id); // return populated
};

// ─── List ──────────────────────────────────────────────────────────────────
const getMyGroups = (userId) => groupRepo.findByMember(userId);

// ─── Get One ───────────────────────────────────────────────────────────────
const getGroupById = async (groupId, requesterId) => {
  const group = await groupRepo.findById(groupId);
  if (!group) throw new AppError('Group not found', 404);
  assertMember(group, requesterId);
  return group;
};

// ─── Add Member ────────────────────────────────────────────────────────────
const addMember = async (groupId, targetUserId, requesterId) => {
  const group = await getGroupRaw(groupId);
  assertAdmin(group, requesterId);

  // Confirm target user exists
  await assertUsersExist([targetUserId]);

  return groupRepo.addMember(groupId, targetUserId); // $addToSet is idempotent
};

// ─── Remove Member ─────────────────────────────────────────────────────────
const removeMember = async (groupId, targetUserId, requesterId) => {
  const group = await getGroupRaw(groupId);
  assertAdmin(group, requesterId);

  if (group.createdBy.toString() === targetUserId.toString()) {
    throw new AppError('Cannot remove the group creator', 400);
  }

  return groupRepo.removeMember(groupId, targetUserId);
};

// ─── Delete ────────────────────────────────────────────────────────────────
const deleteGroup = async (groupId, requesterId) => {
  const group = await getGroupRaw(groupId);
  assertAdmin(group, requesterId);
  await groupRepo.softDelete(groupId);
};

// ─── Helpers ───────────────────────────────────────────────────────────────

// Fetch without population (for guard checks)
const getGroupRaw = async (groupId) => {
  const group = await require('../../models').Group.findOne({ _id: groupId, isActive: true });
  if (!group) throw new AppError('Group not found', 404);
  return group;
};

// Guard: requester must be in members[]
const assertMember = (group, userId) => {
  const isMember = group.members.some(
    (m) => m._id?.toString() === userId.toString() || m.toString() === userId.toString()
  );
  if (!isMember) throw new AppError('Access denied — not a group member', 403);
};

// Guard: requester must be createdBy
const assertAdmin = (group, userId) => {
  if (group.createdBy.toString() !== userId.toString()) {
    throw new AppError('Access denied — only the group admin can perform this action', 403);
  }
};

// Confirm all userIds exist as active users
const assertUsersExist = async (userIds) => {
  const found = await User.find({ _id: { $in: userIds }, isActive: true }).select('_id');
  if (found.length !== userIds.length) {
    const foundIds = found.map((u) => u._id.toString());
    const missing  = userIds.filter((id) => !foundIds.includes(id.toString()));
    throw new AppError(`Users not found: ${missing.join(', ')}`, 400);
  }
};

module.exports = {
  createGroup,
  getMyGroups,
  getGroupById,
  addMember,
  removeMember,
  deleteGroup,
};
```

---

### `src/modules/groups/group.controller.js`
```js
const express       = require('express');
const router        = express.Router();
const groupService  = require('./group.service');
const { protect }   = require('../../middlewares/auth.middleware');
const { success }   = require('../../utils/apiResponse');
const { createGroupSchema, addMemberSchema } = require('./group.validator');

// All group routes are protected
router.use(protect);

// POST /api/groups
router.post('/', async (req, res) => {
  const body  = createGroupSchema.parse(req.body);
  const group = await groupService.createGroup(body, req.user.id);
  success(res, group, 'Group created', 201);
});

// GET /api/groups
router.get('/', async (req, res) => {
  const groups = await groupService.getMyGroups(req.user.id);
  success(res, groups, 'Groups fetched');
});

// GET /api/groups/:id
router.get('/:id', async (req, res) => {
  const group = await groupService.getGroupById(req.params.id, req.user.id);
  success(res, group, 'Group fetched');
});

// POST /api/groups/:id/members
router.post('/:id/members', async (req, res) => {
  const { userId } = addMemberSchema.parse(req.body);
  const group = await groupService.addMember(req.params.id, userId, req.user.id);
  success(res, group, 'Member added');
});

// DELETE /api/groups/:id/members/:userId
router.delete('/:id/members/:userId', async (req, res) => {
  const group = await groupService.removeMember(req.params.id, req.params.userId, req.user.id);
  success(res, group, 'Member removed');
});

// DELETE /api/groups/:id
router.delete('/:id', async (req, res) => {
  await groupService.deleteGroup(req.params.id, req.user.id);
  success(res, null, 'Group deleted');
});

module.exports = router;
```

---

### `src/routes/index.js` — update
```js
router.use('/auth',   require('../modules/auth/auth.controller'));
router.use('/users',  require('../modules/users/user.controller'));
router.use('/groups', require('../modules/groups/group.controller'));
```

---

## Edge Cases Handled

| Scenario | Handling |
|----------|----------|
| Group not found | `404` |
| Non-member fetches group | `403` |
| Non-admin adds/removes member | `403` |
| Trying to remove group creator | `400` |
| Adding existing member | Idempotent via `$addToSet` — no error |
| Adding non-existent userId | `400` with missing IDs listed |
| Deleting group | Soft-delete, data retained |
| Creator not in members on create | Auto-injected via `Set` merge |

---

## Phase 2 Checklist

- [ ] `POST /api/groups` creates group with creator auto-added to members
- [ ] `GET /api/groups` returns only groups the requester belongs to
- [ ] `GET /api/groups/:id` → `403` for non-members
- [ ] `POST /api/groups/:id/members` with non-existent userId → `400`
- [ ] Adding an existing member is a no-op (idempotent)
- [ ] `DELETE /api/groups/:id/members/:userId` removes member correctly
- [ ] Removing group creator → `400`
- [ ] Non-admin calling add/remove member → `403`
- [ ] `DELETE /api/groups/:id` soft-deletes (group still in DB, `isActive: false`)
- [ ] All responses follow `{ success, data, message }` shape
