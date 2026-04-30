import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AppShell, EmptyState, PageHeader } from '../../../components/shared';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { activityAPI, groupsAPI } from '../../../services/api';
import { showErrorToast } from '../../../lib/toast';
import { ActivityItem } from '../components/ActivityItem';
import { ActivityItemSkeleton } from '../components/ActivityItemSkeleton';

const toListWithCursor = (payload) => {
  const items = Array.isArray(payload) ? payload : payload?.items || payload?.docs || payload?.activities || [];
  const nextCursor = payload?.nextCursor ?? null;
  return { items, nextCursor };
};

const ActivityPage = () => {
  const [tab, setTab] = useState('mine');
  const [groupId, setGroupId] = useState('all');
  const [mineCursor, setMineCursor] = useState(null);
  const [groupCursor, setGroupCursor] = useState(null);
  const [mineItems, setMineItems] = useState([]);
  const [groupItems, setGroupItems] = useState([]);
  const [mineNextCursor, setMineNextCursor] = useState(null);
  const [groupNextCursor, setGroupNextCursor] = useState(null);

  const groupsQuery = useQuery({
    queryKey: ['groups', 'all'],
    queryFn: () => groupsAPI.getAll().then((res) => res.data?.data || []),
  });

  const mineQuery = useQuery({
    queryKey: ['activity', 'mine', mineCursor],
    queryFn: () => activityAPI.getMine({ cursor: mineCursor }).then((res) => toListWithCursor(res.data?.data)),
  });

  const groupQuery = useQuery({
    queryKey: ['activity', 'group', groupId, groupCursor],
    enabled: groupId !== 'all',
    queryFn: () => activityAPI.getByGroup(groupId, { cursor: groupCursor }).then((res) => toListWithCursor(res.data?.data)),
    retry: false,
  });

  useEffect(() => {
    if (!mineQuery.data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!mineCursor) setMineItems(mineQuery.data.items);
    else setMineItems((prev) => [...prev, ...mineQuery.data.items]);
    setMineNextCursor(mineQuery.data.nextCursor);
  }, [mineQuery.data, mineCursor]);

  useEffect(() => {
    if (!groupQuery.data || groupId === 'all') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!groupCursor) setGroupItems(groupQuery.data.items);
    else setGroupItems((prev) => [...prev, ...groupQuery.data.items]);
    setGroupNextCursor(groupQuery.data.nextCursor);
  }, [groupQuery.data, groupCursor, groupId]);

  if (groupQuery.isError && groupQuery.error?.response?.status === 403) {
    showErrorToast(groupQuery.error);
  }

  const displayedItems = tab === 'mine' ? mineItems : groupItems;
  const loading = tab === 'mine' ? mineQuery.isLoading : groupQuery.isLoading;
  const nextCursor = tab === 'mine' ? mineNextCursor : groupNextCursor;

  return (
    <AppShell>
      <PageHeader title="Activity" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="mine">My Activity</TabsTrigger>
          <TabsTrigger value="group">Group Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="space-y-3">
          {mineQuery.isError ? (
            <div className="text-sm text-muted-foreground">
              Something went wrong.{' '}
              <button type="button" onClick={() => mineQuery.refetch()} className="underline">
                Try again
              </button>
            </div>
          ) : loading ? (
            <>
              <ActivityItemSkeleton />
              <ActivityItemSkeleton />
              <ActivityItemSkeleton />
            </>
          ) : displayedItems.length === 0 ? (
            <EmptyState icon="📜" title="No activity yet" description="Your actions will appear here." />
          ) : (
            <>
              <div>
                {displayedItems.map((item, idx) => (
                  <ActivityItem key={item._id || item.id || idx} item={item} isLast={idx === displayedItems.length - 1} />
                ))}
              </div>
              {nextCursor ? (
                <Button variant="outline" className="w-full" onClick={() => setMineCursor(nextCursor)}>
                  Load More
                </Button>
              ) : null}
            </>
          )}
        </TabsContent>

        <TabsContent value="group" className="space-y-3">
          <Select
            value={groupId}
            onValueChange={(value) => {
              setGroupId(value);
              setGroupCursor(null);
              setGroupItems([]);
              setGroupNextCursor(null);
            }}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Select a group</SelectItem>
              {(groupsQuery.data || []).map((group) => (
                <SelectItem key={group._id} value={group._id}>{group.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {groupId === 'all' ? (
            <EmptyState icon="👥" title="Select a group" description="Choose a group to view its activity." />
          ) : groupQuery.isError ? (
            <div className="text-sm text-muted-foreground">
              Something went wrong.{' '}
              <button type="button" onClick={() => groupQuery.refetch()} className="underline">
                Try again
              </button>
            </div>
          ) : loading ? (
            <>
              <ActivityItemSkeleton />
              <ActivityItemSkeleton />
            </>
          ) : displayedItems.length === 0 ? (
            <EmptyState icon="📜" title="No activity yet" description="No group activity available." />
          ) : (
            <>
              <div>
                {displayedItems.map((item, idx) => (
                  <ActivityItem key={item._id || item.id || idx} item={item} isLast={idx === displayedItems.length - 1} />
                ))}
              </div>
              {nextCursor ? (
                <Button variant="outline" className="w-full" onClick={() => setGroupCursor(nextCursor)}>
                  Load More
                </Button>
              ) : null}
            </>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

export default ActivityPage;
