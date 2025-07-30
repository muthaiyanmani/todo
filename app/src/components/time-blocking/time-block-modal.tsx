import { useState, useEffect } from 'react';
import { X, Clock, Repeat, Lock, Calendar, User, Target, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { useTimeBlocking } from '../../hooks/use-productivity';
import { useTasks } from '../../hooks/use-tasks';
import type { TimeBlock } from '../../store/productivity-store';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

interface TimeBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: { start: Date; end: Date } | null;
  editingBlock: TimeBlock | null;
}

const categories = [
  { value: 'work', label: 'Work', icon: Target, color: 'bg-gray-800' },
  { value: 'break', label: 'Break', icon: Clock, color: 'bg-green-600' },
  { value: 'meeting', label: 'Meeting', icon: User, color: 'bg-purple-600' },
  { value: 'focus', label: 'Focus', icon: Zap, color: 'bg-amber-500' },
  { value: 'admin', label: 'Admin', icon: Calendar, color: 'bg-gray-500' },
  { value: 'personal', label: 'Personal', icon: User, color: 'bg-pink-600' },
  { value: 'custom', label: 'Custom', icon: Target, color: 'bg-blue-600' },
] as const;

export function TimeBlockModal({ isOpen, onClose, selectedSlot, editingBlock }: TimeBlockModalProps) {
  const timeBlocking = useTimeBlocking();
  const { data: tasks = [] } = useTasks();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'work' as TimeBlock['category'],
    taskId: '',
    isRecurring: false,
    locked: false,
    color: '',
    startTime: '',
    endTime: '',
    recurrenceType: 'daily' as 'daily' | 'weekly' | 'monthly',
    recurrenceInterval: 1,
    recurrenceDays: [] as number[],
    recurrenceEndDate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingBlock) {
      setFormData({
        title: editingBlock.title,
        description: editingBlock.description || '',
        category: editingBlock.category,
        taskId: editingBlock.taskId || '',
        isRecurring: editingBlock.isRecurring,
        locked: editingBlock.locked,
        color: editingBlock.color || '',
        startTime: format(editingBlock.startTime, "yyyy-MM-dd'T'HH:mm"),
        endTime: format(editingBlock.endTime, "yyyy-MM-dd'T'HH:mm"),
        recurrenceType: editingBlock.recurrencePattern?.type || 'daily',
        recurrenceInterval: editingBlock.recurrencePattern?.interval || 1,
        recurrenceDays: editingBlock.recurrencePattern?.daysOfWeek || [],
        recurrenceEndDate: editingBlock.recurrencePattern?.endDate 
          ? format(editingBlock.recurrencePattern.endDate, 'yyyy-MM-dd') 
          : '',
      });
    } else if (selectedSlot) {
      setFormData({
        title: '',
        description: '',
        category: 'work',
        taskId: '',
        isRecurring: false,
        locked: false,
        color: '',
        startTime: format(selectedSlot.start, "yyyy-MM-dd'T'HH:mm"),
        endTime: format(selectedSlot.end, "yyyy-MM-dd'T'HH:mm"),
        recurrenceType: 'daily',
        recurrenceInterval: 1,
        recurrenceDays: [],
        recurrenceEndDate: '',
      });
    }
    setErrors({});
  }, [editingBlock, selectedSlot]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      
      if (end <= start) {
        newErrors.endTime = 'End time must be after start time';
      }

      // Check for conflicts with existing blocks
      const conflicts = timeBlocking.getConflictingBlocks(start, end, editingBlock?.id);
      if (conflicts.length > 0) {
        newErrors.startTime = `Conflicts with: ${conflicts[0].title}`;
      }
    }

    if (formData.isRecurring && formData.recurrenceType === 'weekly' && formData.recurrenceDays.length === 0) {
      newErrors.recurrenceDays = 'Select at least one day for weekly recurrence';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    const blockData: Omit<TimeBlock, 'id'> = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      startTime,
      endTime,
      duration,
      category: formData.category,
      taskId: formData.taskId || undefined,
      color: formData.color || undefined,
      isRecurring: formData.isRecurring,
      locked: formData.locked,
      completed: false,
      recurrencePattern: formData.isRecurring ? {
        type: formData.recurrenceType,
        interval: formData.recurrenceInterval,
        daysOfWeek: formData.recurrenceType === 'weekly' ? formData.recurrenceDays : undefined,
        endDate: formData.recurrenceEndDate ? new Date(formData.recurrenceEndDate) : undefined,
      } : undefined,
    };

    if (editingBlock) {
      timeBlocking.updateBlock(editingBlock.id, blockData);
    } else {
      timeBlocking.createBlock(blockData);
    }

    // Generate recurring blocks if needed
    if (formData.isRecurring && formData.recurrenceEndDate) {
      const blockId = editingBlock?.id || Date.now().toString();
      timeBlocking.generateRecurring(blockId, new Date(formData.recurrenceEndDate));
    }

    onClose();
  };

  const handleDelete = () => {
    if (editingBlock && confirm('Are you sure you want to delete this time block?')) {
      timeBlocking.deleteBlock(editingBlock.id);
      onClose();
    }
  };

  const handleComplete = () => {
    if (editingBlock) {
      timeBlocking.completeBlock(editingBlock.id);
      onClose();
    }
  };

  const toggleRecurrenceDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      recurrenceDays: prev.recurrenceDays.includes(day)
        ? prev.recurrenceDays.filter(d => d !== day)
        : [...prev.recurrenceDays, day].sort()
    }));
  };

  const uncompletedTasks = tasks.filter(task => !task.completed);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">
              {editingBlock ? 'Edit Time Block' : 'Create Time Block'}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Morning Planning"
                className={cn(errors.title && "border-red-500")}
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description..."
                rows={2}
              />
            </div>

            {/* Category Selection */}
            <div>
              <Label>Category</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-lg border transition-all",
                        formData.category === category.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className={cn("w-6 h-6 rounded flex items-center justify-center mb-1", category.color)}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs">{category.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className={cn(errors.startTime && "border-red-500")}
                />
                {errors.startTime && <p className="text-sm text-red-500 mt-1">{errors.startTime}</p>}
              </div>
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className={cn(errors.endTime && "border-red-500")}
                />
                {errors.endTime && <p className="text-sm text-red-500 mt-1">{errors.endTime}</p>}
              </div>
            </div>

            {/* Task Association */}
            {uncompletedTasks.length > 0 && (
              <div>
                <Label htmlFor="taskId">Link to Task (Optional)</Label>
                <select
                  id="taskId"
                  value={formData.taskId}
                  onChange={(e) => setFormData(prev => ({ ...prev, taskId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">No task linked</option>
                  {uncompletedTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isRecurring" className="flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  Recurring
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="locked"
                  checked={formData.locked}
                  onChange={(e) => setFormData(prev => ({ ...prev, locked: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="locked" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Lock (prevent editing)
                </Label>
              </div>
            </div>

            {/* Recurrence Settings */}
            {formData.isRecurring && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-3">Recurrence Settings</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="recurrenceType">Repeat</Label>
                    <select
                      id="recurrenceType"
                      value={formData.recurrenceType}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        recurrenceType: e.target.value as 'daily' | 'weekly' | 'monthly'
                      }))}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="recurrenceInterval">Every</Label>
                    <Input
                      id="recurrenceInterval"
                      type="number"
                      min="1"
                      value={formData.recurrenceInterval}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        recurrenceInterval: parseInt(e.target.value) || 1
                      }))}
                    />
                  </div>
                </div>

                {formData.recurrenceType === 'weekly' && (
                  <div className="mb-4">
                    <Label>Days of Week</Label>
                    <div className="flex gap-1 mt-2">
                      {dayNames.map((day, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => toggleRecurrenceDay(index)}
                          className={cn(
                            "w-8 h-8 text-xs rounded",
                            formData.recurrenceDays.includes(index)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                    {errors.recurrenceDays && (
                      <p className="text-sm text-red-500 mt-1">{errors.recurrenceDays}</p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="recurrenceEndDate">End Date (Optional)</Label>
                  <Input
                    id="recurrenceEndDate"
                    type="date"
                    value={formData.recurrenceEndDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurrenceEndDate: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between mt-6 pt-4 border-t">
            <div>
              {editingBlock && !editingBlock.completed && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleComplete}
                  className="mr-2"
                >
                  Mark Complete
                </Button>
              )}
              {editingBlock && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {editingBlock ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}