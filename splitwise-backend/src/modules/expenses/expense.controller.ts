import express from 'express';
import { protect } from '../../middlewares/auth.middleware';
import { idempotencyCheck } from '../../middlewares/idempotency.middleware';
import { success } from '../../utils/apiResponse';
import * as expenseService from './expense.service';
import { createExpenseSchema, objectId, paginationSchema, updateExpenseSchema } from './expense.validator';

const router = express.Router();

router.use(protect);

router.post('/', idempotencyCheck, async (req, res) => {
  const body = createExpenseSchema.parse(req.body);
  const expense = await expenseService.createExpense(body, req.user!.id, req.idempotencyKey);
  return success(res, expense, 'Expense created', 201);
});

router.get('/', async (req, res) => {
  const query = paginationSchema.parse(req.query);
  const result = await expenseService.getExpenses(query, req.user!.id);
  return success(res, result, 'Expenses fetched');
});

router.get('/group/:groupId', async (req, res) => {
  const groupId = objectId.parse(req.params.groupId);
  const query = paginationSchema.parse(req.query);
  const result = await expenseService.getExpenses({ ...query, groupId }, req.user!.id);
  return success(res, result, 'Expenses fetched');
});

router.get('/:id', async (req, res) => {
  const expense = await expenseService.getExpenseByIdForRequester(req.params.id, req.user!.id);
  return success(res, expense, 'Expense fetched');
});

router.get('/:id/history', async (req, res) => {
  const expense = await expenseService.getExpenseByIdForRequester(req.params.id, req.user!.id);
  return success(res, expense.history || [], 'Expense history fetched');
});

router.put('/:id', async (req, res) => {
  const body = updateExpenseSchema.parse(req.body);
  const expense = await expenseService.updateExpense(req.params.id, body, req.user!.id);
  return success(res, expense, 'Expense updated');
});

router.delete('/:id', async (req, res) => {
  await expenseService.deleteExpense(req.params.id, req.user!.id);
  return success(res, null, 'Expense deleted');
});

export default router;
