import { useEffect } from 'react';
import { TodoLayoutRQ } from '../components/layout/todo-layout-rq';
import { useAppStoreRQ } from '../store/app-store-rq';
import { PomodoroTimer } from '../components/pomodoro/pomodoro-timer';

export function PomodoroPage() {
  const { setView, setCurrentListId } = useAppStoreRQ();

  useEffect(() => {
    setView('tasks'); // Use tasks view as base
    setCurrentListId(null);
  }, [setView, setCurrentListId]);

  return (
    <TodoLayoutRQ>
      <PomodoroTimer />
    </TodoLayoutRQ>
  );
}