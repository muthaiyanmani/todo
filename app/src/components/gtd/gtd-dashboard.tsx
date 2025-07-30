import { Archive, Calendar, Inbox, Lightbulb, Plus, RefreshCw, Search, Zap } from 'lucide-react';
import { useState } from 'react';
import { useCreateTask, useTasks, useUpdateTask } from '../../hooks/use-tasks';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth-store';
import type { Task } from '../../types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

type GTDCategory = 'inbox' | 'nextActions' | 'waiting' | 'projects' | 'someday' | 'reference';

interface GTDTask extends Task {
  gtdCategory: GTDCategory;
  project?: string;
  context?: string;
  energy?: 'high' | 'medium' | 'low';
  estimatedTime?: number; // in minutes
  nextReviewDate?: Date;
}

const gtdCategories = [
  {
    id: 'inbox' as GTDCategory,
    title: 'Inbox',
    icon: Inbox,
    description: 'Capture everything here first',
    color: 'text-blue-600',
  },
  {
    id: 'nextActions' as GTDCategory,
    title: 'Next Actions',
    icon: Zap,
    description: 'Ready to be done',
    color: 'text-green-600',
  },
  {
    id: 'waiting' as GTDCategory,
    title: 'Waiting For',
    icon: RefreshCw,
    description: 'Waiting for others',
    color: 'text-yellow-600',
  },
  {
    id: 'projects' as GTDCategory,
    title: 'Projects',
    icon: Calendar,
    description: 'Multi-step outcomes',
    color: 'text-purple-600',
  },
  {
    id: 'someday' as GTDCategory,
    title: 'Someday/Maybe',
    icon: Lightbulb,
    description: 'Ideas for later',
    color: 'text-orange-600',
  },
  {
    id: 'reference' as GTDCategory,
    title: 'Reference',
    icon: Archive,
    description: 'Information to keep',
    color: 'text-gray-600',
  },
];

const contexts = ['@computer', '@phone', '@office', '@home', '@errands', '@agenda', '@anywhere'];

const energyLevels = [
  { value: 'high', label: 'High Energy', color: 'bg-red-100 text-red-800' },
  { value: 'medium', label: 'Medium Energy', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'low', label: 'Low Energy', color: 'bg-green-100 text-green-800' },
];

