import { format } from 'date-fns';
import {
  Bell,
  Calendar,
  Paperclip,
  Plus,
  Repeat,
  Star,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { useAddSubtask, useDeleteTask, useTask, useUpdateSubtask, useUpdateTask } from '../../hooks/use-tasks';
import { cn } from '../../lib/utils';
import { notificationService } from '../../services/notification-service';
import { useAppStoreRQ } from '../../store/app-store-rq';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';

export function TaskDetailsRQ() {
  const { selectedTaskId, setSelectedTask } = useAppStoreRQ();

  // React Query hooks
  const { data: selectedTask, isLoading } = useTask(selectedTaskId || '');
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const addSubtaskMutation = useAddSubtask();
  const updateSubtaskMutation = useUpdateSubtask();

  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  // Update local state when task data changes
  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title || '');
      setNote(selectedTask.note || '');
    }
  }, [selectedTask]);

  if (!selectedTaskId || isLoading) {
    return null;
  }

  if (!selectedTask) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Task not found</p>
      </div>
    );
  }

  const handleTitleSave = async () => {
    if (title.trim() && title !== selectedTask.title) {
      await updateTaskMutation.mutateAsync({
        id: selectedTask.id,
        updates: { title: title.trim() },
      });
    }
    setEditingTitle(false);
  };

  const handleNoteSave = async () => {
    if (note !== selectedTask.note) {
      await updateTaskMutation.mutateAsync({
        id: selectedTask.id,
        updates: { note: note.trim() || undefined },
      });
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || addSubtaskMutation.isPending) return;

    try {
      await addSubtaskMutation.mutateAsync({
        taskId: selectedTask.id,
        subtask: {
          title: newSubtaskTitle.trim(),
          completed: false,
        },
      });
      setNewSubtaskTitle('');
    } catch (error) {
      console.error('Failed to add subtask:', error);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      await updateSubtaskMutation.mutateAsync({
        taskId: selectedTask.id,
        subtaskId,
        updates: { completed: !completed },
      });
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
    }
  };

  const handleDeleteTask = async () => {
    if (deleteTaskMutation.isPending) return;

    try {
      await deleteTaskMutation.mutateAsync(selectedTask.id);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleUpdateTask = (updates: any) => {
    updateTaskMutation.mutate({
      id: selectedTask.id,
      updates,
    });
  };

  const isUpdating = updateTaskMutation.isPending || addSubtaskMutation.isPending;

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-medium">Task Details</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedTask(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={selectedTask.completed}
              onCheckedChange={() =>
                handleUpdateTask({ completed: !selectedTask.completed, completedAt: !selectedTask.completed ? new Date() : undefined })
              }
              disabled={isUpdating}
            />

            {editingTitle ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTitleSave();
                  }
                }}
                className="flex-1 text-base font-medium"
                autoFocus
                disabled={isUpdating}
              />
            ) : (
              <h3
                className={cn(
                  'flex-1 text-base font-medium cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2',
                  selectedTask.completed && 'line-through text-muted-foreground'
                )}
                onClick={() => {
                  if (!isUpdating) {
                    setEditingTitle(true);
                    setTitle(selectedTask.title);
                  }
                }}
              >
                {selectedTask.title}
              </h3>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start h-10"
            onClick={() =>
              handleUpdateTask({ myDay: !selectedTask.myDay })
            }
            disabled={isUpdating}
          >
            <Sun className={cn(
              'h-4 w-4 mr-3',
              selectedTask.myDay ? 'text-blue-600' : 'text-muted-foreground'
            )} />
            <span className="flex-1 text-left">
              {selectedTask.myDay ? 'Added to My Day' : 'Add to My Day'}
            </span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start h-10"
            onClick={() =>
              handleUpdateTask({ important: !selectedTask.important })
            }
            disabled={isUpdating}
          >
            <Star className={cn(
              'h-4 w-4 mr-3',
              selectedTask.important ? 'text-yellow-500 fill-current' : 'text-muted-foreground'
            )} />
            <span className="flex-1 text-left">
              {selectedTask.important ? 'Mark as not important' : 'Mark important'}
            </span>
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              className="w-full justify-start h-10"
              onClick={() => setShowDueDatePicker(!showDueDatePicker)}
              disabled={isUpdating}
            >
              <Calendar className="h-4 w-4 mr-3 text-muted-foreground" />
              <span className="flex-1 text-left">
                {selectedTask.dueDate
                  ? format(selectedTask.dueDate, 'MMM d, yyyy')
                  : 'Add due date'
                }
              </span>
            </Button>
            {showDueDatePicker && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-popover rounded-md shadow-lg">
                <DatePicker
                  selected={selectedTask.dueDate ? new Date(selectedTask.dueDate) : null}
                  onChange={(date: Date | null) => {
                    handleUpdateTask({ dueDate: date || undefined });
                    setShowDueDatePicker(false);
                  }}
                  inline
                  minDate={new Date()}
                />
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              className="w-full justify-start h-10"
              onClick={() => setShowReminderPicker(!showReminderPicker)}
              disabled={isUpdating}
            >
              <Bell className="h-4 w-4 mr-3 text-muted-foreground" />
              <span className="flex-1 text-left">
                {selectedTask.reminderDateTime
                  ? format(selectedTask.reminderDateTime, 'MMM d, yyyy h:mm a')
                  : 'Add reminder'
                }
              </span>
            </Button>
            {showReminderPicker && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-popover rounded-md shadow-lg">
                <DatePicker
                  selected={selectedTask.reminderDateTime ? new Date(selectedTask.reminderDateTime) : null}
                  onChange={async (date: Date | null) => {
                    handleUpdateTask({ reminderDateTime: date || undefined });
                    if (date) {
                      await notificationService.scheduleTaskReminder(selectedTask, date);
                    }
                    setShowReminderPicker(false);
                  }}
                  showTimeSelect
                  timeIntervals={15}
                  inline
                  minDate={new Date()}
                  dateFormat="MMMM d, yyyy h:mm aa"
                />
              </div>
            )}
          </div>

          <Button variant="ghost" className="w-full justify-start h-10" disabled>
            <Repeat className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="flex-1 text-left">
              {selectedTask.repeatRule ? 'Repeat daily' : 'Add repeat'}
            </span>
          </Button>

          <Button variant="ghost" className="w-full justify-start h-10" disabled>
            <Paperclip className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="flex-1 text-left">Add file</span>
          </Button>
        </div>

        {/* Subtasks */}
        {selectedTask.subtasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Steps</h4>
            {selectedTask.subtasks.map((subtask) => (
              <div key={subtask.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={subtask.completed}
                  onCheckedChange={() => handleToggleSubtask(subtask.id, subtask.completed)}
                  disabled={updateSubtaskMutation.isPending}
                />
                <span className={cn(
                  'flex-1 text-sm',
                  subtask.completed && 'line-through text-muted-foreground'
                )}>
                  {subtask.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Add Step */}
        <div className="flex items-center space-x-2">
          <Plus className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={addSubtaskMutation.isPending ? 'Adding step...' : 'Add step'}
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddSubtask();
              }
            }}
            disabled={addSubtaskMutation.isPending}
            className="border-0 shadow-none focus-visible:ring-0 text-sm"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleNoteSave}
            placeholder="Add a note"
            disabled={isUpdating}
            className="w-full min-h-[100px] p-3 text-sm bg-background border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
          />
        </div>

        {/* Created */}
        <div className="text-xs text-muted-foreground">
          Created {format(selectedTask.createdAt, 'MMM d, yyyy')}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleDeleteTask}
          disabled={deleteTaskMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete task'}
        </Button>
      </div>
    </div>
  );
}
