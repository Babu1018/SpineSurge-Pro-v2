import { ThemeProvider } from "@/components/theme-provider"
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { JSX, useEffect } from "react"
import { useAppStore } from "@/lib/store/index"

import AuthLayout from "@/components/layout/AuthLayout"
import MainLayout from "@/components/layout/MainLayout"
import MainPage from "@/pages/MainPage"
import PatientCasesPage from "@/pages/PatientCasesPage"
import ComparePage from "@/pages/ComparePage"
import LoginPage from "@/pages/LoginPage"
import { UpdateManager } from "@/components/UpdateManager"

// Basic Protected Route Wrapper
const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useAppStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  const initializeStore = useAppStore(state => state.initializeStore);
  const isAuthenticated = useAppStore(state => state.isAuthenticated);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <UpdateManager />
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } />

          {/* Root Redirect */}
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          } />

          {/* Protected Routes */}
          <Route element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }>
            <Route path="/dashboard" element={<MainPage />} />
            <Route path="/compare" element={<ComparePage />} />
          </Route>

          {/* Standalone Protected Route */}
          <Route path="/cases" element={
            <RequireAuth>
              <PatientCasesPage />
            </RequireAuth>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App
