import { useState } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import {
  X,
  Star,
  Sun,
  Calendar,
  Bell,
  Repeat,
  Paperclip,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { useAppStore } from '../../store/app-store';
import { notificationService } from '../../services/notification-service';

export function TaskDetails() {
  const { selectedTask, setSelectedTask, updateTask, deleteTask, addSubtask, updateSubtask } = useAppStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(selectedTask?.title || '');
  const [note, setNote] = useState(selectedTask?.note || '');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  if (!selectedTask) {
    return null;
  }

  const handleTitleSave = () => {
    if (title.trim() && title !== selectedTask.title) {
      updateTask(selectedTask.id, { title: title.trim() });
    }
    setEditingTitle(false);
  };

  const handleNoteSave = () => {
    if (note !== selectedTask.note) {
      updateTask(selectedTask.id, { note: note.trim() || undefined });
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      await addSubtask(selectedTask.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
    } catch (error) {
      console.error('Failed to add subtask:', error);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      await updateSubtask(selectedTask.id, subtaskId, { completed: !completed });
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
    }
  };

  const handleDeleteTask = () => {
    deleteTask(selectedTask.id);
    setSelectedTask(null);
  };

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
                updateTask(selectedTask.id, { completed: !selectedTask.completed })
              }
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
              />
            ) : (
              <h3
                className={cn(
                  'flex-1 text-base font-medium cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2',
                  selectedTask.completed && 'line-through text-muted-foreground'
                )}
                onClick={() => {
                  setEditingTitle(true);
                  setTitle(selectedTask.title);
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
              updateTask(selectedTask.id, { myDay: !selectedTask.myDay })
            }
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
              updateTask(selectedTask.id, { important: !selectedTask.important })
            }
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
                  onChange={(date) => {
                    updateTask(selectedTask.id, { dueDate: date || undefined });
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
                  onChange={async (date) => {
                    updateTask(selectedTask.id, { reminderDateTime: date || undefined });
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

          <Button variant="ghost" className="w-full justify-start h-10">
            <Repeat className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="flex-1 text-left">
              {selectedTask.repeatRule ? 'Repeat daily' : 'Add repeat'}
            </span>
          </Button>

          <Button variant="ghost" className="w-full justify-start h-10">
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
            placeholder="Add step"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddSubtask();
              }
            }}
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
            className="w-full min-h-[100px] p-3 text-sm bg-background border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
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
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete task
        </Button>
      </div>
    </div>
  );
}
