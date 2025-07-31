import { Calendar, Clock, Settings, Target, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateHabit, useUpdateHabit } from '../../hooks/use-habits';
import { soundService } from '../../services/sound-service';
import type { CreateHabitInput, DifficultyLevel, FrequencyType, Habit, HabitCategory } from '../../types/habit.types';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface HabitCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit?: Habit; // For editing
}

interface FormData {
  name: string;
  description: string;
  category: HabitCategory;
  frequencyType: FrequencyType;
  frequencyValue: number;
  customDays: string[];
  startDate: string;
  endDate: string;
  hasEndDate: boolean;
  difficulty: DifficultyLevel;
  reminderTime: string;
  hasReminder: boolean;
  allowPartialCompletion: boolean;
  trackQuantity: boolean;
  quantityUnit: string;
  targetQuantity: number;
  isPublic: boolean;
  shareWithFriends: boolean;
}

const categories: Array<{ value: HabitCategory; label: string; description: string }> = [
  { value: 'health', label: 'Health', description: 'General wellness and health-related habits' },
  { value: 'fitness', label: 'Fitness', description: 'Exercise, sports, and physical activity' },
  { value: 'learning', label: 'Learning', description: 'Education, reading, and skill development' },
  { value: 'productivity', label: 'Productivity', description: 'Work efficiency and time management' },
  { value: 'mindfulness', label: 'Mindfulness', description: 'Meditation, reflection, and mental wellness' },
  { value: 'social', label: 'Social', description: 'Relationships and social interactions' },
  { value: 'creative', label: 'Creative', description: 'Art, music, writing, and creative expression' },
  { value: 'financial', label: 'Financial', description: 'Money management and financial goals' },
];

const weekDays = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

