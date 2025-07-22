import type { Task } from '../types';

class NotificationService {
  private permission: NotificationPermission = 'default';

  async requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      return this.permission;
    }
    return 'denied';
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (this.permission !== 'granted') {
      await this.requestPermission();
    }

    if (this.permission === 'granted' && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        badge: '/pwa-64x64.png',
        icon: '/pwa-192x192.png',
        ...options,
      });
    } else if (this.permission === 'granted') {
      new Notification(title, options);
    }
  }

  async scheduleTaskReminder(task: Task, reminderDate: Date): Promise<void> {
    const now = new Date();
    const timeDiff = reminderDate.getTime() - now.getTime();

    if (timeDiff > 0) {
      setTimeout(() => {
        this.showNotification(`Reminder: ${task.title}`, {
          body: task.note || 'You have a task due soon',
          tag: `task-${task.id}`,
          requireInteraction: true,
          // actions: [
          //   {
          //     action: 'complete',
          //     title: 'Mark Complete',
          //   },
          //   {
          //     action: 'snooze',
          //     title: 'Snooze 15 min',
          //   },
          // ],
        });
      }, timeDiff);
    }
  }

  async showTaskDueNotification(task: Task): Promise<void> {
    await this.showNotification(`Task Due: ${task.title}`, {
      body: task.note || 'This task is due now',
      tag: `due-${task.id}`,
      requireInteraction: true,
      // actions: [
      //   {
      //     action: 'complete',
      //     title: 'Mark Complete',
      //   },
      //   {
      //     action: 'postpone',
      //     title: 'Postpone',
      //   },
      // ],
    });
  }

  async showTaskCompleteNotification(task: Task): Promise<void> {
    await this.showNotification('Task Completed! 🎉', {
      body: `You completed: ${task.title}`,
      tag: `complete-${task.id}`,
      silent: false,
    });
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  async cancelNotification(tag: string): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications({ tag });
      notifications.forEach((notification) => notification.close());
    }
  }

  async cancelAllTaskNotifications(taskId: string): Promise<void> {
    const tags = [`task-${taskId}`, `due-${taskId}`, `complete-${taskId}`];
    await Promise.all(tags.map((tag) => this.cancelNotification(tag)));
  }

  setupPushSubscription = async (): Promise<PushSubscription | null> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
        ),
      });
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  };

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const notificationService = new NotificationService();
