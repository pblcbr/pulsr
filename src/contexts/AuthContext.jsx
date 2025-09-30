import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, profile = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        console.error('Auth signup error:', error)
        return { data, error }
      }

      // Si el registro fue exitoso, crear perfil
      if (data.user) {
        console.log('User created successfully:', data.user.id)

        try {
          console.log('Attempting to create profile for user:', data.user.id)

          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              firstName: profile.firstName || '',
              lastName: profile.lastName || '',
              business_model: '',
              audience: '',
              positioning_statement: ''
            })
            .select()

          if (profileError) {
            console.error('Error creating profile:', profileError)
            console.error('Profile error details:', {
              message: profileError.message,
              details: profileError.details,
              hint: profileError.hint,
              code: profileError.code
            })
            // Do not fail signup if there's an error creating the profile
          } else {
            console.log('Profile created successfully:', profileData)
          }
        } catch (profileError) {
          console.error('Exception creating profile:', profileError)
        }
      }

      return { data, error }
    } catch (error) {
      console.error('Signup exception:', error)
      return { data: null, error }
    }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const markOnboardingComplete = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const currentUser = userData?.user
      if (!currentUser) {
        return { data: null, error: new Error('Not authenticated') }
      }

      const updatedMeta = {
        ...(currentUser.user_metadata || {}),
        has_completed_onboarding: true,
      }

      const { data, error } = await supabase.auth.updateUser({
        data: updatedMeta,
      })

      if (error) {
        console.error('Error updating user metadata:', error)
        return { data, error }
      }

      // Optimistically update local state
      setUser({
        ...currentUser,
        user_metadata: updatedMeta,
      })

      return { data, error: null }
    } catch (err) {
      console.error('markOnboardingComplete exception:', err)
      return { data: null, error: err }
    }
  }
  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    markOnboardingComplete,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
