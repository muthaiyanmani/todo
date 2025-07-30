import { useEffect } from 'react';
import { TodoLayoutRQ } from '../components/layout/todo-layout-rq';
import { useAppStoreRQ } from '../store/app-store-rq';
import { GTDDashboard } from '../components/gtd/gtd-dashboard';

export function GTDPage() {
  const { setView, setCurrentListId } = useAppStoreRQ();

  useEffect(() => {
    setView('tasks');
    setCurrentListId(null);
  }, [setView, setCurrentListId]);

  return (
    <TodoLayoutRQ>
      <GTDDashboard />
    </TodoLayoutRQ>
  );
}