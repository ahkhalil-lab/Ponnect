'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface Author {
    id: string
    name: string
    avatar: string | null
    role: string
    expertType: string | null
    isVerified: boolean
}

interface Comment {
    id: string
    content: string
    parentId: string | null
    createdAt: string
    author: Author
    _count: {
        upvotes: number
    }
    hasUpvoted: boolean
}

interface Post {
    id: string
    title: string
    content: string
    images: string | null
    viewCount: number
    isPinned: boolean
    isClosed: boolean
    createdAt: string
    updatedAt: string
    author: Author
    category: {
        id: string
        slug: string
        name: string
    }
    _count: {
        comments: number
        upvotes: number
    }
    hasUpvoted: boolean
}

interface CurrentUser {
    id: string
    role: string
}

interface Props {
    params: Promise<{ category: string; postId: string }>
}

export default function ThreadPage({ params }: Props) {
    const { category: categorySlug, postId } = use(params)
    const router = useRouter()
    const [post, setPost] = useState<Post | null>(null)
    const [comments, setComments] = useState<Comment[]>([])
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [newComment, setNewComment] = useState('')
    const [replyTo, setReplyTo] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingComment, setEditingComment] = useState<string | null>(null)
    const [editContent, setEditContent] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [postRes, commentsRes, authRes] = await Promise.all([
                    fetch(`/api/forums/posts/${postId}`),
                    fetch(`/api/forums/posts/${postId}/comments`),
                    fetch('/api/auth/me'),
                ])

                const postData = await postRes.json()
                const commentsData = await commentsRes.json()
                const authData = await authRes.json()

                if (postData.success) {
                    setPost(postData.data)
                } else {
                    router.push('/forums')
                    return
                }

                if (commentsData.success) {
                    setComments(commentsData.data)
                }

                if (authData.success) {
                    setCurrentUser({ id: authData.data.id, role: authData.data.role })
                }
            } catch (error) {
                console.error('Failed to fetch thread:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [postId, router])

    const handleUpvotePost = async () => {
        if (!currentUser) {
            router.push('/login')
            return
        }

        try {
            const res = await fetch(`/api/forums/posts/${postId}/upvote`, { method: 'POST' })
            const data = await res.json()
            if (data.success && post) {
                setPost({
                    ...post,
                    hasUpvoted: data.data.upvoted,
                    _count: { ...post._count, upvotes: data.data.count },
                })
            }
        } catch (error) {
            console.error('Upvote error:', error)
        }
    }

    const handleUpvoteComment = async (commentId: string) => {
        if (!currentUser) {
            router.push('/login')
            return
        }

        try {
            const res = await fetch(`/api/forums/comments/${commentId}/upvote`, { method: 'POST' })
            const data = await res.json()
            if (data.success) {
                setComments(comments.map(c =>
                    c.id === commentId
                        ? { ...c, hasUpvoted: data.data.upvoted, _count: { upvotes: data.data.count } }
                        : c
                ))
            }
        } catch (error) {
            console.error('Comment upvote error:', error)
        }
    }

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentUser) {
            router.push('/login')
            return
        }

        if (!newComment.trim()) return

        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/forums/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newComment.trim(),
                    parentId: replyTo,
                }),
            })

            const data = await res.json()
            if (data.success) {
                setComments([...comments, { ...data.data, _count: { upvotes: 0 }, hasUpvoted: false }])
                setNewComment('')
                setReplyTo(null)
                if (post) {
                    setPost({ ...post, _count: { ...post._count, comments: post._count.comments + 1 } })
                }
            }
        } catch (error) {
            console.error('Comment submit error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return

        try {
            const res = await fetch(`/api/forums/comments/${commentId}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) {
                setComments(comments.filter(c => c.id !== commentId))
                if (post) {
                    setPost({ ...post, _count: { ...post._count, comments: post._count.comments - 1 } })
                }
            }
        } catch (error) {
            console.error('Delete comment error:', error)
        }
    }

    const handleEditComment = async (commentId: string) => {
        if (!editContent.trim()) return

        try {
            const res = await fetch(`/api/forums/comments/${commentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editContent.trim() }),
            })
            const data = await res.json()
            if (data.success) {
                setComments(comments.map(c =>
                    c.id === commentId ? { ...c, content: editContent.trim() } : c
                ))
                setEditingComment(null)
                setEditContent('')
            }
        } catch (error) {
            console.error('Edit comment error:', error)
        }
    }

    const handleModeratePost = async (action: 'pin' | 'close' | 'delete') => {
        if (!post) return

        if (action === 'delete') {
            if (!confirm('Are you sure you want to delete this post?')) return
            try {
                await fetch(`/api/forums/posts/${postId}`, { method: 'DELETE' })
                router.push(`/forums/${categorySlug}`)
            } catch (error) {
                console.error('Delete error:', error)
            }
            return
        }

        try {
            const res = await fetch(`/api/forums/posts/${postId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isPinned: action === 'pin' ? !post.isPinned : undefined,
                    isClosed: action === 'close' ? !post.isClosed : undefined,
                }),
            })
            const data = await res.json()
            if (data.success) {
                setPost({ ...post, ...data.data })
            }
        } catch (error) {
            console.error('Moderate error:', error)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-AU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const canModerate = currentUser && (currentUser.role === 'MODERATOR' || currentUser.role === 'ADMIN')
    const isAuthor = currentUser && post?.author.id === currentUser.id

    const getRoleBadge = (author: Author) => {
        if (author.role === 'ADMIN') return <span className={`badge badge-error ${styles.roleBadge}`}>Admin</span>
        if (author.role === 'MODERATOR') return <span className={`badge badge-warning ${styles.roleBadge}`}>Mod</span>
        if (author.role === 'EXPERT' && author.isVerified) {
            return <span className={`badge badge-expert ${styles.roleBadge}`}>✓ {author.expertType}</span>
        }
        return null
    }

    // Organize comments into threads
    const topLevelComments = comments.filter(c => !c.parentId)
    const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId)

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading thread...</p>
            </div>
        )
    }

    if (!post) {
        return (
            <div className={styles.notFound}>
                <h2>Thread not found</h2>
                <Link href="/forums" className="btn btn-primary">Back to Forums</Link>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            {/* Breadcrumb */}
            <nav className={styles.breadcrumb}>
                <Link href="/forums">Forums</Link>
                <span className={styles.separator}>/</span>
                <Link href={`/forums/${categorySlug}`}>{post.category.name}</Link>
                <span className={styles.separator}>/</span>
                <span>Thread</span>
            </nav>

            {/* Post */}
            <article className={`card ${styles.postCard}`}>
                <div className={styles.postHeader}>
                    <div className={styles.postBadges}>
                        {post.isPinned && <span className={styles.pinnedBadge}>📌 Pinned</span>}
                        {post.isClosed && <span className={styles.closedBadge}>🔒 Closed</span>}
                    </div>
                    <h1 className={styles.postTitle}>{post.title}</h1>
                </div>

                <div className={styles.postMeta}>
                    <div className={styles.authorSection}>
                        <div className={`avatar avatar-md ${styles.avatar}`}>
                            {post.author.avatar ? (
                                <img src={post.author.avatar} alt={post.author.name} />
                            ) : (
                                post.author.name[0]?.toUpperCase()
                            )}
                        </div>
                        <div className={styles.authorInfo}>
                            <div className={styles.authorName}>
                                {post.author.name}
                                {getRoleBadge(post.author)}
                            </div>
                            <span className={styles.postTime}>{formatDate(post.createdAt)}</span>
                        </div>
                    </div>
                    <div className={styles.viewCount}>
                        👁 {post.viewCount} views
                    </div>
                </div>

                <div className={styles.postContent}>
                    {post.content.split('\n').map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                    ))}
                </div>

                <div className={styles.postActions}>
                    <button
                        onClick={handleUpvotePost}
                        className={`btn btn-sm ${post.hasUpvoted ? 'btn-primary' : 'btn-ghost'}`}
                    >
                        👍 {post._count.upvotes}
                    </button>
                    <span className={styles.commentCount}>
                        💬 {post._count.comments} comment{post._count.comments !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Moderation Actions */}
                {(canModerate || isAuthor) && (
                    <div className={styles.moderationActions}>
                        {canModerate && (
                            <>
                                <button
                                    onClick={() => handleModeratePost('pin')}
                                    className="btn btn-sm btn-ghost"
                                >
                                    {post.isPinned ? '📌 Unpin' : '📌 Pin'}
                                </button>
                                <button
                                    onClick={() => handleModeratePost('close')}
                                    className="btn btn-sm btn-ghost"
                                >
                                    {post.isClosed ? '🔓 Reopen' : '🔒 Close'}
                                </button>
                            </>
                        )}
                        {(canModerate || isAuthor) && (
                            <button
                                onClick={() => handleModeratePost('delete')}
                                className="btn btn-sm btn-ghost"
                                style={{ color: 'var(--color-error)' }}
                            >
                                🗑 Delete
                            </button>
                        )}
                    </div>
                )}
            </article>

            {/* Comments Section */}
            <section className={styles.commentsSection}>
                <h2>Comments ({comments.length})</h2>

                {topLevelComments.map((comment) => (
                    <div key={comment.id} className={styles.commentThread}>
                        <CommentItem
                            comment={comment}
                            currentUser={currentUser}
                            onUpvote={() => handleUpvoteComment(comment.id)}
                            onReply={() => setReplyTo(comment.id)}
                            onEdit={() => { setEditingComment(comment.id); setEditContent(comment.content) }}
                            onDelete={() => handleDeleteComment(comment.id)}
                            isEditing={editingComment === comment.id}
                            editContent={editContent}
                            setEditContent={setEditContent}
                            onSaveEdit={() => handleEditComment(comment.id)}
                            onCancelEdit={() => { setEditingComment(null); setEditContent('') }}
                            getRoleBadge={getRoleBadge}
                            formatDate={formatDate}
                        />
                        {/* Replies */}
                        {getReplies(comment.id).map((reply) => (
                            <div key={reply.id} className={styles.replyWrapper}>
                                <CommentItem
                                    comment={reply}
                                    currentUser={currentUser}
                                    onUpvote={() => handleUpvoteComment(reply.id)}
                                    onReply={() => setReplyTo(comment.id)}
                                    onEdit={() => { setEditingComment(reply.id); setEditContent(reply.content) }}
                                    onDelete={() => handleDeleteComment(reply.id)}
                                    isEditing={editingComment === reply.id}
                                    editContent={editContent}
                                    setEditContent={setEditContent}
                                    onSaveEdit={() => handleEditComment(reply.id)}
                                    onCancelEdit={() => { setEditingComment(null); setEditContent('') }}
                                    getRoleBadge={getRoleBadge}
                                    formatDate={formatDate}
                                    isReply
                                />
                            </div>
                        ))}
                    </div>
                ))}

                {/* New Comment Form */}
                {!post.isClosed ? (
                    <form onSubmit={handleSubmitComment} className={styles.commentForm}>
                        {replyTo && (
                            <div className={styles.replyingTo}>
                                Replying to comment...
                                <button type="button" onClick={() => setReplyTo(null)} className="btn btn-sm btn-ghost">
                                    Cancel
                                </button>
                            </div>
                        )}
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={currentUser ? "Write a comment..." : "Login to comment"}
                            className={`input ${styles.commentInput}`}
                            disabled={!currentUser}
                            rows={3}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!currentUser || isSubmitting || !newComment.trim()}
                        >
                            {isSubmitting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </form>
                ) : (
                    <div className={styles.closedNotice}>
                        🔒 This thread is closed to new comments.
                    </div>
                )}
            </section>
        </div>
    )
}

// Comment Item Component
function CommentItem({
    comment,
    currentUser,
    onUpvote,
    onReply,
    onEdit,
    onDelete,
    isEditing,
    editContent,
    setEditContent,
    onSaveEdit,
    onCancelEdit,
    getRoleBadge,
    formatDate,
    isReply = false,
}: {
    comment: Comment
    currentUser: CurrentUser | null
    onUpvote: () => void
    onReply: () => void
    onEdit: () => void
    onDelete: () => void
    isEditing: boolean
    editContent: string
    setEditContent: (v: string) => void
    onSaveEdit: () => void
    onCancelEdit: () => void
    getRoleBadge: (author: Author) => React.ReactNode
    formatDate: (date: string) => string
    isReply?: boolean
}) {
    const canEdit = currentUser?.id === comment.author.id
    const canDelete = canEdit || currentUser?.role === 'MODERATOR' || currentUser?.role === 'ADMIN'

    return (
        <div className={`${styles.comment} ${isReply ? styles.reply : ''}`}>
            <div className={styles.commentHeader}>
                <div className={styles.commentAuthor}>
                    <div className={`avatar avatar-sm ${styles.avatar}`}>
                        {comment.author.avatar ? (
                            <img src={comment.author.avatar} alt={comment.author.name} />
                        ) : (
                            comment.author.name[0]?.toUpperCase()
                        )}
                    </div>
                    <span className={styles.authorName}>
                        {comment.author.name}
                        {getRoleBadge(comment.author)}
                    </span>
                    <span className={styles.commentTime}>{formatDate(comment.createdAt)}</span>
                </div>
            </div>

            {isEditing ? (
                <div className={styles.editForm}>
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className={`input ${styles.editInput}`}
                        rows={3}
                    />
                    <div className={styles.editActions}>
                        <button onClick={onCancelEdit} className="btn btn-sm btn-ghost">Cancel</button>
                        <button onClick={onSaveEdit} className="btn btn-sm btn-primary">Save</button>
                    </div>
                </div>
            ) : (
                <div className={styles.commentContent}>
                    {comment.content.split('\n').map((p, i) => <p key={i}>{p}</p>)}
                </div>
            )}

            <div className={styles.commentActions}>
                <button
                    onClick={onUpvote}
                    className={`btn btn-sm ${comment.hasUpvoted ? 'btn-primary' : 'btn-ghost'}`}
                >
                    👍 {comment._count.upvotes}
                </button>
                {!isReply && currentUser && (
                    <button onClick={onReply} className="btn btn-sm btn-ghost">
                        Reply
                    </button>
                )}
                {canEdit && !isEditing && (
                    <button onClick={onEdit} className="btn btn-sm btn-ghost">
                        Edit
                    </button>
                )}
                {canDelete && (
                    <button onClick={onDelete} className="btn btn-sm btn-ghost" style={{ color: 'var(--color-error)' }}>
                        Delete
                    </button>
                )}
            </div>
        </div>
    )
}
