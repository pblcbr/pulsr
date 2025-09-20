import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import UserProfile from './pages/UserProfile'
import ContentCalendar from './pages/ContentCalendar'

import './App.css'

const ProtectedRoute = ({ children, requiresOnboarding = false }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading..</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  // Assuming Supabase user has a metadata flag for onboarding completion
  const hasCompletedOnboarding = user.user_metadata?.has_completed_onboarding

  if (requiresOnboarding && !hasCompletedOnboarding) {
    return <Navigate to="/onboarding" />
  }
  
  return children
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading..</p>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requiresOnboarding={true}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/content-calendar" 
              element={
                <ProtectedRoute>
                  <ContentCalendar />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
