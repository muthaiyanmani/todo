import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { TodoLayoutRQ } from '../components/layout/todo-layout-rq';
import { useAppStoreRQ } from '../store/app-store-rq';
import { useTaskLists } from '../hooks/use-task-lists';

export function CustomList() {
  const { listId } = useParams<{ listId: string }>();
  const { setView, setCurrentListId } = useAppStoreRQ();
  const { data: taskLists = [], isLoading } = useTaskLists();

  useEffect(() => {
    if (listId) {
      setView('list');
      setCurrentListId(listId);
    }
  }, [listId, setView, setCurrentListId]);

  // Show loading while fetching lists
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Check if list exists
  const listExists = taskLists.some(list => list.id === listId);

  if (!listId || !listExists) {
    return <Navigate to="/dashboard/my-day" replace />;
  }

  return <TodoLayoutRQ />;
}
