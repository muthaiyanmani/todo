import { authHandlers } from './auth.handlers';
import { taskHandlers } from './task.handlers';
import { taskListHandlers } from './task-list.handlers';
import { userHandlers } from './user.handlers';
import { habitHandlers } from './habit.handlers';
import { productivityHandlers } from './productivity.handlers';

// Combine all API handlers
export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...taskHandlers,
  ...taskListHandlers,
  ...habitHandlers,
  ...productivityHandlers,
];