export function HabitCreationModal({ isOpen, onClose, habit }: HabitCreationModalProps) {
  const [step, setStep] = useState(1);
  const isEditing = !!habit;

  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: habit?.name || '',
      description: habit?.description || '',
      category: habit?.category || 'health',
      frequencyType: habit?.targetFrequency.type || 'daily',
      frequencyValue: habit?.targetFrequency.value || 1,
      customDays: habit?.targetFrequency.customDays || [],
      startDate: habit ? new Date(habit.duration.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: habit?.duration.endDate ? new Date(habit.duration.endDate).toISOString().split('T')[0] : '',
      hasEndDate: !!habit?.duration.endDate,
      difficulty: habit?.difficulty || 'beginner',
      reminderTime: habit?.reminderTime || '09:00',
      hasReminder: !!habit?.reminderTime,
      allowPartialCompletion: habit?.settings.allowPartialCompletion ?? true,
      trackQuantity: habit?.settings.trackQuantity ?? false,
      quantityUnit: habit?.settings.quantityUnit || '',
      targetQuantity: habit?.settings.targetQuantity || 1,
      isPublic: habit?.settings.isPublic ?? false,
      shareWithFriends: habit?.settings.shareWithFriends ?? true,
    },
  });

  const watchedValues = watch();

  const handleClose = () => {
    setStep(1);
    reset();
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    try {
      const habitInput: CreateHabitInput = {
        name: data.name,
        description: data.description || undefined,
        category: data.category,
        targetFrequency: {
          type: data.frequencyType,
          value: data.frequencyValue,
          customDays: data.frequencyType === 'custom' ? data.customDays : undefined,
        },
        duration: {
          startDate: data.startDate,
          endDate: data.hasEndDate ? data.endDate : undefined,
        },
        difficulty: data.difficulty,
        reminderTime: data.hasReminder ? data.reminderTime : undefined,
        settings: {
          allowPartialCompletion: data.allowPartialCompletion,
          trackQuantity: data.trackQuantity,
          quantityUnit: data.trackQuantity ? data.quantityUnit : undefined,
          targetQuantity: data.trackQuantity ? data.targetQuantity : undefined,
          isPublic: data.isPublic,
          shareWithFriends: data.shareWithFriends,
          showInDashboard: true,
        },
      };

      if (isEditing && habit) {
        await updateHabit.mutateAsync({ habitId: habit.id, updates: habitInput });
        soundService.playSuccess();
      } else {
        await createHabit.mutateAsync(habitInput);
        soundService.playSuccess();
      }

      handleClose();
    } catch (error) {
      console.error('Failed to save habit:', error);
    }
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Basic Information</h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="name">Habit Name *</Label>
          <Input
            id="name"
            {...register('name', { required: 'Habit name is required' })}
            placeholder="e.g., Morning Meditation, Read 30 Pages"
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            id="description"
            {...register('description')}
            placeholder="Brief description of your habit"
          />
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
        <Select
          value={watchedValues.category}
          onValueChange={(value) => setValue('category', value as HabitCategory)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                <div>
                  <div className="font-medium">{cat.label}</div>
                  <div className="text-xs text-muted-foreground">{cat.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="difficulty">Difficulty Level</Label>
          <Select
            value={watchedValues.difficulty}
            onValueChange={(value) => setValue('difficulty', value as DifficultyLevel)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner - Easy to maintain</SelectItem>
              <SelectItem value="intermediate">Intermediate - Requires some effort</SelectItem>
              <SelectItem value="advanced">Advanced - Challenging but rewarding</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Frequency & Schedule</h3>
      </div>

      <div>
        <Label>How often? *</Label>
        <Select
          value={watchedValues.frequencyType}
          onValueChange={(value) => setValue('frequencyType', value as FrequencyType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="custom">Custom Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {watchedValues.frequencyType !== 'daily' && watchedValues.frequencyType !== 'custom' && (
        <div>
          <Label htmlFor="frequencyValue">
            Times per {watchedValues.frequencyType === 'weekly' ? 'week' : 'month'}
          </Label>
          <Input
            id="frequencyValue"
            type="number"
            min="1"
            {...register('frequencyValue', {
              required: 'Frequency is required',
              min: { value: 1, message: 'Must be at least 1' }
            })}
          />
        </div>
      )}

      {watchedValues.frequencyType === 'custom' && (
        <div>
          <Label>Select Days</Label>
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-2">
            {weekDays.map((day) => (
              <div key={day.value} className="flex flex-col items-center">
                <Checkbox
                  checked={watchedValues.customDays.includes(day.value)}
                  onCheckedChange={(checked) => {
                    const current = watchedValues.customDays;
                    if (checked) {
                      setValue('customDays', [...current, day.value]);
                    } else {
                      setValue('customDays', current.filter(d => d !== day.value));
                    }
                  }}
                  className="h-3 w-3 sm:h-4 sm:w-4"
                />
                <Label className="text-xs mt-1 text-center leading-tight">{day.label}</Label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            {...register('startDate', { required: 'Start date is required' })}
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Checkbox
              checked={watchedValues.hasEndDate}
              onCheckedChange={(checked) => setValue('hasEndDate', checked as boolean)}
            />
            <Label htmlFor="endDate">Set End Date</Label>
          </div>
          <Input
            id="endDate"
            type="date"
            disabled={!watchedValues.hasEndDate}
            {...register('endDate')}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Tracking & Reminders</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/20 touch-manipulation">
          <Checkbox
            checked={watchedValues.hasReminder}
            onCheckedChange={(checked) => setValue('hasReminder', checked as boolean)}
            className="touch-manipulation"
          />
          <Label className="cursor-pointer">Set Daily Reminder</Label>
        </div>

        {watchedValues.hasReminder && (
          <div>
            <Label htmlFor="reminderTime">Reminder Time</Label>
            <Input
              id="reminderTime"
              type="time"
              {...register('reminderTime')}
            />
          </div>
        )}

        <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/20 touch-manipulation">
          <Checkbox
            checked={watchedValues.trackQuantity}
            onCheckedChange={(checked) => setValue('trackQuantity', checked as boolean)}
            className="touch-manipulation"
          />
          <Label className="cursor-pointer">Track Quantity</Label>
        </div>

        {watchedValues.trackQuantity && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetQuantity">Target Amount</Label>
              <Input
                id="targetQuantity"
                type="number"
                min="1"
                {...register('targetQuantity')}
                placeholder="e.g., 30"
              />
            </div>
            <div>
              <Label htmlFor="quantityUnit">Unit</Label>
              <Input
                id="quantityUnit"
                {...register('quantityUnit')}
                placeholder="e.g., pages, minutes, glasses"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/20 touch-manipulation">
          <Checkbox
            checked={watchedValues.allowPartialCompletion}
            onCheckedChange={(checked) => setValue('allowPartialCompletion', checked as boolean)}
            className="touch-manipulation"
          />
          <Label className="cursor-pointer">Allow Partial Completion</Label>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Privacy & Sharing</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/20 touch-manipulation">
            <Checkbox
              checked={watchedValues.isPublic}
              onCheckedChange={(checked) => setValue('isPublic', checked as boolean)}
              className="touch-manipulation"
            />
            <Label className="cursor-pointer">Make this habit public</Label>
          </div>
          <p className="text-xs text-muted-foreground ml-8 sm:ml-9">
            Public habits can be seen by other users and may appear in community features
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/20 touch-manipulation">
            <Checkbox
              checked={watchedValues.shareWithFriends}
              onCheckedChange={(checked) => setValue('shareWithFriends', checked as boolean)}
              className="touch-manipulation"
            />
            <Label className="cursor-pointer">Share progress with friends</Label>
          </div>
          <p className="text-xs text-muted-foreground ml-8 sm:ml-9">
            Friends can see your progress and cheer you on
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">Summary</h4>
        <div className="text-sm space-y-1">
          <p><strong>Habit:</strong> {watchedValues.name}</p>
          <p><strong>Category:</strong> {watchedValues.category}</p>
          <p><strong>Frequency:</strong> {watchedValues.frequencyType === 'daily' ? 'Daily' :
            watchedValues.frequencyType === 'custom' ? `${watchedValues.customDays.length} days per week` :
            `${watchedValues.frequencyValue} times per ${watchedValues.frequencyType}`}</p>
          <p><strong>Difficulty:</strong> {watchedValues.difficulty}</p>
          {watchedValues.hasReminder && (
            <p><strong>Reminder:</strong> {watchedValues.reminderTime}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md sm:max-w-2xl max-h-[95vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center justify-between">
              {isEditing ? 'Edit Habit' : 'Create New Habit'}
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6 overflow-x-auto pb-2">
            {[
              { num: 1, label: 'Basic Info' },
              { num: 2, label: 'Schedule' },
              { num: 3, label: 'Settings' },
              { num: 4, label: 'Review' }
            ].map((stepInfo, index) => (
              <div key={stepInfo.num} className="flex items-center flex-shrink-0">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                    stepInfo.num <= step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {stepInfo.num}
                </div>
                <div className="ml-1 sm:ml-2 hidden md:block">
                  <div className={`text-sm font-medium ${
                    stepInfo.num <= step ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {stepInfo.label}
                  </div>
                </div>
                {index < 3 && (
                  <div className={`w-4 sm:w-8 h-px mx-1 sm:mx-2 ${
                    stepInfo.num < step ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[300px] sm:min-h-[400px]">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Back</span>
            </Button>

            {step < 4 ? (
              <Button
                type="button"
                onClick={nextStep}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={createHabit.isPending || updateHabit.isPending}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                {createHabit.isPending || updateHabit.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : null}
                {isEditing ? 'Update Habit' : 'Create Habit'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
