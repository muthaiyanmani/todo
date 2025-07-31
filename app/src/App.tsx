import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth-store';
import { useAppStore } from './store/app-store';
import { notificationService } from './services/notification-service';
import { QueryProvider } from './providers/query-provider';

// Pages
import { Landing } from './pages/landing';
import { SignIn } from './pages/auth/sign-in';
import { SignUp } from './pages/auth/sign-up';
import { ForgotPassword } from './pages/auth/forgot-password';
// import { DashboardRQ } from './pages/dashboard-rq';

// Smart List Pages
import { MyDay } from './pages/my-day';
import { Important } from './pages/important';
import { Planned } from './pages/planned';
import { Tasks } from './pages/tasks';
import { Calendar } from './pages/calendar';
import { CustomList } from './pages/custom-list';
import { Habits } from './pages/habits';

// Productivity Pages
import { PomodoroPage } from './pages/pomodoro';
import { KanbanPage } from './pages/kanban';
import { GTDPage } from './pages/gtd';
import { EnergyPage } from './pages/energy';
import { TwoMinutePage } from './pages/two-minute';
import { TimeTrackingPage } from './pages/time-tracking';

// Settings Pages
import { Settings } from './pages/settings/settings';
import { Profile } from './pages/settings/profile';
import { Preferences } from './pages/settings/preferences';

// Components
import { ProtectedRoute } from './components/protected-route';
import { PublicRoute } from './components/public-route';

function App() {
  const { isAuthenticated } = useAuthStore();
  const { setTheme, theme } = useAppStore();

  useEffect(() => {
    // Initialize theme
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isDark);

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (theme === 'system') {
          root.classList.toggle('dark', e.matches);
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, setTheme]);

  useEffect(() => {
    // Request notification permission on app load
    if (isAuthenticated && 'Notification' in window) {
      notificationService.requestPermission();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Request notification permissions
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <QueryProvider>
      <Router>
        <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          }
        />
        <Route
          path="/auth/signin"
          element={
            <PublicRoute>
              <SignIn />
            </PublicRoute>
          }
        />
        <Route
          path="/auth/signup"
          element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          }
        />
        <Route
          path="/auth/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />

        {/* Protected Routes - Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard/my-day" replace />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Smart Lists */}
        <Route
          path="/dashboard/my-day"
          element={
            <ProtectedRoute>
              <MyDay />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/important"
          element={
            <ProtectedRoute>
              <Important />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/planned"
          element={
            <ProtectedRoute>
              <Planned />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tasks"
          element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Views */}
        <Route
          path="/dashboard/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/habits"
          element={
            <ProtectedRoute>
              <Habits />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Custom Lists */}
        <Route
          path="/dashboard/list/:listId"
          element={
            <ProtectedRoute>
              <CustomList />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Productivity Features */}
        <Route
          path="/dashboard/pomodoro"
          element={
            <ProtectedRoute>
              <PomodoroPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/kanban"
          element={
            <ProtectedRoute>
              <KanbanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/gtd"
          element={
            <ProtectedRoute>
              <GTDPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/energy"
          element={
            <ProtectedRoute>
              <EnergyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/two-minute"
          element={
            <ProtectedRoute>
              <TwoMinutePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/time-tracking"
          element={
            <ProtectedRoute>
              <TimeTrackingPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Settings */}
        <Route
          path="/dashboard/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        >
          <Route path="profile" element={<Profile />} />
          <Route path="preferences" element={<Preferences />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryProvider>
  );
}

export default App;
