import { useNavigate } from 'react-router-dom';
import { UserAvatarGroup } from '../../../components/shared';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { formatDate } from '../../../lib/utils';

export const GroupCard = ({ group, variant = 'compact' }) => {
  const navigate = useNavigate();
  const members = group.members || [];
  const createdText = group.createdAt ? formatDate(group.createdAt) : '';

  if (variant === 'full') {
    return (
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold truncate">{group.name}</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {group.currency || 'INR'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <UserAvatarGroup users={members} max={4} size="sm" />
            <span className="text-xs text-muted-foreground">{members.length} members</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Created {group.createdBy?._id ? 'by you' : ''} {createdText ? `· ${createdText}` : ''}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/groups/${group._id}`)}
            >
              Open →
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/groups/${group._id}`)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm truncate">{group.name}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {group.currency || 'INR'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <UserAvatarGroup users={members} max={3} size="sm" />
          <span className="text-xs text-muted-foreground">{members.length} members</span>
        </div>
      </CardContent>
    </Card>
  );
};
