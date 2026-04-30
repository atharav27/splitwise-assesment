import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { AmountDisplay, AppShell, EmptyState, PageHeader } from '../../../components/shared';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../components/ui/accordion';
import { Card, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { useAuth } from '../../../context/AuthContext';
import { balancesAPI, groupsAPI } from '../../../services/api';
import { BalanceSummaryCard } from '../components/BalanceSummaryCard';
import { SettleUpDialog } from '../components/SettleUpDialog';

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.docs)) return value.docs;
  if (Array.isArray(value?.balances)) return value.balances;
  return [];
};

const BalancesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEntry, setSelectedEntry] = useState(null);

  const globalQuery = useQuery({
    queryKey: ['balances', 'global'],
    queryFn: () => balancesAPI.getGlobal().then((res) => toArray(res.data?.data)),
  });

  const groupsQuery = useQuery({
    queryKey: ['groups', 'all'],
    queryFn: () => groupsAPI.getAll().then((res) => toArray(res.data?.data)),
  });

  const groupBalancesQuery = useQuery({
    queryKey: ['balances', 'grouped', (groupsQuery.data || []).map((g) => g._id).join(',')],
    enabled: Boolean(groupsQuery.data?.length),
    queryFn: async () => {
      const pairs = await Promise.all((groupsQuery.data || []).map(async (group) => {
        const data = await balancesAPI.getByGroup(group._id).then((res) => toArray(res.data?.data));
        return { group, balances: data };
      }));
      return pairs;
    },
  });

  const balances = useMemo(() => globalQuery.data || [], [globalQuery.data]);

  const { totalOwed, totalOwe, net } = useMemo(() => {
    const owed = balances
      .filter((entry) => entry.direction === 'owed')
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const owe = balances
      .filter((entry) => entry.direction === 'owe')
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    return { totalOwed: owed, totalOwe: owe, net: owed - owe };
  }, [balances]);

  const allSettled = totalOwed === 0 && totalOwe === 0;

  const refreshBalances = async () => {
    await queryClient.invalidateQueries({ queryKey: ['balances', 'global'] });
    await queryClient.invalidateQueries({ queryKey: ['balances', 'grouped'] });
    await queryClient.invalidateQueries({ queryKey: ['activity'] });
  };

  return (
    <AppShell>
      <PageHeader title="Balances" />

      <Card className="mb-6">
        <CardContent className="p-5 space-y-2">
          <p className="text-sm text-muted-foreground">Your overall balance</p>
          <div className="flex items-center justify-between">
            <span className="text-sm">You are owed</span>
            <AmountDisplay amount={totalOwed} direction="owed" size="md" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">You owe</span>
            <AmountDisplay amount={totalOwe} direction="owe" size="md" />
          </div>
          <div className="border-t pt-2 mt-2 flex items-center justify-between">
            <span className="text-sm font-semibold">Net</span>
            <AmountDisplay
              amount={Math.abs(net)}
              direction={net > 0 ? 'owed' : net < 0 ? 'owe' : 'neutral'}
              size="lg"
            />
          </div>
          {allSettled ? <p className="text-xs text-emerald-600">All settled up</p> : null}
        </CardContent>
      </Card>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Balances</TabsTrigger>
          <TabsTrigger value="group">By Group</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {globalQuery.isError ? (
            <div className="text-sm text-muted-foreground">
              Something went wrong.{' '}
              <button type="button" onClick={() => globalQuery.refetch()} className="underline">
                Try again
              </button>
            </div>
          ) : globalQuery.isLoading ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : balances.length === 0 ? (
            <EmptyState
              icon="🎉"
              title="All settled up"
              description="No outstanding balances right now."
            />
          ) : (
            balances.map((entry, idx) => (
              <BalanceSummaryCard
                key={`${entry.userId || entry._id || idx}-${entry.direction}`}
                entry={entry}
                onSettleClick={setSelectedEntry}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="group">
          {groupBalancesQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {(groupBalancesQuery.data || []).map(({ group, balances: groupBalances }) => (
                <AccordionItem key={group._id} value={group._id}>
                  <AccordionTrigger>{group.name}</AccordionTrigger>
                  <AccordionContent>
                    {groupBalances.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No outstanding balances</p>
                    ) : (
                      <div className="space-y-2">
                        {groupBalances.map((entry, idx) => (
                          <div key={`${group._id}-${entry.userId || idx}`} className="flex items-center justify-between text-sm">
                            <span>{entry.name}</span>
                            <AmountDisplay
                              amount={entry.amount || 0}
                              direction={entry.direction}
                              size="sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>
      </Tabs>

      <SettleUpDialog
        open={Boolean(selectedEntry)}
        onOpenChange={(next) => {
          if (!next) setSelectedEntry(null);
        }}
        entry={selectedEntry}
        currentUserId={user?._id}
        onSuccess={refreshBalances}
      />
    </AppShell>
  );
};

export default BalancesPage;
