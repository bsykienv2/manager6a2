
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import Attendance from './pages/Attendance';
import Academic from './pages/Academic';
import AcademicResults from './pages/AcademicResults'; // New Import
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import AiAssistant from './pages/AiAssistant';
import Settings from './pages/Settings';
import AccountManagement from './pages/AccountManagement';
import Login from './pages/Login';
import Register from './pages/Register'; // New Page
import Reviews from './pages/Reviews';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { Role } from './types';
import { Outlet } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes Wrapper */}
          <Route element={<ProtectedRoute />}>
             <Route element={<Layout><Outlet /></Layout>}>
                
                {/* 1. Shared Routes (Teachers & Parents) */}
                <Route path="/" element={<Dashboard />} />
                
                {/* 2. Teachers ONLY */}
                <Route element={<ProtectedRoute allowedRoles={[Role.HOMEROOM, Role.SUBJECT]} />}>
                    <Route path="/students" element={<StudentList />} />
                </Route>

                {/* 3. Homeroom & Parent Shared Routes (But different views) */}
                <Route element={<ProtectedRoute allowedRoles={[Role.HOMEROOM, Role.PARENT]} />}>
                    <Route path="/academic-results" element={<AcademicResults defaultView="table" />} />
                    <Route path="/scorecards" element={<AcademicResults defaultView="scorecard" />} />
                    <Route path="/academic" element={<Academic />} />
                    <Route path="/reviews" element={<Reviews />} />
                    <Route path="/reports" element={<Reports />} />
                </Route>

                {/* 4. Homeroom ONLY */}
                <Route element={<ProtectedRoute allowedRoles={[Role.HOMEROOM]} />}>
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/accounts" element={<AccountManagement />} />
                    <Route path="/ai-assistant" element={<AiAssistant />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>

             </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;
