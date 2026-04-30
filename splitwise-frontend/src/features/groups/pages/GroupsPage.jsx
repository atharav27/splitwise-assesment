import { useNavigate } from 'react-router-dom';
import { AppShell, EmptyState, PageHeader, SkeletonList } from '../../../components/shared';
import { Button } from '../../../components/ui/button';
import { useGroupsListQuery } from '../../../hooks/useGroups';
import { GroupCard } from '../components/GroupCard';

const GroupsPage = () => {
  const navigate = useNavigate();
  const { data: groups = [], isLoading, isError, refetch } = useGroupsListQuery();

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
        <SkeletonList count={4} className="h-40 w-full" containerClassName="grid grid-cols-1 gap-4 md:grid-cols-2" />
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
