import { useTasks } from '../../hooks/use-tasks';
import { useAppStoreRQ } from '../../store/app-store-rq';
import { MyDayTabs, type MyDayView } from './my-day-tabs';
import { EisenhowerMatrix } from '../eisenhower/eisenhower-matrix';
import { MyDayTaskView } from './my-day-task-view';
import { AISuggestions } from '../ai/ai-suggestions';
import type { Task } from '../../types';

export function MyDayView() {
  const { data: tasks = [] } = useTasks();
  const { myDayActiveView, setMyDayActiveView } = useAppStoreRQ();
  const activeView = myDayActiveView as MyDayView;
  const setActiveView = (view: MyDayView) => setMyDayActiveView(view);

  const myDayTasks = tasks.filter((task: Task) => task.myDay) || [];
  const taskCount = myDayTasks.length;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header with Tabs */}
        <div className="flex-none border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold">My Day</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {activeView === 'list'
                    ? 'Focus on what matters today'
                    : 'Prioritize tasks using the Eisenhower Matrix'}
                </p>
              </div>
              <MyDayTabs
                activeView={activeView}
                onViewChange={setActiveView}
                taskCount={taskCount}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'matrix' ? (
            <EisenhowerMatrix />
          ) : (
            <MyDayTaskView />
          )}
        </div>
      </div>
      
      {/* AI Suggestions - Fixed position overlay */}
      <AISuggestions />
    </>
  );
}
