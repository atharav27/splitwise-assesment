import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AppShell, EmptyState, PageHeader } from '../../../components/shared';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { GroupCard } from '../components/GroupCard';
import { groupsAPI } from '../../../services/api';

const GroupsPage = () => {
  const navigate = useNavigate();
  const { data: groups = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsAPI.getAll().then((res) => res.data?.data || []),
  });

  return (
    <AppShell>
      <PageHeader
        title="Groups"
        subtitle="Manage your shared expense groups"
        action={<Button onClick={() => navigate('/groups/new')}>New Group</Button>}
      />

      {isError ? (
        <div className="text-sm text-muted-foreground">
          Something went wrong.{' '}
          <button type="button" onClick={() => refetch()} className="underline">
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No groups yet"
          description="Create a group to start splitting expenses"
          action={<Button onClick={() => navigate('/groups/new')}>Create your first group</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <GroupCard key={group._id} group={group} variant="full" />
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default GroupsPage;
