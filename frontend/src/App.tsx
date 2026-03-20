import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layout/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupPage from './pages/Group'; // Real fully-wired group detail page
import Expenses from './pages/Expenses';
import Settlements from './pages/Settlements';
import Analytics from './pages/Analytics';
import Budget from './pages/Budget';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="groups" element={<Groups />} />
            <Route path="groups/:id" element={<GroupPage />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="settlements" element={<Settlements />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="budget" element={<Budget />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;