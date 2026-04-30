import { X } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog, UserAvatar } from '../../../components/shared';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';

export const MemberChip = ({ member, isAdmin, canRemove, onRemove, loading = false }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar user={member} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{member.name}</p>
          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isAdmin ? <Badge variant="secondary">Admin</Badge> : null}
        {canRemove ? (
          <>
            <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(true)}>
              <X className="h-4 w-4" />
            </Button>
            <ConfirmDialog
              open={open}
              onOpenChange={setOpen}
              title="Remove member"
              description={`Remove ${member.name} from this group?`}
              onConfirm={onRemove}
              loading={loading}
            />
          </>
        ) : null}
      </div>
    </div>
  );
};

