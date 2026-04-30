import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { showErrorToast } from '../../../lib/toast';
import { AppShell, EmptyState, PageHeader } from '../../../components/shared';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Skeleton } from '../../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { groupsAPI, settlementsAPI } from '../../../services/api';
import { SettleUpDialog } from '../../balances/components/SettleUpDialog';
import { OptimizedPlanCard } from '../components/OptimizedPlanCard';
import { SettlementCard } from '../components/SettlementCard';

const toListWithCursor = (payload) => {
  const items = Array.isArray(payload) ? payload : payload?.items || payload?.docs || payload?.settlements || [];
  const nextCursor = payload?.nextCursor ?? null;
  return { items, nextCursor };
};

const SettlementsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [tab, setTab] = useState('mine');
  const [groupId, setGroupId] = useState('all');
  const [mineCursor, setMineCursor] = useState(null);
  const [groupCursor, setGroupCursor] = useState(null);
  const [mineItems, setMineItems] = useState([]);
  const [groupItems, setGroupItems] = useState([]);
  const [mineNextCursor, setMineNextCursor] = useState(null);
  const [groupNextCursor, setGroupNextCursor] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const groupsQuery = useQuery({
    queryKey: ['groups', 'all'],
    queryFn: () => groupsAPI.getAll().then((res) => res.data?.data || []),
  });

  const mineQuery = useQuery({
    queryKey: ['settlements', 'all', mineCursor],
    queryFn: () => settlementsAPI.getAll({ cursor: mineCursor }).then((res) => toListWithCursor(res.data?.data)),
  });

  const groupHistoryQuery = useQuery({
    queryKey: ['settlements', 'group', groupId, groupCursor],
    enabled: groupId !== 'all',
    retry: false,
    queryFn: () => settlementsAPI.getByGroup(groupId, { cursor: groupCursor }).then((res) => toListWithCursor(res.data?.data)),
  });

  const optimizedQuery = useQuery({
    queryKey: ['settlements', 'optimized', groupId],
    enabled: groupId !== 'all',
    retry: false,
    queryFn: () => settlementsAPI.getOptimized(groupId).then((res) => res.data?.data || []),
  });

  useEffect(() => {
    if (!mineQuery.data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!mineCursor) setMineItems(mineQuery.data.items);
    else setMineItems((prev) => [...prev, ...mineQuery.data.items]);
    setMineNextCursor(mineQuery.data.nextCursor);
  }, [mineQuery.data, mineCursor]);

  useEffect(() => {
    if (!groupHistoryQuery.data || groupId === 'all') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!groupCursor) setGroupItems(groupHistoryQuery.data.items);
    else setGroupItems((prev) => [...prev, ...groupHistoryQuery.data.items]);
    setGroupNextCursor(groupHistoryQuery.data.nextCursor);
  }, [groupHistoryQuery.data, groupCursor, groupId]);

  useEffect(() => {
    if (!groupHistoryQuery.isError) return;
    showErrorToast(groupHistoryQuery.error);
  }, [groupHistoryQuery.isError, groupHistoryQuery.error]);

  useEffect(() => {
    if (!optimizedQuery.isError) return;
    showErrorToast(optimizedQuery.error);
  }, [optimizedQuery.isError, optimizedQuery.error]);

  const optimizedList = useMemo(() => {
    if (Array.isArray(optimizedQuery.data)) return optimizedQuery.data;
    if (Array.isArray(optimizedQuery.data?.data)) return optimizedQuery.data.data;
    if (Array.isArray(optimizedQuery.data?.transactions)) return optimizedQuery.data.transactions;
    return [];
  }, [optimizedQuery.data]);

  const selectedPaymentEntry = useMemo(() => {
    const tx = optimizedList[0];
    if (!tx) return null;

    const txFromId = tx.fromUser?._id || tx.fromUser?.id || tx.fromUser;
    const txToId = tx.toUser?._id || tx.toUser?.id || tx.toUser;
    const txFromName = tx.fromUser?.name || tx.from || 'user';
    const txToName = tx.toUser?.name || tx.to || 'user';
    const currentUserId = user?._id || user?.id;

    if (!currentUserId) return null;
    if (txFromId === currentUserId) {
      return { userId: txToId, name: txToName, amount: Number(tx.amount || 0), groupId };
    }
    if (txToId === currentUserId) {
      return { userId: txFromId, name: txFromName, amount: Number(tx.amount || 0), groupId };
    }
    return null;
  }, [optimizedList, user, groupId]);

  const refreshAfterPayment = () => {
    mineQuery.refetch();
    groupHistoryQuery.refetch();
    optimizedQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ['balances'] });
  };

  return (
    <AppShell>
      <PageHeader title="Settlements" subtitle="Track payments and optimize who should pay whom." />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="mine">My Payments</TabsTrigger>
          <TabsTrigger value="group">By Group</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="space-y-3">
          {mineQuery.isError ? (
            <div className="text-sm text-muted-foreground">
              Something went wrong.{' '}
              <button type="button" onClick={() => mineQuery.refetch()} className="underline">
                Try again
              </button>
            </div>
          ) : mineQuery.isLoading ? (
            <>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          ) : mineItems.length === 0 ? (
            <EmptyState icon="💸" title="No settlements yet" description="Your payment history will appear here." />
          ) : (
            <>
              {mineItems.map((item, idx) => (
                <SettlementCard key={item._id || item.id || idx} settlement={item} currentUserId={user?._id || user?.id} />
              ))}
              {mineNextCursor ? (
                <Button variant="outline" className="w-full" onClick={() => setMineCursor(mineNextCursor)}>
                  Load More
                </Button>
              ) : null}
            </>
          )}
        </TabsContent>

        <TabsContent value="group" className="space-y-4">
          <Select
            value={groupId}
            onValueChange={(value) => {
              setGroupId(value);
              setGroupCursor(null);
              setGroupItems([]);
              setGroupNextCursor(null);
            }}
          >
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Select a group</SelectItem>
              {(groupsQuery.data || []).map((group) => (
                <SelectItem key={group._id} value={group._id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {groupId === 'all' ? (
            <EmptyState icon="👥" title="Select a group" description="Choose a group to view settlements and plan." />
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Group History</h3>
                {groupHistoryQuery.isError ? (
                  <div className="text-sm text-muted-foreground">
                    Something went wrong.{' '}
                    <button type="button" onClick={() => groupHistoryQuery.refetch()} className="underline">
                      Try again
                    </button>
                  </div>
                ) : groupHistoryQuery.isLoading ? (
                  <>
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </>
                ) : groupItems.length === 0 ? (
                  <EmptyState icon="🧾" title="No settlements in this group" description="Payments recorded for this group will appear here." />
                ) : (
                  <>
                    {groupItems.map((item, idx) => (
                      <SettlementCard key={item._id || item.id || idx} settlement={item} currentUserId={user?._id || user?.id} />
                    ))}
                    {groupNextCursor ? (
                      <Button variant="outline" className="w-full" onClick={() => setGroupCursor(groupNextCursor)}>
                        Load More
                      </Button>
                    ) : null}
                  </>
                )}
              </div>

              <OptimizedPlanCard
                data={optimizedQuery.data}
                isLoading={optimizedQuery.isLoading}
                selectedEntry={selectedPaymentEntry}
                onRecordPayment={() => setDialogOpen(true)}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      <SettleUpDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={selectedPaymentEntry}
        currentUserId={user?._id || user?.id}
        onSuccess={refreshAfterPayment}
      />
    </AppShell>
  );
};

export default SettlementsPage;
