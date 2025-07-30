import { useEffect } from 'react';
import { TodoLayoutRQ } from '../components/layout/todo-layout-rq';
import { useAppStoreRQ } from '../store/app-store-rq';
import { TimeTracker } from '../components/time-tracking/time-tracker';

export function TimeTrackingPage() {
  const { setView, setCurrentListId } = useAppStoreRQ();

  useEffect(() => {
    setView('tasks');
    setCurrentListId(null);
  }, [setView, setCurrentListId]);

  return (
    <TodoLayoutRQ>
      <TimeTracker />
    </TodoLayoutRQ>
  );
}