export function GTDDashboard() {
  const { data: tasks = [], isLoading } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<GTDCategory>('inbox');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContext, setSelectedContext] = useState<string>('');

  // Convert tasks to GTD format
  const gtdTasks: GTDTask[] = tasks.map((task) => ({
    ...task,
    gtdCategory: (task.gtdCategory as GTDCategory) || 'inbox',
  }));

  // Filter tasks by category
  const getTasksByCategory = (category: GTDCategory) => {
    let filtered = gtdTasks.filter((task) => task.gtdCategory === category);

    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.note?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedContext) {
      filtered = filtered.filter((task) => task.context === selectedContext);
    }

    return filtered;
  };

  const handleCreateTask = async (
    category: GTDCategory = 'inbox',
    taskData: Partial<GTDTask> = {}
  ) => {
    if (!newTaskTitle.trim()) return;

    try {
      await createTaskMutation.mutateAsync({
        title: newTaskTitle.trim(),
        userId: user?.id || 'user-1',
        listId: 'gtd-default',
        note: '',
        completed: false,
        important: false,
        myDay: false,
        subtasks: [],
        gtdCategory: category,
        ...taskData,
      });

      setNewTaskTitle('');
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleMoveTask = async (
    taskId: string,
    newCategory: GTDCategory,
    additionalUpdates: Partial<GTDTask> = {}
  ) => {
    await updateTaskMutation.mutateAsync({
      id: taskId,
      updates: {
        gtdCategory: newCategory,
        ...additionalUpdates,
      },
    });
  };

  const processInboxItem = async (
    task: GTDTask,
    action: 'nextAction' | 'project' | 'someday' | 'reference' | 'delete'
  ) => {
    switch (action) {
      case 'nextAction':
        await handleMoveTask(task.id, 'nextActions');
        break;
      case 'project':
        await handleMoveTask(task.id, 'projects');
        break;
      case 'someday':
        await handleMoveTask(task.id, 'someday');
        break;
      case 'reference':
        await handleMoveTask(task.id, 'reference');
        break;
      case 'delete':
        // Handle task deletion
        break;
    }
  };

  const getNextActionsByContext = () => {
    const nextActions = getTasksByCategory('nextActions');
    const grouped = contexts.reduce(
      (acc, context) => {
        acc[context] = nextActions.filter((task) => task.context === context);
        return acc;
      },
      {} as Record<string, GTDTask[]>
    );

    grouped['No Context'] = nextActions.filter((task) => !task.context);
    return grouped;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Getting Things Done</h1>
          <p className="text-sm text-muted-foreground">Capture, clarify, organize, reflect, and engage</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-6">
          {gtdCategories.map((category) => {
            const count = getTasksByCategory(category.id).length;
            const Icon = category.icon;

            return (
              <Card
                key={category.id}
                className={cn(
                  'p-4 cursor-pointer transition-all hover:shadow-md',
                  activeTab === category.id && 'ring-2 ring-primary'
                )}
                onClick={() => setActiveTab(category.id)}
              >
                <div className="flex items-center justify-between">
                  <Icon className={cn('h-4 w-4', category.color)} />
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <div className="mt-1 text-xs font-medium">{category.title}</div>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center mb-6 space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={selectedContext}
            onChange={(e) => setSelectedContext(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="">All Contexts</option>
            {contexts.map((context) => (
              <option key={context} value={context}>
                {context}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Capture */}
        <Card className="p-4 mb-6">
          <div className="flex items-center space-x-2">
            <Inbox className="w-4 h-4 text-blue-600" />
            <Input
              placeholder="Capture anything on your mind..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateTask('inbox');
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={() => handleCreateTask('inbox')}
              disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as GTDCategory)}>
          <TabsList className="grid w-full grid-cols-6">
            {gtdCategories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center space-x-1"
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{category.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Inbox */}
          <TabsContent value="inbox" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Inbox - Process Everything</h3>
              <span className="text-xs text-muted-foreground">
                {getTasksByCategory('inbox').length} items to process
              </span>
            </div>

            {getTasksByCategory('inbox').map((task) => (
              <Card key={task.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{task.title}</h4>
                    {task.note && <p className="mt-1 text-xs text-muted-foreground">{task.note}</p>}
                  </div>

                  <div className="flex items-center ml-4 space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => processInboxItem(task, 'nextAction')}
                    >
                      Do
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => processInboxItem(task, 'project')}
                    >
                      Project
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => processInboxItem(task, 'someday')}
                    >
                      Someday
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => processInboxItem(task, 'reference')}
                    >
                      Reference
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Next Actions */}
          <TabsContent value="nextActions" className="space-y-4">
            <h3 className="text-lg font-semibold">Next Actions by Context</h3>

            {Object.entries(getNextActionsByContext()).map(
              ([context, tasks]) =>
                tasks.length > 0 && (
                  <div key={context}>
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">{context}</h4>
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <Card key={task.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-sm font-medium">{task.title}</h5>
                              <div className="flex items-center mt-1 space-x-2">
                                {task.energy && (
                                  <span
                                    className={cn(
                                      'px-2 py-1 text-xs rounded-full',
                                      energyLevels.find((e) => e.value === task.energy)?.color
                                    )}
                                  >
                                    {energyLevels.find((e) => e.value === task.energy)?.label}
                                  </span>
                                )}
                                {task.estimatedTime && (
                                  <span className="text-xs text-muted-foreground">
                                    ~{task.estimatedTime}min
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button size="sm">Do Now</Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
            )}
          </TabsContent>

          {/* Other categories */}
          {gtdCategories.slice(2).map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
              <h3 className="flex items-center text-lg font-semibold">
                <category.icon className={cn('h-5 w-5 mr-2', category.color)} />
                {category.title}
              </h3>
              <p className="text-sm text-muted-foreground">{category.description}</p>

              <div className="space-y-2">
                {getTasksByCategory(category.id).map((task) => (
                  <Card key={task.id} className="p-3">
                    <h4 className="text-sm font-medium">{task.title}</h4>
                    {task.note && <p className="mt-1 text-xs text-muted-foreground">{task.note}</p>}
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
