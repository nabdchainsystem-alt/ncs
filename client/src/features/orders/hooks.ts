import { useQuery } from '@tanstack/react-query';

import { fetchOrders } from './facade';

const ordersKeys = {
  list: ['orders', 'list'] as const,
};

export function useOrders() {
  const query = useQuery({
    queryKey: ordersKeys.list,
    queryFn: fetchOrders,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
