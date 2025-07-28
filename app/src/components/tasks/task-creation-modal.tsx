import { useState } from 'react';
import { CalendarDays, Clock, Repeat, X, Star, Sun } from 'lucide-react';
import { SmartTaskSuggestions } from './smart-task-suggestions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import type { RecurrenceRule } from '../../types';

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    title: string;
    note?: string;
    dueDate?: Date;
    reminderDateTime?: Date;
    repeatRule?: RecurrenceRule;
    important: boolean;
    myDay: boolean;
  }) => Promise<void>;
  defaultMyDay?: boolean;
  defaultImportant?: boolean;
}

const RECURRENCE_PRESETS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays (Mon-Fri)' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom...' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export function TaskCreationModal({
  isOpen,
  onClose,
  onSubmit,
  defaultMyDay = false,
  defaultImportant = false,
}: TaskCreationModalProps) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [dueTime, setDueTime] = useState('');
  const [reminderDate, setReminderDate] = useState<Date | undefined>();
  const [reminderTime, setReminderTime] = useState('');
  const [important, setImportant] = useState(defaultImportant);
  const [myDay, setMyDay] = useState(defaultMyDay);
  const [recurrenceType, setRecurrenceType] = useState('none');
  const [customRecurrence, setCustomRecurrence] = useState<RecurrenceRule>({
    type: 'weekly',
    interval: 1,
    daysOfWeek: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      let finalDueDate: Date | undefined;
      let finalReminderDate: Date | undefined;
      let repeatRule: RecurrenceRule | undefined;

      // Combine date and time for due date
      if (dueDate) {
        finalDueDate = new Date(dueDate);
        if (dueTime) {
          const [hours, minutes] = dueTime.split(':').map(Number);
          finalDueDate.setHours(hours, minutes, 0, 0);
        }
      }

      // Combine date and time for reminder
      if (reminderDate) {
        finalReminderDate = new Date(reminderDate);
        if (reminderTime) {
          const [hours, minutes] = reminderTime.split(':').map(Number);
          finalReminderDate.setHours(hours, minutes, 0, 0);
        }
      }

      // Set up recurrence rule
      if (recurrenceType !== 'none') {
        switch (recurrenceType) {
          case 'daily':
            repeatRule = { type: 'daily', interval: 1 };
            break;
          case 'weekdays':
            repeatRule = { 
              type: 'weekly', 
              interval: 1, 
              daysOfWeek: [1, 2, 3, 4, 5] // Mon-Fri
            };
            break;
          case 'weekly':
            repeatRule = { type: 'weekly', interval: 1 };
            break;
          case 'monthly':
            repeatRule = { type: 'monthly', interval: 1 };
            break;
          case 'yearly':
            repeatRule = { type: 'yearly', interval: 1 };
            break;
          case 'custom':
            repeatRule = customRecurrence;
            break;
        }
      }

      await onSubmit({
        title: title.trim(),
        note: note.trim() || undefined,
        dueDate: finalDueDate,
        reminderDateTime: finalReminderDate,
        repeatRule,
        important,
        myDay,
      });

      // Reset form
      setTitle('');
      setNote('');
      setDueDate(undefined);
      setDueTime('');
      setReminderDate(undefined);
      setReminderTime('');
      setImportant(defaultImportant);
      setMyDay(defaultMyDay);
      setRecurrenceType('none');
      setCustomRecurrence({ type: 'weekly', interval: 1, daysOfWeek: [] });
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecurrenceChange = (value: string) => {
    setRecurrenceType(value);
    if (value === 'custom' && customRecurrence.daysOfWeek?.length === 0) {
      // Set default to current day of week
      const today = new Date().getDay();
      setCustomRecurrence(prev => ({ ...prev, daysOfWeek: [today] }));
    }
  };

  const toggleCustomDay = (day: number) => {
    setCustomRecurrence(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek?.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...(prev.daysOfWeek || []), day].sort()
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Create New Task</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Task Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you need to do?"
                required
                autoFocus
              />
            </div>

            {/* Smart Suggestions */}
            {title.trim().length > 3 && (
              <SmartTaskSuggestions
                taskTitle={title}
                currentNote={note}
                onApplySuggestion={(suggestion) => {
                  console.log('Applied suggestion:', suggestion);
                }}
                onUpdateNote={setNote}
                onUpdateImportant={setImportant}
                className="border rounded-lg p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20"
              />
            )}

            {/* Task Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Notes</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add any additional details..."
                rows={3}
              />
            </div>

            {/* Quick Options */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="myDay"
                  checked={myDay}
                  onCheckedChange={(checked) => setMyDay(!!checked)}
                />
                <Label htmlFor="myDay" className="flex items-center space-x-1">
                  <Sun className="h-4 w-4 text-blue-600" />
                  <span>Add to My Day</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="important"
                  checked={important}
                  onCheckedChange={(checked) => setImportant(!!checked)}
                />
                <Label htmlFor="important" className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>Mark as Important</span>
                </Label>
              </div>
            </div>

            {/* Due Date & Time */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <Label>Due Date & Time</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueTime">Due Time</Label>
                  <Input
                    id="dueTime"
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Reminder Date & Time */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label>Reminder</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reminderDate">Reminder Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !reminderDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {reminderDate ? format(reminderDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={reminderDate}
                        onSelect={setReminderDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminderTime">Reminder Time</Label>
                  <Input
                    id="reminderTime"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Recurrence */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <Label>Repeat</Label>
              </div>

              <div className="space-y-3">
                <Select value={recurrenceType} onValueChange={handleRecurrenceChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select repeat option" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Custom Recurrence Options */}
                {recurrenceType === 'custom' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Repeat every</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="1"
                            max="365"
                            value={customRecurrence.interval}
                            onChange={(e) => setCustomRecurrence(prev => ({ 
                              ...prev, 
                              interval: parseInt(e.target.value) || 1 
                            }))}
                            className="w-20"
                          />
                          <Select
                            value={customRecurrence.type}
                            onValueChange={(value) => setCustomRecurrence(prev => ({ 
                              ...prev, 
                              type: value as RecurrenceRule['type']
                            }))}
                          >
                            <SelectTrigger className="w-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">day(s)</SelectItem>
                              <SelectItem value="weekly">week(s)</SelectItem>
                              <SelectItem value="monthly">month(s)</SelectItem>
                              <SelectItem value="yearly">year(s)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {customRecurrence.type === 'weekly' && (
                        <div className="space-y-2">
                          <Label>On days</Label>
                          <div className="flex flex-wrap gap-2">
                            {DAYS_OF_WEEK.map((day) => (
                              <Button
                                key={day.value}
                                type="button"
                                variant={customRecurrence.daysOfWeek?.includes(day.value) ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleCustomDay(day.value)}
                                className="w-12 h-8"
                              >
                                {day.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!title.trim() || isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}