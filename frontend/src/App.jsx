import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import GroupCreate from './pages/GroupCreate';
import ExpenseCreate from './pages/ExpenseCreate';
import ExpenseDetail from './pages/ExpenseDetail';
import Settle from './pages/Settle';
import Profile from './pages/Profile';
import Activity from './pages/Activity';
import Settings from './pages/Settings';

const guard = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/"                                            element={guard(<Dashboard />)} />
      <Route path="/groups"                                      element={guard(<Groups />)} />
      <Route path="/groups/new"                                  element={guard(<GroupCreate />)} />
      <Route path="/groups/:id"                                  element={guard(<GroupDetail />)} />
      <Route path="/groups/:groupId/expenses/new"                element={guard(<ExpenseCreate />)} />
      <Route path="/groups/:groupId/expenses/:expenseId"         element={guard(<ExpenseDetail />)} />
      <Route path="/groups/:groupId/settle"                      element={guard(<Settle />)} />
      <Route path="/activity"                                    element={guard(<Activity />)} />
      <Route path="/profile"                                     element={guard(<Profile />)} />
      <Route path="/settings"                                    element={guard(<Settings />)} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
