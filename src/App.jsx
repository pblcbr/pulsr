import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { StripeProvider } from './contexts/StripeContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import UserProfile from './pages/UserProfile'
import ContentCalendar from './pages/ContentCalendar'
import Success from './pages/Success'
import Cancel from './pages/Cancel'

import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

import './App.css'

const ProtectedRoute = ({ children, requiresOnboarding = false }) => {
  const { user, loading } = useAuth()
  const [checkingOnboarding, setCheckingOnboarding] = useState(false)
  const [onboardingCompleteFromProfile, setOnboardingCompleteFromProfile] = useState(false)

  // Support both snake_case and camelCase metadata flags
  const hasCompletedOnboardingMeta =
    user?.user_metadata?.has_completed_onboarding ??
    user?.user_metadata?.hasCompletedOnboarding ??
    false

  // Always call hooks before any conditional returns
  useEffect(() => {
    let isMounted = true

    const checkProfileCompletion = async () => {
      if (!requiresOnboarding || hasCompletedOnboardingMeta || !user?.id) {
        if (isMounted) {
          setOnboardingCompleteFromProfile(false)
        }
        return
      }

      setCheckingOnboarding(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(
            'positioning_statement, analytical, practical, creative, social, entrepreneurial, organized'
          )
          .eq('user_id', user.id)
          .maybeSingle()// <= treat "no row" as null instead of error (avoid 406)

        if (!isMounted) return

        if (error || !data) {
          setOnboardingCompleteFromProfile(false)
          return
        }

        const hasAnyScores = [
          'analytical',
          'practical',
          'creative',
          'social',
          'entrepreneurial',
          'organized',
        ].some((k) => (data?.[k] ?? 0) > 0)

        const hasPositioning = (data?.positioning_statement || '').trim().length > 0

        setOnboardingCompleteFromProfile(hasAnyScores || hasPositioning)
      } finally {
        if (isMounted) setCheckingOnboarding(false)
      }
    }

    checkProfileCompletion()
    return () => {
      isMounted = false
    }
  }, [requiresOnboarding, hasCompletedOnboardingMeta, user?.id])

  const renderLoader = () => (
    <div className="flex items-center justify-center bg-gray-50 min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading..</p>
      </div>
    </div>
  )

  // Early returns after hooks to maintain hook order
  if (loading) {
    return renderLoader()
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (requiresOnboarding && !hasCompletedOnboardingMeta && checkingOnboarding) {
    return renderLoader()
  }

  if (requiresOnboarding && !(hasCompletedOnboardingMeta || onboardingCompleteFromProfile)) {
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
      <StripeProvider>
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
                  <ProtectedRoute>
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
              <Route 
                path="/success" 
                element={
                  <ProtectedRoute>
                    <Success />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/cancel" 
                element={
                  <ProtectedRoute>
                    <Cancel />
                  </ProtectedRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </Router>
      </StripeProvider>
    </AuthProvider>
  )
}

export default App
