import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AmountDisplay } from '../../../components/shared';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { settlementsAPI } from '../../../services/api';

export const OptimizedPlanCard = ({ groupId }) => {
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery({
    queryKey: ['settlements', 'optimized', groupId],
    queryFn: () => settlementsAPI.getOptimized(groupId).then((res) => res.data?.data || []),
    enabled: Boolean(groupId),
  });

  if (isLoading) return <Skeleton className="h-36 w-full" />;
  if (!data.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settle in {data.length} transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((item, idx) => (
          <div key={`${item.from}-${item.to}-${idx}`} className="flex items-center justify-between text-sm">
            <p>
              {item.from} → {item.to}
            </p>
            <AmountDisplay amount={item.amount || 0} direction="neutral" />
          </div>
        ))}
        <Button className="w-full" onClick={() => navigate(`/settlements?groupId=${groupId}`)}>
          Record a Payment
        </Button>
      </CardContent>
    </Card>
  );
};

