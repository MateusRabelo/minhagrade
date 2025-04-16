import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ScheduleProvider } from './contexts/ScheduleContext';
import { ActivityProvider } from './contexts/ActivityContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Dashboard, Login, Register } from './components';
import OfflineNotice from './components/OfflineNotice';
import NotificationTestButton from './components/NotificationTestButton';
import NotificationChecker from './components/NotificationChecker';
import { useAuth } from './contexts/AuthContext';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <AuthProvider>
        <ScheduleProvider>
          <ActivityProvider>
            <NotificationProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                </Routes>
                <OfflineNotice />
                <NotificationTestButton />
                <NotificationChecker />
              </Router>
            </NotificationProvider>
          </ActivityProvider>
        </ScheduleProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
