import { useEffect } from 'react';
import { TodoLayoutRQ } from '../components/layout/todo-layout-rq';
import { useAppStoreRQ } from '../store/app-store-rq';
import { EnergyManagement } from '../components/energy/energy-management';

export function EnergyPage() {
  const { setView, setCurrentListId } = useAppStoreRQ();

  useEffect(() => {
    setView('tasks');
    setCurrentListId(null);
  }, [setView, setCurrentListId]);

  return (
    <TodoLayoutRQ>
      <EnergyManagement />
    </TodoLayoutRQ>
  );
}