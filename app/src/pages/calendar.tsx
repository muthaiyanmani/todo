import { useEffect } from 'react';
import { TodoLayoutRQ } from '../components/layout/todo-layout-rq';
import { useAppStoreRQ } from '../store/app-store-rq';

export function Calendar() {
  const { setView, setCurrentListId } = useAppStoreRQ();

  useEffect(() => {
    setView('calendar');
    setCurrentListId(null);
  }, [setView, setCurrentListId]);

  return <TodoLayoutRQ />;
}
