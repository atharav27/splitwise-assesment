import { useMemo, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';

export const ParticipantSelector = ({ users = [], selectedIds = [], onChange, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return users;
    return users.filter((user) =>
      `${user.name || ''} ${user.email || ''}`.toLowerCase().includes(term)
    );
  }, [search, users]);

  const toggle = (id) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((value) => value !== id));
    else onChange([...selectedIds, id]);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between" disabled={disabled}>
            Add participant
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[340px] p-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2 h-9 w-full rounded-md border bg-background px-3 text-sm"
            placeholder="Search users..."
          />
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {filtered.map((user) => (
              <button
                key={user._id}
                type="button"
                onClick={() => toggle(user._id)}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <span>{user.name || user.email}</span>
                {selectedIds.includes(user._id) ? <Check className="h-4 w-4" /> : null}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <div className="flex flex-wrap gap-2">
        {selectedIds.map((id) => {
          const user = users.find((item) => item._id === id);
          return (
            <Badge key={id} variant="outline" className="gap-1">
              {user?.name || user?.email || id}
              <button type="button" onClick={() => toggle(id)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

