import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

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

  const signUp = async (email, password) => {
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
              sector: '',
              audience: '',
              tone: '',
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
            // No fallar el registro si hay error creando el perfil
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

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
