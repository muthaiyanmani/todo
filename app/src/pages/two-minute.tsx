import { useEffect } from 'react';
import { TodoLayoutRQ } from '../components/layout/todo-layout-rq';
import { useAppStoreRQ } from '../store/app-store-rq';
import { TwoMinuteRule } from '../components/two-minute-rule/two-minute-rule';

export function TwoMinutePage() {
  const { setView, setCurrentListId } = useAppStoreRQ();

  useEffect(() => {
    setView('tasks');
    setCurrentListId(null);
  }, [setView, setCurrentListId]);

  return (
    <TodoLayoutRQ>
      <TwoMinuteRule />
    </TodoLayoutRQ>
  );
}