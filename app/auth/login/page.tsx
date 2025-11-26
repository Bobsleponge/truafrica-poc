'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleLogin = async (emailToUse?: string, passwordToUse?: string) => {
    const loginEmail = emailToUse || email
    const loginPassword = passwordToUse || password

    if (!loginEmail || !loginPassword) {
      setError('Email and password are required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (signInError) throw signInError

      if (data.user) {
        // Get user role from database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (userError) throw userError

        // Redirect based on role
        if (userData.role === 'contributor') {
          router.push('/contributor/dashboard')
        } else if (userData.role === 'client_owner' || userData.role === 'client_user') {
          router.push('/client/dashboard')
        } else if (userData.role === 'team_account') {
          router.push('/team/dashboard')
        } else if (userData.role === 'admin') {
          router.push('/admin/dashboard')
        } else if (userData.role === 'platform_admin') {
          // Platform admins should use admin portal, not main app
          setError('Platform admins must use the admin portal at admin.truafrica.ai')
          return
        } else {
          router.push('/')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleLogin()
  }

  // Dev: Auto-login as existing user by role (or create if doesn't exist)
  const handleDevLoginByRole = async (role: 'contributor' | 'company' | 'admin') => {
    const devEmail = role === 'contributor' 
      ? 'contributor@example.com' 
      : role === 'company' 
      ? 'company@example.com'
      : 'admin@example.com'
    const devPassword = 'dev123456'
    
    setLoading(true)
    setError(null)

    try {
      console.log(`Attempting to login as ${role}...`)
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing')

      // First, try to login
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: devEmail,
        password: devPassword,
      })

      if (loginError) {
        console.log('Login failed:', loginError.message)
        
        // If login fails, try to create the user
        if (loginError.message.includes('Invalid login credentials') || 
            loginError.message.includes('User not found') ||
            loginError.message.includes('Invalid login')) {
          console.log('User does not exist, creating...')
          
          // Create the user
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: devEmail,
            password: devPassword,
          })

          if (signUpError) {
            console.error('Signup error:', signUpError)
            throw new Error(`Failed to create user: ${signUpError.message}`)
          }

          if (!signUpData.user) {
            throw new Error('User creation succeeded but no user returned. Check email confirmation settings.')
          }

          console.log('User created, creating profile...')
          
          // Create user profile based on role
          const profileData = role === 'contributor' 
            ? {
                id: signUpData.user.id,
                email: devEmail,
                role: 'contributor',
                name: 'Test Contributor',
                country: 'Nigeria',
                languages: ['English', 'Hausa'],
                expertise_fields: ['Technology', 'Education'],
                trust_score: 75,
                onboarding_completed: true,
              }
            : role === 'company'
            ? {
                id: signUpData.user.id,
                email: devEmail,
                role: 'company',
                name: 'Test Company',
                country: 'South Africa',
                languages: [],
                expertise_fields: [],
                trust_score: null,
                onboarding_completed: false,
              }
            : {
                id: signUpData.user.id,
                email: devEmail,
                role: 'admin',
                name: 'Test Admin',
                country: 'South Africa',
                languages: [],
                expertise_fields: [],
                trust_score: null,
                onboarding_completed: false,
              }
          
          const { error: profileError } = await supabase
            .from('users')
            .insert(profileData)

          if (profileError) {
            console.error('Profile creation error:', profileError)
            throw new Error(`Failed to create profile: ${profileError.message}`)
          }

          console.log('Profile created, attempting login...')

          // Wait a moment for the user to be ready
          await new Promise(resolve => setTimeout(resolve, 500))

          // Now try to login again
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email: devEmail,
            password: devPassword,
          })

          if (retryError) {
            console.error('Retry login error:', retryError)
            throw new Error(`Login after signup failed: ${retryError.message}. You may need to disable email confirmation in Supabase.`)
          }
          
          if (retryData.user) {
            console.log('Login successful, redirecting...')
            if (role === 'contributor') {
              router.push('/contributor/dashboard')
            } else if (role === 'company') {
              router.push('/company/dashboard')
            } else {
              router.push('/admin/dashboard')
            }
            return
          }
        } else {
          throw loginError
        }
      } else if (loginData?.user) {
        console.log('Login successful, checking role...')
        
        // Login successful, redirect
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', loginData.user.id)
          .single()

        if (userError) {
          console.error('Error fetching user data:', userError)
          // Still redirect based on expected role
          if (role === 'contributor') {
            router.push('/contributor/dashboard')
          } else if (role === 'company') {
            router.push('/company/dashboard')
          } else {
            router.push('/admin/dashboard')
          }
          return
        }

        if (userData?.role === 'contributor') {
          router.push('/contributor/dashboard')
        } else if (userData?.role === 'company') {
          router.push('/company/dashboard')
        } else if (userData?.role === 'admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/')
        }
      } else {
        throw new Error('Login succeeded but no user data returned')
      }
    } catch (err: any) {
      let errorMessage = err.message || 'Failed to login. Make sure Supabase is configured correctly.'
      
      // Check for network errors
      if (err.message?.includes('Failed to fetch') || err.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        errorMessage = 'Cannot connect to Supabase. Please check:\n1. Your Supabase project is active (not paused)\n2. The Supabase URL in .env.local is correct\n3. Your internet connection is working'
      }
      
      setError(errorMessage)
      console.error('Login error:', err)
      alert(`Error: ${errorMessage}\n\nCheck the browser console for details.`)
    } finally {
      setLoading(false)
    }
  }

  // Dev: Create new user of specific role and login
  const handleDevCreateNew = async (role: 'contributor' | 'company') => {
    setLoading(true)
    setError(null)

    try {
      console.log(`Creating new ${role} user...`)
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing')

      // Generate unique email
      const timestamp = Date.now()
      const newEmail = `${role}-${timestamp}@example.com`
      const newPassword = 'dev123456'

      console.log(`Creating ${role} user: ${newEmail}`)

      // Sign up new user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
      })

      if (signUpError) {
        console.error('Signup error:', signUpError)
        throw new Error(`Failed to create user: ${signUpError.message}`)
      }

      if (!authData.user) {
        throw new Error('User creation succeeded but no user returned. Check email confirmation settings in Supabase.')
      }

      console.log('User created, creating profile...')

      // Create user profile based on role
      const profileData = role === 'contributor'
        ? {
            id: authData.user.id,
            email: newEmail,
            role: 'contributor',
            name: `Dev Contributor ${timestamp}`,
            country: 'Nigeria',
            languages: ['English'],
            expertise_fields: ['Technology'],
            trust_score: 50,
            onboarding_completed: true,
          }
        : role === 'company'
        ? {
            id: authData.user.id,
            email: newEmail,
            role: 'company',
            name: `Dev Company ${timestamp}`,
            country: 'South Africa',
            languages: [],
            expertise_fields: [],
            trust_score: null,
            onboarding_completed: false,
          }
        : {
            id: authData.user.id,
            email: newEmail,
            role: 'admin',
            name: `Dev Admin ${timestamp}`,
            country: 'South Africa',
            languages: [],
            expertise_fields: [],
            trust_score: null,
            onboarding_completed: false,
          }

      const { error: profileError } = await supabase
        .from('users')
        .insert(profileData)

      if (profileError) {
        console.error('Profile creation error:', profileError)
        throw new Error(`Failed to create profile: ${profileError.message}`)
      }

      console.log('Profile created, logging in...')

      // Wait a moment for the user to be ready
      await new Promise(resolve => setTimeout(resolve, 500))

      // Auto-login after signup
      await handleLogin(newEmail, newPassword)
    } catch (err: any) {
      let errorMessage = err.message || 'An error occurred creating new user'
      
      // Check for network errors
      if (err.message?.includes('Failed to fetch') || err.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        errorMessage = 'Cannot connect to Supabase. Please check:\n1. Your Supabase project is active (not paused)\n2. The Supabase URL in .env.local is correct\n3. Your internet connection is working'
      }
      
      setError(errorMessage)
      console.error('Create user error:', err)
      alert(`Error: ${errorMessage}\n\nCheck the browser console for details.`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md" floating>
        <CardHeader className="gradient-primary rounded-t-xl -mx-6 -mt-6 mb-6 px-6 py-4 text-center">
          <CardTitle className="text-3xl font-bold text-white">TruAfrica</CardTitle>
          <CardDescription className="text-white/90">Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Dev Quick Login Buttons - Always show in dev */}
          {true && (
            <div className="mb-6 p-4 border border-accent/30 rounded-lg bg-accent/5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-accent" />
                <Label className="text-sm font-medium text-accent">Dev Quick Login</Label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {/* Contributor Section */}
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDevLoginByRole('contributor')}
                    disabled={loading}
                    className="w-full"
                  >
                    Login as Contributor
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDevCreateNew('contributor')}
                    disabled={loading}
                    className="w-full text-xs"
                  >
                    Create New Contributor
                  </Button>
                </div>
                {/* Company Section */}
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDevLoginByRole('company')}
                    disabled={loading}
                    className="w-full"
                  >
                    Login as Company
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDevCreateNew('company')}
                    disabled={loading}
                    className="w-full text-xs"
                  >
                    Create New Company
                  </Button>
                </div>
                {/* Admin Section */}
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDevLoginByRole('admin')}
                    disabled={loading}
                    className="w-full"
                  >
                    Login as Admin
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDevCreateNew('admin')}
                    disabled={loading}
                    className="w-full text-xs"
                  >
                    Create New Admin
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Existing: contributor@example.com | company@example.com | admin@example.com
              </p>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" variant="gradient" size="lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/auth/signup" className="text-accent hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

