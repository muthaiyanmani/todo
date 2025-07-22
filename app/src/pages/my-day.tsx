import { useEffect } from 'react';
import { TodoLayoutRQ } from '../components/layout/todo-layout-rq';
import { useAppStoreRQ } from '../store/app-store-rq';

export function MyDay() {
  const { setView, setCurrentListId } = useAppStoreRQ();

  useEffect(() => {
    setView('my-day');
    setCurrentListId(null);
  }, [setView, setCurrentListId]);

  return <TodoLayoutRQ />;
}
