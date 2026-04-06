import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layout/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages — Core
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupPage from './pages/Group';
import Expenses from './pages/Expenses';
import Settlements from './pages/Settlements';
import Analytics from './pages/Analytics';
import Budget from './pages/Budget';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

// Pages — Premium Features
import Badges from './pages/Badges';
import Recurring from './pages/Recurring';
import ShoppingList from './pages/ShoppingList';
import CurrencyConverter from './pages/CurrencyConverter';
import AIAdvisor from './pages/AIAdvisor';

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
            {/* Premium Routes */}
            <Route path="badges" element={<Badges />} />
            <Route path="recurring" element={<Recurring />} />
            <Route path="shopping" element={<ShoppingList />} />
            <Route path="currency" element={<CurrencyConverter />} />
            <Route path="ai-advisor" element={<AIAdvisor />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;