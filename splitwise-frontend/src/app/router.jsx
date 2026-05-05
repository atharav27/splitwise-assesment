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

const Lazy = ({ children }) => <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>;

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Lazy>
                <LoginPage />
              </Lazy>
            </GuestRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestRoute>
              <Lazy>
                <SignupPage />
              </Lazy>
            </GuestRoute>
          }
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/expenses"
            element={
              <Lazy>
                <ExpensesPage />
              </Lazy>
            }
          />
          <Route
            path="/expenses/new"
            element={
              <Lazy>
                <CreateEditExpensePage />
              </Lazy>
            }
          />
          <Route
            path="/expenses/:id"
            element={
              <Lazy>
                <ExpenseDetailPage />
              </Lazy>
            }
          />
          <Route
            path="/expenses/:id/edit"
            element={
              <Lazy>
                <CreateEditExpensePage />
              </Lazy>
            }
          />
          <Route
            path="/groups"
            element={
              <Lazy>
                <GroupsPage />
              </Lazy>
            }
          />
          <Route
            path="/groups/new"
            element={
              <Lazy>
                <CreateGroupPage />
              </Lazy>
            }
          />
          <Route
            path="/groups/:id"
            element={
              <Lazy>
                <GroupDetailPage />
              </Lazy>
            }
          />
          <Route
            path="/balances"
            element={
              <Lazy>
                <BalancesPage />
              </Lazy>
            }
          />
          <Route
            path="/settlements"
            element={
              <Lazy>
                <SettlementsPage />
              </Lazy>
            }
          />
          <Route
            path="/activity"
            element={
              <Lazy>
                <ActivityPage />
              </Lazy>
            }
          />
        </Route>

        {/* Fallback Route */}
        <Route
          path="*"
          element={
            <Lazy>
              <NotFound />
            </Lazy>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
