// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import UserLoginForm from './features/users/components/UserLoginForm';
import AdminLoginForm from './features/users/components/AdminLoginForm';
import DashboardPage from './pages/adminPages/DashboardPage';
import CreateIncidentPage from './pages/adminPages/CreateIncidentPage';
import ResourcesPage from './pages/adminPages/ResourcesPage';
import CreateResourcePage from './pages/adminPages/CreateResourcePage';
import IncidentsHubPage from './pages/adminPages/IncidentsHubPage';
import IncidentDetailPage from './pages/adminPages/IncidentDetailPage';
import CreateUserPage from './pages/adminPages/CreateUserPage';
import AssignmentApprovalsPage from './pages/adminPages/AssignmentApprovalsPage';
import IncidentHistoryPage from './pages/adminPages/IncidentHistoryPage';
import OperationsHomePage from './pages/operatorPages/OperationsHomePage';
import OperatorActionLogPage from './pages/operatorPages/OperatorActionLogPage';
import OperatorCasualtiesPage from './pages/operatorPages/OperatorCasualtiesPage';

import UsersPage from './pages/adminPages/UsersPage';

function ProtectedRoute({ children }) {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

function AdminRoute({ children }) {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/admin-login" replace />;
    }
    if (user.role !== 'ADMIN') {
        return <Navigate to="/login" replace />;
    }
    return children;
}

function UserRoute({ children }) {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    if (user.role === 'ADMIN') {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
}

function App() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const isAuthenticated = Boolean(user);

    return (
        <Router>
            <Routes>
                {/* נתיב התחברות כללי למשתמשי קצה וצוותים */}
                <Route
                    path="/login"
                    element={
                        !isAuthenticated
                            ? <UserLoginForm />
                            : <Navigate to={isAdmin ? "/dashboard" : "/operations"} replace />
                    }
                />

                {/* נתיב התחברות ייעודי למנהלי מערכת (ADMIN) */}
                <Route
                    path="/admin-login"
                    element={
                        !isAuthenticated
                            ? <AdminLoginForm />
                            : <Navigate to={isAdmin ? "/dashboard" : "/operations"} replace />
                    }
                />

                {/* לוח הבקרה הראשי */}
                <Route
                    path="/dashboard"
                    element={
                        <AdminRoute>
                            <DashboardPage />
                        </AdminRoute>
                    }
                />

                {/* ניתוב ברירת מחדל */}
                <Route
                    path="*"
                    element={<Navigate to={isAuthenticated ? (isAdmin ? "/dashboard" : "/operations") : "/login"} replace />}
                />
                <Route 
  path="/admin/create-incident" 
  element={
    <AdminRoute>
      <CreateIncidentPage />
    </AdminRoute>
  } 
/>
                <Route
                    path="/admin/resources"
                    element={
                        <AdminRoute>
                            <ResourcesPage />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/create-resource"
                    element={
                        <AdminRoute>
                            <CreateResourcePage />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/incidents"
                    element={
                        <AdminRoute>
                            <IncidentsHubPage />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/incidents/:id"
                    element={
                        <AdminRoute>
                            <IncidentDetailPage />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/incident-resources"
                    element={
                        <AdminRoute>
                            <Navigate to="/admin/incidents" replace />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/create-user"
                    element={
                        <AdminRoute>
                            <CreateUserPage />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/users"
                    element={
                        <AdminRoute>
                            <UsersPage />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/assignment-approvals"
                    element={
                        <AdminRoute>
                            <AssignmentApprovalsPage />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/incident-history"
                    element={
                        <AdminRoute>
                            <IncidentHistoryPage />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/operations"
                    element={
                        <UserRoute>
                            <OperationsHomePage />
                        </UserRoute>
                    }
                />
                <Route
                    path="/operations/action-log"
                    element={
                        <UserRoute>
                            <OperatorActionLogPage />
                        </UserRoute>
                    }
                />
                <Route
                    path="/operations/casualties"
                    element={
                        <UserRoute>
                            <OperatorCasualtiesPage />
                        </UserRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;