'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { UserRole } from '@/types/database'

const AFRICAN_COUNTRIES = [
  'Nigeria', 'South Africa', 'Kenya', 'Ghana', 'Ethiopia', 'Tanzania', 'Uganda',
  'Algeria', 'Morocco', 'Angola', 'Sudan', 'Mozambique', 'Madagascar', 'Cameroon',
  'Ivory Coast', 'Niger', 'Burkina Faso', 'Mali', 'Malawi', 'Zambia', 'Senegal',
  'Chad', 'Somalia', 'Zimbabwe', 'Guinea', 'Rwanda', 'Benin', 'Burundi', 'Tunisia',
  'South Sudan', 'Togo', 'Sierra Leone', 'Libya', 'Congo', 'Liberia', 'Central African Republic',
  'Mauritania', 'Eritrea', 'Namibia', 'Gambia', 'Botswana', 'Gabon', 'Lesotho',
  'Guinea-Bissau', 'Equatorial Guinea', 'Mauritius', 'Eswatini', 'Djibouti', 'Comoros',
  'Cabo Verde', 'Sao Tome and Principe', 'Seychelles'
]

const LANGUAGES = [
  'English', 'French', 'Arabic', 'Swahili', 'Hausa', 'Yoruba', 'Igbo', 'Amharic',
  'Zulu', 'Xhosa', 'Afrikaans', 'Portuguese', 'Spanish', 'Kinyarwanda', 'Lingala',
  'Wolof', 'Fulani', 'Oromo', 'Somali', 'Tigrinya'
]

const EXPERTISE_FIELDS = [
  'Technology', 'Agriculture', 'Healthcare', 'Education', 'Finance', 'Energy',
  'Transportation', 'Telecommunications', 'Real Estate', 'Tourism'
]

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [role, setRole] = useState<UserRole>('contributor')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [expertiseFields, setExpertiseFields] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam === 'contributor' || roleParam === 'client_owner' || roleParam === 'client_user') {
      setRole(roleParam as UserRole)
    }
  }, [searchParams])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError

      if (authData.user) {
        // Create user profile in database
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            role,
            name: name || null,
            country: country || null,
            languages: languages.length > 0 ? languages : null,
            expertise_fields: role === 'contributor' && expertiseFields.length > 0 ? expertiseFields : null,
            trust_score: role === 'contributor' ? 50 : null,
            onboarding_completed: false,
          })

        if (profileError) throw profileError

        // Redirect based on role
        if (role === 'contributor') {
          router.push('/contributor/onboarding')
        } else if (role === 'client_owner' || role === 'client_user') {
          router.push('/client/dashboard')
        } else {
          router.push('/')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  const toggleLanguage = (lang: string) => {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
  }

  const toggleExpertise = (field: string) => {
    setExpertiseFields(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl" floating>
        <CardHeader className="gradient-primary rounded-t-xl -mx-6 -mt-6 mb-6 px-6 py-4 text-center">
          <CardTitle className="text-3xl font-bold text-white">TruAfrica</CardTitle>
          <CardDescription className="text-white/90">Create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">I am a</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contributor">Contributor</SelectItem>
                  <SelectItem value="client_owner">Client Owner</SelectItem>
                  <SelectItem value="client_user">Client User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name {(role === 'client_owner' || role === 'client_user') && '(Client/Company Name)'}</Label>
              <Input
                id="name"
                type="text"
                placeholder={(role === 'client_owner' || role === 'client_user') ? 'Client/Company Name' : 'Your Name'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {AFRICAN_COUNTRIES.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {role === 'contributor' && (
              <>
                <div className="space-y-2">
                  <Label>Languages Spoken (select all that apply)</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                    {LANGUAGES.map(lang => (
                      <Button
                        key={lang}
                        type="button"
                        variant={languages.includes(lang) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleLanguage(lang)}
                      >
                        {lang}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Areas of Expertise (select all that apply)</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                    {EXPERTISE_FIELDS.map(field => (
                      <Button
                        key={field}
                        type="button"
                        variant={expertiseFields.includes(field) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleExpertise(field)}
                      >
                        {field}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" variant="gradient" size="lg" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/auth/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

