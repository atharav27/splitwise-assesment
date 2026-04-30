import express from 'express';
import { protect } from '../../middlewares/auth.middleware';
import { success } from '../../utils/apiResponse';
import * as groupService from './group.service';
import { addMemberSchema, createGroupSchema } from './group.validator';

const router = express.Router();

router.use(protect);

router.post('/', async (req, res) => {
  const body = createGroupSchema.parse(req.body);
  const group = await groupService.createGroup(body, req.user!.id);
  return success(res, group, 'Group created', 201);
});

router.get('/', async (req, res) => {
  const groups = await groupService.getMyGroups(req.user!.id);
  return success(res, groups, 'Groups fetched');
});

router.get('/:id', async (req, res) => {
  const group = await groupService.getGroupById(req.params.id, req.user!.id);
  return success(res, group, 'Group fetched');
});

router.post('/:id/members', async (req, res) => {
  const { userId } = addMemberSchema.parse(req.body);
  const group = await groupService.addMember(req.params.id, userId, req.user!.id);
  return success(res, group, 'Member added');
});

router.delete('/:id/members/:userId', async (req, res) => {
  const group = await groupService.removeMember(req.params.id, req.params.userId, req.user!.id);
  return success(res, group, 'Member removed');
});

router.delete('/:id', async (req, res) => {
  await groupService.deleteGroup(req.params.id, req.user!.id);
  return success(res, null, 'Group deleted');
});

export default router;
