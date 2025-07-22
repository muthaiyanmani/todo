import { useEffect } from 'react';
import { useAppStore } from '../store/app-store';
import { TodoLayout } from '../components/layout/todo-layout';

export function Dashboard() {
  const { loadTasks, loadTaskLists } = useAppStore();

  useEffect(() => {
    loadTasks();
    loadTaskLists();
  }, [loadTasks, loadTaskLists]);

  return <TodoLayout />;
}
