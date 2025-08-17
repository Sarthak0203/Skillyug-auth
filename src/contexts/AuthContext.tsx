import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../lib/supabase'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, userType: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  resendVerification: (email: string) => Promise<void>
  createProfileForCurrentUser: () => Promise<boolean>
  checkDatabaseSetup: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastProfileFetch, setLastProfileFetch] = useState<string | null>(null)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        setSession(session)
        setUser(session?.user || null)
        
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        toast.error('Failed to initialize authentication')
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user || null)
        
        if (session?.user) {
          const userId = session.user.id;
          if (lastProfileFetch !== userId) {
            setLastProfileFetch(userId);
            fetchUserProfile(userId).catch(console.error);
          }
        } else {
          setProfile(null)
          setLastProfileFetch(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout after 5 seconds')), 10000)
      );
      
      const fetchPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      if (error) {
        if (error.code === 'PGRST116') {
          if (user) {
            try {
              const { error: createError } = await supabase
                .from('user_profiles')
                .insert({
                  id: userId,
                  email: user.email!,
                  full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                  user_type: user.user_metadata?.user_type || 'student',
                  email_verified: user.email_confirmed_at ? true : false
                })

              if (createError) {
                console.error('Failed to create profile for existing user:', createError)
                setProfile(null)
                return
              }

              const { data: newProfile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single()

              if (newProfile) {
                setProfile(newProfile)
                toast.success('Profile created successfully!')
                return
              }
            } catch (createError) {
              console.error('Error creating profile for existing user:', createError)
            }
          }

          setProfile(null)
          return
        } else if (error.code === '42P01') {
          console.error('user_profiles table does not exist. Please run the database schema setup.')
          toast.error('Database setup required. Please contact support.')
          setProfile(null)
          return
        } else {
          throw error
        }
      }

      setProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setProfile(null)
    }
  }

  const checkDatabaseSetup = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      return false;
    }
  };

  const createProfileForCurrentUser = async () => {
    if (!user) {
      toast.error('No user logged in')
      return false
    }

    try {
      setLoading(true)

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Manual profile creation timeout')), 5000)
      );

      const insertPromise = supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          user_type: user.user_metadata?.user_type || 'student',
          email_verified: user.email_confirmed_at ? true : false
        });

      const { error } = await Promise.race([insertPromise, timeoutPromise]) as any;

      if (error) {
        if (error.code === '23505') {
          toast.success('Profile already exists - fetching existing profile')
          await fetchUserProfile(user.id)
          return true
        } else {
          console.error('Error creating profile:', error)
          toast.error(`Failed to create profile: ${error.message || 'Unknown error'}`)
        }
        return false
      }

      await fetchUserProfile(user.id)
      toast.success('Profile created successfully!')
      return true
    } catch (error: any) {
      console.error('Error in createProfileForCurrentUser:', error)
      if (error.message.includes('timeout')) {
        toast.error('Database connection timeout. Please try again or check your internet connection.')
      } else {
        toast.error(`Failed to create profile: ${error.message || 'Unknown error'}`)
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string, userType: string) => {
    try {
      setLoading(true)
      
      const skipEmailCheck = false; 
      
      if (!skipEmailCheck) {
        try {
          
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000) 
        );          const queryPromise = supabase
            .from('user_profiles')
            .select('email')
            .eq('email', email)
            .single();
            
          const { data: existingUser } = await Promise.race([queryPromise, timeoutPromise]) as any;

          if (existingUser) {
            throw new Error('An account with this email already exists')
          }
          } catch (error: any) {
          if (error.code !== '42P01' && 
              error.code !== 'PGRST116' && 
              !error.message?.includes('JSON object requested') &&
              !error.message?.includes('Timeout') &&
              !error.message?.includes('timeout')) {
            throw error
          }
        }
      } else {
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Supabase signup error:', error)
        throw error
      }

      if (data.user && !data.session) {
        toast.success('Please check your email for verification link')
        
        if (!skipEmailCheck) {
          try {
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile creation timeout')), 2000)
            );
            
            const profilePromise = supabase
              .from('user_profiles')
              .insert({
                id: data.user.id,
                email: data.user.email!,
                full_name: fullName,
                user_type: userType,
                email_verified: false 
              });
            
            await Promise.race([profilePromise, timeoutPromise]);
            toast.success('Account created! Please check your email for verification.')
          } catch (profileError: any) {
            if (profileError.message.includes('timeout')) {
              toast.success('Account created! Check email to verify. Profile will be created after verification.')
            } else if (profileError.code === '23505') {
              toast.success('Account created! Please check your email for verification.')
            } else {
              toast.success('Account created! Use System Status panel to create profile manually.')
            }
          }
        } else {
          toast.success('Account created! Check your email for verification. (Database setup needed for full features)')
        }
      } else if (data.session) {
        
        if (!skipEmailCheck) {
          try {
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile creation timeout')), 2000)
            );
            
            const profilePromise = supabase
              .from('user_profiles')
              .insert({
                id: data.user!.id,
                email: data.user!.email!,
                full_name: fullName,
                user_type: userType,
                email_verified: true
              });
            
            await Promise.race([profilePromise, timeoutPromise]);
            toast.success('Account created and logged in successfully!')
            
            await fetchUserProfile(data.user!.id)
          } catch (profileError: any) {
            if (profileError.code === '23505') {
              await fetchUserProfile(data.user!.id)
              toast.success('Account created and logged in successfully!')
            } else {
              toast.success('Account created and logged in! Use System Status panel to create profile manually.')
            }
          }
        } else {
          toast.success('Account created and logged in successfully!')
        }
      }
    } catch (error) {
      console.error('Signup process failed:', error)
      const authError = error as AuthError
      toast.error(authError.message || 'Failed to create account')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign in timeout after 10 seconds')), 10000)
      );
      
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password
      });

      const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any;

      if (error) throw error

      if (data.user) {
        try {
          const updatePromise = supabase
            .from('user_profiles')
            .update({ last_sign_in_at: new Date().toISOString() })
            .eq('id', data.user.id);
            
          const updateTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Update timeout')), 3000)
          );
          
          await Promise.race([updatePromise, updateTimeoutPromise]);
        } catch (updateError: any) {
        }
      }

      toast.success('Welcome back!')
    } catch (error: any) {
      console.error('Sign in error:', error)
      const authError = error as AuthError
      
      if (authError.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password')
      } else if (authError.message?.includes('Email not confirmed')) {
        toast.error('Please verify your email before signing in')
      } else {
        toast.error(authError.message || 'Failed to sign in')
      }
      
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setProfile(null)
      setSession(null)
      
      toast.success('Signed out successfully')
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message || 'Failed to sign out')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const baseUrl = window.location.origin;
      const redirectUrl = `${baseUrl}/auth/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      })

      if (error) throw error
      
      toast.success('Password reset email sent')
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message || 'Failed to send reset email')
      throw error
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      
      toast.success('Password updated successfully')
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message || 'Failed to update password')
      throw error
    }
  }

  const resendVerification = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      
      toast.success('Verification email sent')
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message || 'Failed to resend verification email')
      throw error
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    resendVerification,
    createProfileForCurrentUser,
    checkDatabaseSetup,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
