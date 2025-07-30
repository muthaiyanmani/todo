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
      <div className="flex flex-col min-h-screen">
        {/* Header with Tabs */}
        <div className="flex-none border-b border-border bg-background">
          <div className="pb-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  My Day
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {activeView === 'list'
                    ? 'Focus on what matters today'
                    : 'Prioritize tasks using the Eisenhower Matrix'}
                </p>
              </div>
              <div className="flex-shrink-0">
                <MyDayTabs
                  activeView={activeView}
                  onViewChange={setActiveView}
                  taskCount={taskCount}
                />
              </div>
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
