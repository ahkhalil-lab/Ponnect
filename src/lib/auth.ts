import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { prisma } from './prisma'

// Role constants
export const ROLES = {
    USER: 'USER',
    EXPERT: 'EXPERT',
    MODERATOR: 'MODERATOR',
    ADMIN: 'ADMIN',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

// Expert type constants
export const EXPERT_TYPES = {
    VET: 'VET',
    TRAINER: 'TRAINER',
    NUTRITIONIST: 'NUTRITIONIST',
    BEHAVIORIST: 'BEHAVIORIST',
} as const

export type ExpertType = (typeof EXPERT_TYPES)[keyof typeof EXPERT_TYPES]

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'ponnect-secret-key-change-in-production'
)

export interface AuthUser {
    id: string
    email: string
    name: string
    bio: string | null
    location: string | null
    avatar: string | null
    role: string
    expertType: string | null
    credentials: string | null
    isVerified: boolean
    isEmailVerified: boolean
    createdAt: Date
}

/**
 * Get the currently authenticated user from JWT cookie
 * Returns null if not authenticated or token is invalid
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth_token')?.value

        if (!token) {
            return null
        }

        const { payload } = await jwtVerify(token, JWT_SECRET)
        const userId = payload.userId as string

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                bio: true,
                location: true,
                avatar: true,
                role: true,
                expertType: true,
                credentials: true,
                isVerified: true,
                isEmailVerified: true,
                createdAt: true,
            },
        })

        return user
    } catch {
        return null
    }
}

/**
 * Require authentication - throws if not authenticated
 * Use in API routes that require auth
 */
export async function requireAuth(): Promise<AuthUser> {
    const user = await getCurrentUser()
    if (!user) {
        throw new Error('Authentication required')
    }
    return user
}

/**
 * Check if user has the required role
 */
export function hasRole(user: AuthUser, requiredRole: Role): boolean {
    const roleHierarchy: Record<Role, number> = {
        USER: 0,
        EXPERT: 1,
        MODERATOR: 2,
        ADMIN: 3,
    }

    const userLevel = roleHierarchy[user.role as Role] ?? 0
    const requiredLevel = roleHierarchy[requiredRole]

    return userLevel >= requiredLevel
}

/**
 * Check if user is an expert (any type)
 */
export function isExpert(user: AuthUser): boolean {
    return user.role === ROLES.EXPERT || user.role === ROLES.ADMIN
}

/**
 * Check if user is verified expert
 */
export function isVerifiedExpert(user: AuthUser): boolean {
    return isExpert(user) && user.isVerified
}

/**
 * Check if user can moderate content
 */
export function canModerate(user: AuthUser): boolean {
    return hasRole(user, ROLES.MODERATOR)
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthUser): boolean {
    return user.role === ROLES.ADMIN
}
