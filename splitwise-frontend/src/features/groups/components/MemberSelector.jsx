import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronDown, X } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { usersAPI } from '../../../services/api';

export const MemberSelector = ({ selectedIds = [], onChange, creatorId, creatorLabel = 'You', disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => usersAPI.getAll().then((res) => res.data?.data || []),
  });

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return users;
    return users.filter((user) => {
      const name = (user.name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [search, users]);

  const toggleMember = (userId) => {
    if (!onChange || userId === creatorId) return;
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            Search members...
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[340px] p-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="mb-2 h-9 w-full rounded-md border bg-background px-3 text-sm"
          />
          <div className="max-h-56 overflow-y-auto space-y-1">
            {filteredUsers.map((user) => {
              const isSelected = selectedIds.includes(user._id);
              const isCreator = user._id === creatorId;
              return (
                <button
                  key={user._id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => toggleMember(user._id)}
                  disabled={isCreator}
                >
                  <span className="truncate">{user.name} <span className="text-muted-foreground">({user.email})</span></span>
                  {isSelected || isCreator ? <Check className="h-4 w-4" /> : null}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="gap-1">
          {creatorLabel} ✓
        </Badge>
        {selectedIds
          .filter((id) => id !== creatorId)
          .map((id) => {
            const user = users.find((u) => u._id === id);
            if (!user) return null;
            return (
              <Badge key={id} variant="outline" className="gap-1">
                {user.name}
                <button
                  type="button"
                  onClick={() => toggleMember(id)}
                  className="rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
      </div>
    </div>
  );
};

