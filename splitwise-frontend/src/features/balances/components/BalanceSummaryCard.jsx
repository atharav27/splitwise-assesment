import { AmountDisplay, UserAvatar } from '../../../components/shared';
import { Button } from '../../../components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../components/ui/accordion';
import { formatCurrency } from '../../../lib/utils';

export const BalanceSummaryCard = ({ entry, onSettleClick, groupNamesById = {} }) => {
  const isOwe = entry.direction === 'owe';
  const breakdown = entry.breakdown || [];
  const scopeKeys = [
    ...new Set(breakdown.map((b) => (b.groupId == null ? '__personal__' : String(b.groupId)))),
  ];

  let scopeTag = '';
  if (scopeKeys.length === 1 && scopeKeys[0] === '__personal__') scopeTag = 'Personal';
  else if (scopeKeys.length === 1) scopeTag = groupNamesById[scopeKeys[0]] || 'Group';
  else if (scopeKeys.length > 1) scopeTag = 'Multiple scopes';

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar user={{ name: entry.name, avatar: entry.avatar }} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{entry.name}</p>
            <p className="truncate text-xs text-muted-foreground">{entry.email || ''}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{isOwe ? 'You owe' : 'Owes you'}</p>
          <AmountDisplay amount={entry.amount || 0} direction={entry.direction} size="md" />
        </div>
      </div>

      {scopeTag ? (
        <p className="mt-2 text-xs font-medium text-muted-foreground">{scopeTag}</p>
      ) : null}

      {breakdown.length > 0 ? (
        <Accordion type="single" collapsible className="mt-2 w-full">
          <AccordionItem value="breakdown" className="border-0">
            <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:no-underline">
              By scope
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 text-sm">
                {breakdown.map((line, i) => (
                  <li
                    key={`${line.groupId ?? 'personal'}-${i}`}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-muted-foreground">
                      {line.groupId == null
                        ? 'Personal'
                        : groupNamesById[line.groupId] || 'Group'}
                    </span>
                    <span>
                      {line.direction === 'owe' ? 'You owe' : 'Owes you'}{' '}
                      {formatCurrency(line.amount, 'INR')}
                    </span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}

      {isOwe ? (
        <div className="mt-3">
          <Button type="button" size="sm" onClick={() => onSettleClick(entry)}>
            Settle Up
          </Button>
        </div>
      ) : null}
    </div>
  );
};
