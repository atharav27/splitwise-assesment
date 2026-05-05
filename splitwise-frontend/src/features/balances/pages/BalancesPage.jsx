import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { AmountDisplay, AppShell, EmptyState, PageHeader, SkeletonList } from '../../../components/shared';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../components/ui/accordion';
import { Card, CardContent } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { useAuth } from '../../../context/AuthContext';
import {
  useBalanceGroupsQuery,
  useGlobalBalancesQuery,
  useGroupedBalancesQuery,
} from '../../../hooks/usebalance';
import { BalanceSummaryCard } from '../components/BalanceSummaryCard';
import { SettleUpDialog } from '../components/SettleUpDialog';

const BalancesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEntry, setSelectedEntry] = useState(null);

  const globalQuery = useGlobalBalancesQuery();
  const groupsQuery = useBalanceGroupsQuery();
  const groupBalancesQuery = useGroupedBalancesQuery(groupsQuery.data || [], globalQuery.data || []);

  const balances = useMemo(() => globalQuery.data || [], [globalQuery.data]);

  const groupNamesById = useMemo(() => {
    const map = {};
    (groupsQuery.data || []).forEach((g) => {
      if (g?._id) map[g._id] = g.name || 'Group';
    });
    return map;
  }, [groupsQuery.data]);

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
            <SkeletonList count={2} className="h-24 w-full" />
          ) : balances.length === 0 ? (
            <EmptyState
              icon="🎉"
              title="All settled up"
              description="No outstanding balances right now."
            />
          ) : (
            balances.map((entry) => (
              <BalanceSummaryCard
                key={entry.userId || entry.user?._id || entry._id}
                entry={entry}
                groupNamesById={groupNamesById}
                onSettleClick={setSelectedEntry}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="group">
          <p className="mb-2 text-xs text-muted-foreground">
            Group view is a scope breakdown only. Settle payments from All Balances.
          </p>
          {groupBalancesQuery.isLoading ? (
            <SkeletonList count={2} className="h-12 w-full" />
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
