import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  useInfiniteQuery 
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { gtdApi, type ProductivityQueryParams, type GtdItemsResponse } from '../../services/api/productivity.api';
import type { GtdItem, GtdProject } from '../../types/productivity.types';

// Query Keys
export const gtdKeys = {
  all: ['gtd'] as const,
  items: () => [...gtdKeys.all, 'items'] as const,
  itemsList: (params: ProductivityQueryParams) => [...gtdKeys.items(), params] as const,
  item: (id: string) => [...gtdKeys.items(), id] as const,
  inbox: () => [...gtdKeys.all, 'inbox'] as const,
  nextActions: () => [...gtdKeys.all, 'next-actions'] as const,
  waitingFor: () => [...gtdKeys.all, 'waiting-for'] as const,
  somedayMaybe: () => [...gtdKeys.all, 'someday-maybe'] as const,
  projects: () => [...gtdKeys.all, 'projects'] as const,
  project: (id: string) => [...gtdKeys.projects(), id] as const,
} as const;

// Hooks for fetching GTD items
export function useGtdItems(params: ProductivityQueryParams = {}) {
  return useQuery({
    queryKey: gtdKeys.itemsList(params),
    queryFn: () => gtdApi.getItems(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

export function useInfiniteGtdItems(params: ProductivityQueryParams = {}) {
  return useInfiniteQuery({
    queryKey: gtdKeys.itemsList(params),
    queryFn: ({ pageParam }) => gtdApi.getItems({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: GtdItemsResponse) => lastPage.nextCursor,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useGtdItem(id: string, enabled = true) {
  return useQuery({
    queryKey: gtdKeys.item(id),
    queryFn: () => gtdApi.getItem(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Specialized hooks for different GTD contexts
export function useInboxItems() {
  return useQuery({
    queryKey: gtdKeys.inbox(),
    queryFn: () => gtdApi.getInboxItems(),
    staleTime: 1 * 60 * 1000, // 1 minute - inbox changes frequently
    refetchOnWindowFocus: true,
  });
}

export function useNextActions() {
  return useQuery({
    queryKey: gtdKeys.nextActions(),
    queryFn: () => gtdApi.getNextActions(),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useWaitingForItems() {
  return useQuery({
    queryKey: gtdKeys.waitingFor(),
    queryFn: () => gtdApi.getWaitingFor(),
    staleTime: 5 * 60 * 1000, // 5 minutes - waiting items don't change often
    refetchOnWindowFocus: false,
  });
}

export function useSomedayMaybeItems() {
  return useQuery({
    queryKey: gtdKeys.somedayMaybe(),
    queryFn: () => gtdApi.getSomedayMaybe(),
    staleTime: 10 * 60 * 1000, // 10 minutes - someday/maybe items rarely change
    refetchOnWindowFocus: false,
  });
}

export function useGtdProjects() {
  return useQuery({
    queryKey: gtdKeys.projects(),
    queryFn: () => gtdApi.getProjects(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Mutation hooks for GTD items
export function useCreateGtdItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemData: Omit<GtdItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => 
      gtdApi.createItem(itemData),
    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: gtdKeys.items() });

      // Snapshot the previous value
      const previousItems = queryClient.getQueriesData({ queryKey: gtdKeys.items() });

      // Optimistically update the cache
      queryClient.setQueriesData(
        { queryKey: gtdKeys.items() },
        (old: GtdItemsResponse | undefined) => {
          if (!old) return old;
          
          const optimisticItem: GtdItem = {
            id: `temp-${Date.now()}`,
            userId: 'temp-user',
            status: 'active',
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...newItem,
          };

          return {
            ...old,
            items: [optimisticItem, ...old.items],
            total: old.total + 1,
          };
        }
      );

      return { previousItems };
    },
    onError: (_error, _newItem, context) => {
      // Revert optimistic update
      if (context?.previousItems) {
        context.previousItems.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to create GTD item');
    },
    onSuccess: (data) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: gtdKeys.items() });
      
      // Invalidate specific context queries based on item type
      switch (data.type) {
        case 'inbox':
          queryClient.invalidateQueries({ queryKey: gtdKeys.inbox() });
          break;
        case 'next-action':
          queryClient.invalidateQueries({ queryKey: gtdKeys.nextActions() });
          break;
        case 'waiting-for':
          queryClient.invalidateQueries({ queryKey: gtdKeys.waitingFor() });
          break;
        case 'someday-maybe':
          queryClient.invalidateQueries({ queryKey: gtdKeys.somedayMaybe() });
          break;
      }
      
      toast.success(`${data.type.replace('-', ' ')} item created: "${data.title}"`);
    },
  });
}

export function useUpdateGtdItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<GtdItem> }) => 
      gtdApi.updateItem(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: gtdKeys.item(id) });
      await queryClient.cancelQueries({ queryKey: gtdKeys.items() });

      // Snapshot the previous values
      const previousItem = queryClient.getQueryData(gtdKeys.item(id));
      const previousItems = queryClient.getQueriesData({ queryKey: gtdKeys.items() });

      // Optimistically update the single item
      queryClient.setQueryData(gtdKeys.item(id), (old: GtdItem | undefined) => 
        old ? { ...old, ...updates, updatedAt: new Date().toISOString() } : old
      );

      // Optimistically update items in lists
      queryClient.setQueriesData(
        { queryKey: gtdKeys.items() },
        (old: GtdItemsResponse | undefined) => {
          if (!old) return old;
          
          return {
            ...old,
            items: old.items.map(item => 
              item.id === id 
                ? { ...item, ...updates, updatedAt: new Date().toISOString() }
                : item
            ),
          };
        }
      );

      return { previousItem, previousItems };
    },
    onError: (_error, { id }, context) => {
      // Revert optimistic updates
      if (context?.previousItem) {
        queryClient.setQueryData(gtdKeys.item(id), context.previousItem);
      }
      if (context?.previousItems) {
        context.previousItems.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to update GTD item');
    },
    onSuccess: (data, { id }) => {
      // Update caches with server response
      queryClient.setQueryData(gtdKeys.item(id), data);
      queryClient.invalidateQueries({ queryKey: gtdKeys.items() });
      
      // Invalidate context-specific queries
      queryClient.invalidateQueries({ queryKey: gtdKeys.inbox() });
      queryClient.invalidateQueries({ queryKey: gtdKeys.nextActions() });
      queryClient.invalidateQueries({ queryKey: gtdKeys.waitingFor() });
      queryClient.invalidateQueries({ queryKey: gtdKeys.somedayMaybe() });
      
      toast.success(`GTD item updated: "${data.title}"`);
    },
  });
}

export function useDeleteGtdItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gtdApi.deleteItem(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: gtdKeys.items() });

      // Get item info for toast
      const item = queryClient.getQueryData(gtdKeys.item(id)) as GtdItem | undefined;
      const itemTitle = item?.title || 'Item';

      // Snapshot the previous values
      const previousItems = queryClient.getQueriesData({ queryKey: gtdKeys.items() });

      // Optimistically remove from lists
      queryClient.setQueriesData(
        { queryKey: gtdKeys.items() },
        (old: GtdItemsResponse | undefined) => {
          if (!old) return old;
          
          return {
            ...old,
            items: old.items.filter(item => item.id !== id),
            total: Math.max(0, old.total - 1),
          };
        }
      );

      // Remove from individual query cache
      queryClient.removeQueries({ queryKey: gtdKeys.item(id) });

      return { previousItems, itemTitle };
    },
    onError: (_error, _id, context) => {
      // Revert optimistic updates
      if (context?.previousItems) {
        context.previousItems.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to delete GTD item');
    },
    onSuccess: (_data, _id, context) => {
      queryClient.invalidateQueries({ queryKey: gtdKeys.items() });
      queryClient.invalidateQueries({ queryKey: gtdKeys.inbox() });
      queryClient.invalidateQueries({ queryKey: gtdKeys.nextActions() });
      queryClient.invalidateQueries({ queryKey: gtdKeys.waitingFor() });
      queryClient.invalidateQueries({ queryKey: gtdKeys.somedayMaybe() });
      
      toast.success(`"${context?.itemTitle}" deleted successfully`);
    },
  });
}

// Convenience hooks for common GTD operations
export function useProcessInboxItem() {
  const updateItem = useUpdateGtdItem();
  
  return useMutation({
    mutationFn: ({ id, newType, updates = {} }: { 
      id: string; 
      newType: GtdItem['type']; 
      updates?: Partial<GtdItem> 
    }) => gtdApi.processInboxItem(id, newType, updates),
    onSuccess: (data) => {
      toast.success(`Item moved to ${data.type.replace('-', ' ')}: "${data.title}"`);
    },
    onError: () => {
      toast.error('Failed to process inbox item');
    },
  });
}

export function useCompleteGtdItem() {
  const updateItem = useUpdateGtdItem();
  
  return useMutation({
    mutationFn: (id: string) => gtdApi.completeItem(id),
    onSuccess: (data) => {
      toast.success(`Completed: "${data.title}"`);
    },
    onError: () => {
      toast.error('Failed to complete GTD item');
    },
  });
}

export function useAddToInbox() {
  const createItem = useCreateGtdItem();
  
  return useMutation({
    mutationFn: ({ title, description, energy = 'medium' }: { 
      title: string; 
      description?: string; 
      energy?: GtdItem['energy'] 
    }) => gtdApi.createItem({
      title,
      description,
      type: 'inbox',
      energy,
      status: 'active',
      tags: [],
    }),
    onSuccess: (data) => {
      toast.success(`Added to inbox: "${data.title}"`);
    },
    onError: () => {
      toast.error('Failed to add item to inbox');
    },
  });
}

export function useCreateNextAction() {
  const createItem = useCreateGtdItem();
  
  return useMutation({
    mutationFn: ({ 
      title, 
      description, 
      context, 
      energy = 'medium', 
      timeRequired, 
      projectId 
    }: { 
      title: string; 
      description?: string; 
      context?: string; 
      energy?: GtdItem['energy']; 
      timeRequired?: number; 
      projectId?: string 
    }) => gtdApi.createItem({
      title,
      description,
      type: 'next-action',
      context,
      energy,
      timeRequired,
      projectId,
      status: 'active',
      tags: [],
    }),
    onSuccess: (data) => {
      toast.success(`Next action created: "${data.title}"`);
    },
    onError: () => {
      toast.error('Failed to create next action');
    },
  });
}