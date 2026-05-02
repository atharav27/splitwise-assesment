import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GuestRoute from '../components/layout/GuestRoute';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import Dashboard from '../pages/Dashboard';

const NotFound = lazy(() => import('../pages/NotFound'));
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const SignupPage = lazy(() => import('../features/auth/pages/SignupPage'));
const ExpensesPage = lazy(() => import('../features/expenses/pages/ExpensesPage'));
const CreateEditExpensePage = lazy(() => import('../features/expenses/pages/CreateEditExpensePage'));
const ExpenseDetailPage = lazy(() => import('../features/expenses/pages/ExpenseDetailPage'));
const GroupsPage = lazy(() => import('../features/groups/pages/GroupsPage'));
const CreateGroupPage = lazy(() => import('../features/groups/pages/CreateGroupPage'));
const GroupDetailPage = lazy(() => import('../features/groups/pages/GroupDetailPage'));
const BalancesPage = lazy(() => import('../features/balances/pages/BalancesPage'));
const ActivityPage = lazy(() => import('../features/activity/pages/ActivityPage'));
const SettlementsPage = lazy(() => import('../features/settlements/pages/SettlementsPage'));

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/expenses/new" element={<CreateEditExpensePage />} />
            <Route path="/expenses/:id" element={<ExpenseDetailPage />} />
            <Route path="/expenses/:id/edit" element={<CreateEditExpensePage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/groups/new" element={<CreateGroupPage />} />
            <Route path="/groups/:id" element={<GroupDetailPage />} />
            <Route path="/balances" element={<BalancesPage />} />
            <Route path="/settlements" element={<SettlementsPage />} />
            <Route path="/activity" element={<ActivityPage />} />
          </Route>
          
          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
