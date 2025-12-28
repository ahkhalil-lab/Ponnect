// User types
export interface User {
    id: string
    email: string
    name: string
    bio?: string | null
    location?: string | null
    avatar?: string | null
    role: UserRole
    expertType?: ExpertType | null
    credentials?: string | null
    isVerified: boolean
    isEmailVerified: boolean
    createdAt: Date
    updatedAt: Date
}

export type UserRole = 'USER' | 'EXPERT' | 'MODERATOR' | 'ADMIN'
export type ExpertType = 'VET' | 'TRAINER' | 'NUTRITIONIST'

export interface UserPublic {
    id: string
    name: string
    bio?: string | null
    location?: string | null
    avatar?: string | null
    role: UserRole
    expertType?: ExpertType | null
    isVerified: boolean
}

// Dog types
export interface Dog {
    id: string
    name: string
    breed: string
    birthDate?: Date | null
    gender: DogGender
    weight?: number | null
    bio?: string | null
    photo?: string | null
    ownerId: string
    createdAt: Date
    updatedAt: Date
}

export type DogGender = 'MALE' | 'FEMALE' | 'UNKNOWN'

export interface DogPublic {
    id: string
    name: string
    breed: string
    birthDate?: Date | null
    gender: DogGender
    photo?: string | null
    bio?: string | null
}

// Health Record types
export interface HealthRecord {
    id: string
    dogId: string
    type: HealthRecordType
    title: string
    description?: string | null
    date: Date
    dueDate?: Date | null
    frequency?: RecordFrequency | null
    dosage?: string | null
    vetClinic?: string | null
    notes?: string | null
    isCompleted: boolean
    createdAt: Date
    updatedAt: Date
}

export type HealthRecordType = 'VACCINATION' | 'MEDICATION' | 'VET_VISIT' | 'CONDITION' | 'WEIGHT' | 'OTHER'
export type RecordFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY'

// Forum types
export interface ForumCategory {
    id: string
    name: string
    description?: string | null
    slug: string
    icon?: string | null
    order: number
    color?: string | null
}

export interface ForumPost {
    id: string
    title: string
    content: string
    images?: string[]
    authorId: string
    author?: UserPublic
    categoryId: string
    category?: ForumCategory
    viewCount: number
    upvoteCount?: number
    commentCount?: number
    isPinned: boolean
    isClosed: boolean
    isDeleted: boolean
    createdAt: Date
    updatedAt: Date
}

export interface Comment {
    id: string
    content: string
    authorId: string
    author?: UserPublic
    postId: string
    parentId?: string | null
    upvoteCount?: number
    isDeleted: boolean
    createdAt: Date
    updatedAt: Date
    replies?: Comment[]
}

// Event types
export interface Event {
    id: string
    title: string
    description: string
    category: EventCategory
    date: Date
    endDate?: Date | null
    location: string
    address?: string | null
    latitude?: number | null
    longitude?: number | null
    capacity?: number | null
    isOffLeash: boolean
    requiresTicket: boolean
    ticketUrl?: string | null
    imageUrl?: string | null
    creatorId: string
    creator?: UserPublic
    isApproved: boolean
    isCancelled: boolean
    rsvpCount?: number
    userRsvpStatus?: RSVPStatus | null
    createdAt: Date
    updatedAt: Date
}

export type EventCategory = 'MEETUP' | 'TRAINING' | 'COMPETITION' | 'CHARITY' | 'SOCIAL' | 'OTHER'

export interface EventRSVP {
    id: string
    userId: string
    eventId: string
    status: RSVPStatus
    dogsCount: number
    createdAt: Date
    updatedAt: Date
}

export type RSVPStatus = 'GOING' | 'INTERESTED' | 'MAYBE'

// Expert Q&A types
export interface ExpertQuestion {
    id: string
    title: string
    content: string
    category: QuestionCategory
    images?: string[]
    authorId: string
    author?: UserPublic
    isPublic: boolean
    isPremium: boolean
    status: QuestionStatus
    answerCount?: number
    createdAt: Date
    updatedAt: Date
}

export type QuestionCategory = 'HEALTH' | 'TRAINING' | 'NUTRITION' | 'BEHAVIOR'
export type QuestionStatus = 'PENDING' | 'ANSWERED' | 'CLOSED'

export interface ExpertAnswer {
    id: string
    content: string
    questionId: string
    expertId: string
    expert?: UserPublic
    isAccepted: boolean
    helpfulCount: number
    createdAt: Date
    updatedAt: Date
}

// Notification types
export interface Notification {
    id: string
    userId: string
    type: NotificationType
    title: string
    message: string
    link?: string | null
    isRead: boolean
    createdAt: Date
}

export type NotificationType = 'FORUM_REPLY' | 'UPVOTE' | 'EVENT_REMINDER' | 'HEALTH_REMINDER' | 'EXPERT_ANSWER' | 'SYSTEM'

// Regional Alert types
export interface RegionalAlert {
    id: string
    title: string
    message: string
    region: AustralianState
    severity: AlertSeverity
    type: AlertType
    activeFrom: Date
    activeUntil?: Date | null
    isActive: boolean
    createdAt: Date
}

export type AustralianState = 'QLD' | 'NSW' | 'VIC' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT'
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL'
export type AlertType = 'TICK' | 'SNAKE' | 'HEATWAVE' | 'DISEASE' | 'OTHER'

// API Response types
export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface PaginatedResponse<T> {
    items: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

// Auth types
export interface LoginCredentials {
    email: string
    password: string
}

export interface RegisterData {
    email: string
    password: string
    name: string
    location?: string
}

export interface Session {
    user: User
    expires: Date
}
