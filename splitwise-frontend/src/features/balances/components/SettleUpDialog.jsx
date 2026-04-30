import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { showErrorToast, showSuccessToast } from '../../../lib/toast';
import { settlementsAPI } from '../../../services/api';
import { formatCurrency } from '../../../lib/utils';

export const SettleUpDialog = ({ open, onOpenChange, entry, currentUserId, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const outstanding = Number(entry?.amount || 0);

  useEffect(() => {
    if (open && entry) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount(outstanding.toFixed(2));
      setNote('');
      setError('');
    }
  }, [open, entry, outstanding]);

  const onSubmit = async () => {
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (parsed > outstanding) {
      setError('Amount cannot exceed outstanding');
      return;
    }
    if (!currentUserId || !entry?.userId || currentUserId === entry.userId) {
      setError('Invalid users for settlement');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await settlementsAPI.pay({
        fromUser: currentUserId,
        toUser: entry.userId,
        amount: parsed,
        groupId: entry.groupId || null,
        note: note || '',
      });
      showSuccessToast(`Payment of ${formatCurrency(parsed, 'INR')} recorded`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to record payment');
      showErrorToast(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settle up with {entry?.name || 'user'}</DialogTitle>
          <DialogDescription>
            Outstanding: {formatCurrency(outstanding, 'INR')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settle-amount">Amount</Label>
            <Input
              id="settle-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => setAmount(outstanding.toFixed(2))}>
              Pay full amount {formatCurrency(outstanding, 'INR')}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="settle-note">Note (optional)</Label>
            <Input
              id="settle-note"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. GPay payment"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={loading}>
            {loading ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

