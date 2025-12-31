'use client'

import { useEffect, useState, use, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface Expert {
    id: string
    name: string
    avatar: string | null
    role: string
    expertType: string | null
    isVerified: boolean
}

interface Answer {
    id: string
    content: string
    isAccepted: boolean
    helpfulCount: number
    createdAt: string
    expert: Expert
    isAiGenerated: boolean
    aiValidatedBy: string | null
    aiValidatedAt: string | null
}

interface QuestionDog {
    id: string
    dog: {
        id: string
        name: string
        breed: string
        photo: string | null
    }
}

interface Question {
    id: string
    title: string
    content: string
    category: string
    status: string
    isPublic: boolean
    createdAt: string
    author: {
        id: string
        name: string
        avatar: string | null
    }
    answers: Answer[]
    dogs: QuestionDog[]
    _count: {
        answers: number
    }
}

interface CurrentUser {
    id: string
    name: string
    role: string
    expertType: string | null
    isVerified: boolean
}

interface Props {
    params: Promise<{ id: string }>
}

export default function QuestionDetailPage({ params }: Props) {
    const { id } = use(params)
    const router = useRouter()
    const [question, setQuestion] = useState<Question | null>(null)
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [newAnswer, setNewAnswer] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isGeneratingAI, setIsGeneratingAI] = useState(false)
    const [validatingAnswerId, setValidatingAnswerId] = useState<string | null>(null)

    // Ref to prevent duplicate AI generation triggers
    const aiGenerationTriggered = useRef(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [questionRes, authRes] = await Promise.all([
                    fetch(`/api/expert-qa/questions/${id}`),
                    fetch('/api/auth/me'),
                ])

                const questionData = await questionRes.json()
                const authData = await authRes.json()

                if (questionData.success) {
                    setQuestion(questionData.data)

                    // Trigger AI answer generation if no answers exist
                    const hasAnswers = questionData.data.answers && questionData.data.answers.length > 0
                    const questionStatus = questionData.data.status
                    if (!hasAnswers && questionStatus !== 'CLOSED') {
                        triggerAIAnswer(questionData.data.id)
                    }
                } else {
                    router.push('/expert-qa')
                    return
                }

                if (authData.success) {
                    setCurrentUser({
                        id: authData.data.id,
                        name: authData.data.name,
                        role: authData.data.role,
                        expertType: authData.data.expertType,
                        isVerified: authData.data.isVerified,
                    })
                }
            } catch (error) {
                console.error('Failed to fetch question:', error)
            } finally {
                setIsLoading(false)
            }
        }

        const triggerAIAnswer = async (questionId: string) => {
            // Prevent duplicate triggers using ref
            if (aiGenerationTriggered.current) {
                return
            }
            aiGenerationTriggered.current = true

            setIsGeneratingAI(true)
            try {
                const res = await fetch(`/api/expert-qa/questions/${questionId}/ai-answer`, {
                    method: 'POST',
                })
                const data = await res.json()
                if (data.success && data.data) {
                    // Refresh question to get the new AI answer
                    const refreshRes = await fetch(`/api/expert-qa/questions/${questionId}`)
                    const refreshData = await refreshRes.json()
                    if (refreshData.success) {
                        setQuestion(refreshData.data)
                    }
                }
            } catch (error) {
                console.error('Failed to generate AI answer:', error)
            } finally {
                setIsGeneratingAI(false)
            }
        }

        fetchData()
    }, [id, router])

    const isExpert = currentUser && (
        (currentUser.role === 'EXPERT' && currentUser.isVerified) ||
        currentUser.role === 'ADMIN'
    )
    const isAuthor = currentUser && question?.author.id === currentUser.id

    const handleSubmitAnswer = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newAnswer.trim() || !isExpert) return

        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/expert-qa/questions/${id}/answers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newAnswer.trim() }),
            })

            const data = await res.json()
            if (data.success && question) {
                setQuestion({
                    ...question,
                    answers: [...question.answers, data.data],
                    status: 'ANSWERED',
                    _count: { answers: question._count.answers + 1 },
                })
                setNewAnswer('')
            }
        } catch (error) {
            console.error('Answer submit error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAcceptAnswer = async (answerId: string) => {
        if (!isAuthor) return

        try {
            const res = await fetch(`/api/expert-qa/answers/${answerId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isAccepted: true }),
            })

            const data = await res.json()
            if (data.success && question) {
                setQuestion({
                    ...question,
                    answers: question.answers.map(a => ({
                        ...a,
                        isAccepted: a.id === answerId,
                    })),
                })
            }
        } catch (error) {
            console.error('Accept answer error:', error)
        }
    }

    const handleHelpful = async (answerId: string, helpful: boolean) => {
        if (!currentUser) return

        try {
            const res = await fetch(`/api/expert-qa/answers/${answerId}/helpful`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ helpful }),
            })

            const data = await res.json()
            if (data.success && question) {
                setQuestion({
                    ...question,
                    answers: question.answers.map(a =>
                        a.id === answerId
                            ? { ...a, helpfulCount: data.data.helpfulCount }
                            : a
                    ),
                })
            }
        } catch (error) {
            console.error('Helpful vote error:', error)
        }
    }

    const handleCloseQuestion = async () => {
        if (!isAuthor) return

        try {
            const res = await fetch(`/api/expert-qa/questions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CLOSED' }),
            })

            const data = await res.json()
            if (data.success && question) {
                setQuestion({ ...question, status: 'CLOSED' })
            }
        } catch (error) {
            console.error('Close question error:', error)
        }
    }

    const handleValidateAIAnswer = async (answerId: string) => {
        if (!isExpert) return

        setValidatingAnswerId(answerId)
        try {
            const res = await fetch(`/api/expert-qa/answers/${answerId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ validateAiAnswer: true }),
            })

            const data = await res.json()
            if (data.success && question && currentUser) {
                setQuestion({
                    ...question,
                    answers: question.answers.map(a =>
                        a.id === answerId
                            ? { ...a, aiValidatedBy: currentUser.id, aiValidatedAt: new Date().toISOString() }
                            : a
                    ),
                })
            }
        } catch (error) {
            console.error('Validate AI answer error:', error)
        } finally {
            setValidatingAnswerId(null)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-AU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    const getCategoryIcon = (cat: string) => {
        const icons: Record<string, string> = {
            HEALTH: '🏥',
            TRAINING: '🎓',
            NUTRITION: '🍖',
            BEHAVIOR: '🧠',
        }
        return icons[cat] || '📋'
    }

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading question...</p>
            </div>
        )
    }

    if (!question) {
        return (
            <div className={styles.notFound}>
                <h2>Question not found</h2>
                <Link href="/expert-qa" className="btn btn-primary">Back to Q&A</Link>
            </div>
        )
    }

    const acceptedAnswer = question.answers.find(a => a.isAccepted)
    const otherAnswers = question.answers.filter(a => !a.isAccepted)

    return (
        <div className={styles.page}>
            {/* Breadcrumb */}
            <nav className={styles.breadcrumb}>
                <Link href="/expert-qa">Expert Q&A</Link>
                <span className={styles.separator}>/</span>
                <span>{question.category}</span>
            </nav>

            {/* Question */}
            <article className={`card ${styles.questionCard}`}>
                <div className={styles.questionHeader}>
                    <span className={styles.categoryBadge}>
                        {getCategoryIcon(question.category)} {question.category}
                    </span>
                    {question.status === 'CLOSED' && (
                        <span className={`badge ${styles.closedBadge}`}>🔒 Closed</span>
                    )}
                    {question.status === 'ANSWERED' && (
                        <span className={`badge badge-success`}>✓ Answered</span>
                    )}
                </div>

                <h1 className={styles.questionTitle}>{question.title}</h1>

                <div className={styles.questionMeta}>
                    <div className={styles.author}>
                        <div className={`avatar avatar-sm ${styles.avatar}`}>
                            {question.author.avatar ? (
                                <img src={question.author.avatar} alt={question.author.name} />
                            ) : (
                                question.author.name[0]?.toUpperCase()
                            )}
                        </div>
                        <span>{question.author.name}</span>
                        <span className={styles.date}>asked on {formatDate(question.createdAt)}</span>
                    </div>
                </div>

                <div className={styles.questionContent}>
                    {question.content.split('\n').map((p, i) => (
                        <p key={i}>{p}</p>
                    ))}
                </div>

                {/* Related Dogs */}
                {question.dogs && question.dogs.length > 0 && (
                    <div className={styles.relatedDogs}>
                        <span className={styles.relatedDogsLabel}>🐕 Related to:</span>
                        <div className={styles.dogTags}>
                            {question.dogs.map((qd) => (
                                <Link key={qd.id} href={`/dogs/${qd.dog.id}`} className={styles.dogTag}>
                                    {qd.dog.photo ? (
                                        <img src={qd.dog.photo} alt={qd.dog.name} className={styles.dogTagPhoto} />
                                    ) : (
                                        <span className={styles.dogTagPhoto}>🐕</span>
                                    )}
                                    <span className={styles.dogTagName}>{qd.dog.name}</span>
                                    <span className={styles.dogTagBreed}>({qd.dog.breed})</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {isAuthor && question.status !== 'CLOSED' && (
                    <div className={styles.questionActions}>
                        <button
                            onClick={handleCloseQuestion}
                            className="btn btn-sm btn-ghost"
                        >
                            🔒 Close Question
                        </button>
                    </div>
                )}
            </article>

            {/* Answers Section */}
            <section className={styles.answersSection}>
                <h2>{question._count.answers} Answer{question._count.answers !== 1 ? 's' : ''}</h2>

                {/* AI Generating Indicator */}
                {isGeneratingAI && (
                    <div className={`card ${styles.aiGenerating}`}>
                        <div className="spinner spinner-sm"></div>
                        <p>🤖 Generating AI preliminary answer...</p>
                    </div>
                )}

                {/* Accepted Answer First */}
                {acceptedAnswer && (
                    <div className={`card ${styles.answerCard} ${styles.accepted} ${acceptedAnswer.isAiGenerated ? styles.aiAnswer : ''}`}>
                        <div className={styles.acceptedBadge}>✓ Accepted Answer</div>
                        {acceptedAnswer.isAiGenerated && (
                            <div className={styles.aiBadgeContainer}>
                                <span className={styles.aiBadge}>🤖 AI-Generated</span>
                                {acceptedAnswer.aiValidatedBy ? (
                                    <span className={styles.endorsedBadge}>✓ Expert Endorsed</span>
                                ) : (
                                    <span className={styles.pendingEndorsement}>⏳ Expert endorsement pending</span>
                                )}
                            </div>
                        )}
                        <AnswerContent
                            answer={acceptedAnswer}
                            isAuthor={isAuthor}
                            isExpert={isExpert}
                            currentUser={currentUser}
                            onAccept={handleAcceptAnswer}
                            onHelpful={handleHelpful}
                            onValidateAI={handleValidateAIAnswer}
                            isValidating={validatingAnswerId === acceptedAnswer.id}
                            formatDate={formatDate}
                        />
                    </div>
                )}

                {/* Other Answers */}
                {otherAnswers.map((answer) => (
                    <div key={answer.id} className={`card ${styles.answerCard} ${answer.isAiGenerated ? styles.aiAnswer : ''}`}>
                        {answer.isAiGenerated && (
                            <div className={styles.aiBadgeContainer}>
                                <span className={styles.aiBadge}>🤖 AI-Generated Preliminary Answer</span>
                                {answer.aiValidatedBy ? (
                                    <span className={styles.endorsedBadge}>✓ Expert Endorsed</span>
                                ) : (
                                    <span className={styles.pendingEndorsement}>⏳ Expert endorsement pending</span>
                                )}
                            </div>
                        )}
                        <AnswerContent
                            answer={answer}
                            isAuthor={isAuthor}
                            isExpert={isExpert}
                            currentUser={currentUser}
                            onAccept={handleAcceptAnswer}
                            onHelpful={handleHelpful}
                            onValidateAI={handleValidateAIAnswer}
                            isValidating={validatingAnswerId === answer.id}
                            formatDate={formatDate}
                        />
                    </div>
                ))}

                {/* No Answers Yet */}
                {question.answers.length === 0 && !isGeneratingAI && (
                    <div className={`card ${styles.noAnswers}`}>
                        <p>No answers yet. {isExpert ? 'Be the first expert to answer!' : 'Check back soon for expert responses.'}</p>
                    </div>
                )}

                {/* Expert Answer Form */}
                {isExpert && question.status !== 'CLOSED' && (
                    <form onSubmit={handleSubmitAnswer} className={`card ${styles.answerForm}`}>
                        <h3>Your Expert Answer</h3>
                        <textarea
                            value={newAnswer}
                            onChange={(e) => setNewAnswer(e.target.value)}
                            placeholder="Provide your professional advice..."
                            className={`input ${styles.answerInput}`}
                            rows={6}
                        />
                        <div className={styles.formActions}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting || !newAnswer.trim()}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                            </button>
                        </div>
                    </form>
                )}

                {!isExpert && question.status !== 'CLOSED' && question.answers.length === 0 && (
                    <div className={`card ${styles.waitingNote}`}>
                        <p>⏳ Our verified experts will review your question soon.</p>
                    </div>
                )}
            </section>
        </div>
    )
}

function AnswerContent({
    answer,
    isAuthor,
    isExpert,
    currentUser,
    onAccept,
    onHelpful,
    onValidateAI,
    isValidating,
    formatDate,
}: {
    answer: Answer
    isAuthor: boolean | undefined
    isExpert: boolean | undefined
    currentUser: CurrentUser | null
    onAccept: (id: string) => void
    onHelpful: (id: string, helpful: boolean) => void
    onValidateAI: (id: string) => void
    isValidating: boolean
    formatDate: (date: string) => string
}) {
    return (
        <>
            <div className={styles.answerHeader}>
                <div className={styles.expertInfo}>
                    <div className={`avatar avatar-md ${styles.avatar}`}>
                        {answer.expert.avatar ? (
                            <img src={answer.expert.avatar} alt={answer.expert.name} />
                        ) : (
                            answer.expert.name[0]?.toUpperCase()
                        )}
                    </div>
                    <div>
                        <div className={styles.expertName}>
                            {answer.expert.name}
                            {answer.expert.isVerified && (
                                <span className={`badge badge-expert ${styles.expertBadge}`}>
                                    ✓ {answer.expert.expertType}
                                </span>
                            )}
                        </div>
                        <span className={styles.answerDate}>{formatDate(answer.createdAt)}</span>
                    </div>
                </div>
            </div>

            <div className={styles.answerContent}>
                {answer.content.split('\n').map((p, i) => (
                    <p key={i}>{p}</p>
                ))}
            </div>

            {/* AI Disclaimer */}
            {answer.isAiGenerated && (
                <div className={styles.aiDisclaimer}>
                    <span>⚠️</span>
                    <span>This is an AI-generated preliminary answer. For critical health concerns, always consult a qualified veterinarian.</span>
                </div>
            )}

            <div className={styles.answerActions}>
                <button
                    onClick={() => onHelpful(answer.id, true)}
                    className="btn btn-sm btn-ghost"
                    disabled={!currentUser}
                >
                    👍 Helpful ({answer.helpfulCount})
                </button>
                {isAuthor && !answer.isAccepted && (
                    <button
                        onClick={() => onAccept(answer.id)}
                        className="btn btn-sm btn-outline"
                    >
                        ✓ Accept Answer
                    </button>
                )}
                {/* Expert can endorse AI answers */}
                {isExpert && answer.isAiGenerated && !answer.aiValidatedBy && (
                    <button
                        onClick={() => onValidateAI(answer.id)}
                        className={`btn btn-sm btn-success ${styles.endorseButton}`}
                        disabled={isValidating}
                    >
                        {isValidating ? 'Endorsing...' : '✓ Endorse This Answer'}
                    </button>
                )}
            </div>
        </>
    )
}

