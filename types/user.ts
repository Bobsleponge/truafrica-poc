import { UserRole } from './database'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  name: string | null
}

export interface ContributorProfile {
  name: string
  country: string
  languages: string[]
  expertise_fields: string[]
  trust_score: number
  onboarding_completed: boolean
}

export interface ClientProfile {
  name: string
  country: string
  client_id?: string | null
}

