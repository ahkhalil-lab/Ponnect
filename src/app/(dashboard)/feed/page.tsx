'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import styles from './page.module.css'
import MediaUpload from '@/components/MediaUpload'
import MediaGallery from '@/components/MediaGallery'

interface Dog {
    id: string
    name: string
    photo: string | null
    breed: string
}

interface TaggedDog {
    dog: Dog
}

interface Post {
    id: string
    content: string
    images: string[]
    video: string | null
    videoThumbnail: string | null
    createdAt: string
    author: {
        id: string
        name: string
        avatar: string | null
        role: string
    }
    taggedDogs: TaggedDog[]
    isLiked: boolean
    isSaved: boolean
    isOwner: boolean
    _count: {
        likes: number
        comments: number
    }
}

interface Comment {
    id: string
    content: string
    createdAt: string
    author: {
        id: string
        name: string
        avatar: string | null
    }
}

interface UserDog {
    id: string
    name: string
    photo: string | null
}

export default function FeedPage() {
    const [posts, setPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [feedType, setFeedType] = useState<'following' | 'explore'>('following')
    const [newPostContent, setNewPostContent] = useState('')
    const [isPosting, setIsPosting] = useState(false)
    const [userDogs, setUserDogs] = useState<UserDog[]>([])
    const [selectedDogIds, setSelectedDogIds] = useState<string[]>([])
    const [showDogSelector, setShowDogSelector] = useState(false)
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
    const [postComments, setPostComments] = useState<Record<string, Comment[]>>({})
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [pendingMedia, setPendingMedia] = useState<{ imageUrls: string[]; videoUrl?: string; videoThumbnail?: string }>({ imageUrls: [] })
    const [showMediaUpload, setShowMediaUpload] = useState(false)
    const [likedPostAnimation, setLikedPostAnimation] = useState<string | null>(null)
    const mediaUploadRef = useRef<{ uploadAll: () => Promise<{ success: boolean; imageUrls: string[]; videoUrl?: string; videoThumbnail?: string }> }>(null)

    const fetchPosts = useCallback(async (pageNum: number, type: string, append: boolean = false) => {
        try {
            if (pageNum === 1) setIsLoading(true)
            else setLoadingMore(true)

            const res = await fetch(`/api/social/posts?page=${pageNum}&type=${type}`)
            const data = await res.json()

            if (data.success) {
                if (append) {
                    setPosts(prev => [...prev, ...data.data])
                } else {
                    setPosts(data.data)
                }
                setHasMore(pageNum < data.pagination.pages)
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error)
        } finally {
            setIsLoading(false)
            setLoadingMore(false)
        }
    }, [])

    const fetchUserDogs = async () => {
        try {
            const res = await fetch('/api/dogs')
            const data = await res.json()
            if (data.success) {
                setUserDogs(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch user dogs:', error)
        }
    }

    useEffect(() => {
        fetchPosts(1, feedType)
        fetchUserDogs()
    }, [feedType, fetchPosts])

    const handleFeedTypeChange = (type: 'following' | 'explore') => {
        setFeedType(type)
        setPage(1)
        setPosts([])
    }

    const handleCreatePost = async () => {
        if ((!newPostContent.trim() && pendingMedia.imageUrls.length === 0 && !pendingMedia.videoUrl) || isPosting) return

        setIsPosting(true)
        try {
            const res = await fetch('/api/social/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newPostContent,
                    dogIds: selectedDogIds.length > 0 ? selectedDogIds : undefined,
                    images: pendingMedia.imageUrls.length > 0 ? pendingMedia.imageUrls : undefined,
                    video: pendingMedia.videoUrl || undefined,
                    videoThumbnail: pendingMedia.videoThumbnail || undefined,
                }),
            })
            const data = await res.json()

            if (data.success) {
                setPosts(prev => [data.data, ...prev])
                setNewPostContent('')
                setSelectedDogIds([])
                setShowDogSelector(false)
                setPendingMedia({ imageUrls: [] })
                setShowMediaUpload(false)
            }
        } catch (error) {
            console.error('Failed to create post:', error)
        } finally {
            setIsPosting(false)
        }
    }

    const handleMediaChange = (imageUrls: string[], videoUrl?: string, videoThumbnail?: string) => {
        setPendingMedia({ imageUrls, videoUrl, videoThumbnail })
    }

    const handleDoubleTapLike = async (postId: string) => {
        const post = posts.find(p => p.id === postId)
        if (post && !post.isLiked) {
            await handleLike(postId)
            setLikedPostAnimation(postId)
            setTimeout(() => setLikedPostAnimation(null), 1000)
        }
    }

    const handleSavePost = async (postId: string) => {
        try {
            const res = await fetch(`/api/social/posts/${postId}/save`, { method: 'POST' })
            const data = await res.json()
            if (data.success) {
                setPosts(prev => prev.map(post =>
                    post.id === postId ? { ...post, isSaved: data.data.isSaved } : post
                ))
            }
        } catch (error) {
            console.error('Failed to save post:', error)
        }
    }

    const handleSharePost = async (postId: string) => {
        const url = `${window.location.origin}/feed?post=${postId}`
        try {
            await navigator.clipboard.writeText(url)
            alert('Link copied to clipboard!')
        } catch {
            // Fallback for older browsers
            prompt('Copy this link:', url)
        }
    }

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return

        try {
            const res = await fetch(`/api/social/posts/${postId}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) {
                setPosts(prev => prev.filter(post => post.id !== postId))
            }
        } catch (error) {
            console.error('Failed to delete post:', error)
        }
    }

    const handleLike = async (postId: string) => {
        try {
            const res = await fetch(`/api/social/posts/${postId}/like`, { method: 'POST' })
            const data = await res.json()

            if (data.success) {
                setPosts(prev => prev.map(post =>
                    post.id === postId
                        ? {
                            ...post,
                            isLiked: data.data.isLiked,
                            _count: { ...post._count, likes: data.data.likeCount }
                        }
                        : post
                ))
            }
        } catch (error) {
            console.error('Failed to toggle like:', error)
        }
    }

    const toggleComments = async (postId: string) => {
        const newExpanded = new Set(expandedComments)

        if (newExpanded.has(postId)) {
            newExpanded.delete(postId)
        } else {
            newExpanded.add(postId)
            // Fetch comments if not already loaded
            if (!postComments[postId]) {
                try {
                    const res = await fetch(`/api/social/posts/${postId}/comments`)
                    const data = await res.json()
                    if (data.success) {
                        setPostComments(prev => ({ ...prev, [postId]: data.data }))
                    }
                } catch (error) {
                    console.error('Failed to fetch comments:', error)
                }
            }
        }

        setExpandedComments(newExpanded)
    }

    const handleAddComment = async (postId: string) => {
        const content = commentInputs[postId]?.trim()
        if (!content) return

        try {
            const res = await fetch(`/api/social/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            })
            const data = await res.json()

            if (data.success) {
                setPostComments(prev => ({
                    ...prev,
                    [postId]: [...(prev[postId] || []), data.data],
                }))
                setCommentInputs(prev => ({ ...prev, [postId]: '' }))
                setPosts(prev => prev.map(post =>
                    post.id === postId
                        ? { ...post, _count: { ...post._count, comments: post._count.comments + 1 } }
                        : post
                ))
            }
        } catch (error) {
            console.error('Failed to add comment:', error)
        }
    }

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1
            setPage(nextPage)
            fetchPosts(nextPage, feedType, true)
        }
    }

    const toggleDogSelection = (dogId: string) => {
        setSelectedDogIds(prev =>
            prev.includes(dogId)
                ? prev.filter(id => id !== dogId)
                : [...prev, dogId]
        )
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / (1000 * 60))
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))

        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        if (days < 7) return `${days}d ago`
        return date.toLocaleDateString()
    }

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading your feed...</p>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>Social Feed</h1>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${feedType === 'following' ? styles.tabActive : ''}`}
                        onClick={() => handleFeedTypeChange('following')}
                    >
                        Following
                    </button>
                    <button
                        className={`${styles.tab} ${feedType === 'explore' ? styles.tabActive : ''}`}
                        onClick={() => handleFeedTypeChange('explore')}
                    >
                        Explore
                    </button>
                </div>
            </div>

            {/* Post Composer */}
            <div className={styles.composer}>
                <div className={styles.composerTop}>
                    <textarea
                        className={styles.composerTextarea}
                        placeholder="What's on your mind? Share something about your furry friend..."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        maxLength={2000}
                    />
                </div>

                {selectedDogIds.length > 0 && (
                    <div className={styles.composerActions}>
                        {selectedDogIds.map(id => {
                            const dog = userDogs.find(d => d.id === id)
                            return dog ? (
                                <span key={id} className={styles.dogTag}>
                                    🐕 {dog.name}
                                    <button
                                        className={styles.dogTagRemove}
                                        onClick={() => toggleDogSelection(id)}
                                    >×</button>
                                </span>
                            ) : null
                        })}
                    </div>
                )}

                {showDogSelector && userDogs.length > 0 && (
                    <div className={styles.dogSelector}>
                        {userDogs.map(dog => (
                            <button
                                key={dog.id}
                                className={`${styles.dogSelectorItem} ${selectedDogIds.includes(dog.id) ? styles.dogSelectorItemSelected : ''}`}
                                onClick={() => toggleDogSelection(dog.id)}
                            >
                                <span>🐕</span>
                                <span>{dog.name}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className={styles.composerBottom}>
                    <div className={styles.composerActions}>
                        <button
                            className={`btn btn-outline btn-sm ${showMediaUpload ? 'btn-active' : ''}`}
                            onClick={() => setShowMediaUpload(!showMediaUpload)}
                        >
                            📷 Photo/Video
                        </button>
                        {userDogs.length > 0 && (
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={() => setShowDogSelector(!showDogSelector)}
                            >
                                🐕 Tag Dog
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className={`${styles.charCount} ${newPostContent.length > 1900 ? styles.charCountOver : ''}`}>
                            {newPostContent.length}/2000
                        </span>
                        <button
                            className="btn btn-primary"
                            onClick={handleCreatePost}
                            disabled={(!newPostContent.trim() && pendingMedia.imageUrls.length === 0 && !pendingMedia.videoUrl) || isPosting}
                        >
                            {isPosting ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </div>

                {showMediaUpload && (
                    <div className={styles.mediaUploadSection}>
                        <MediaUpload
                            onMediaChange={handleMediaChange}
                            maxImages={4}
                            disabled={isPosting}
                        />
                    </div>
                )}
            </div>

            {/* Feed */}
            <div className={styles.feed}>
                {posts.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📭</div>
                        <h3>No posts yet</h3>
                        <p>
                            {feedType === 'following'
                                ? 'Follow other dog parents to see their posts here, or switch to Explore!'
                                : 'Be the first to share something with the community!'}
                        </p>
                    </div>
                ) : (
                    <>
                        {posts.map(post => (
                            <article key={post.id} className={styles.post}>
                                <div className={styles.postHeader}>
                                    <Link href={`/community/members/${post.author.id}`}>
                                        <div className={styles.postAuthorImg}>
                                            {post.author.avatar ? (
                                                <img src={post.author.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                post.author.name[0]?.toUpperCase()
                                            )}
                                        </div>
                                    </Link>
                                    <div className={styles.postAuthorInfo}>
                                        <Link href={`/community/members/${post.author.id}`} className={styles.postAuthorName}>
                                            {post.author.name}
                                        </Link>
                                        <div className={styles.postTime}>{formatTime(post.createdAt)}</div>
                                    </div>
                                </div>

                                <div className={styles.postContent}>{post.content}</div>

                                {(post.images?.length > 0 || post.video) && (
                                    <MediaGallery
                                        images={post.images || []}
                                        video={post.video || undefined}
                                        videoThumbnail={post.videoThumbnail || undefined}
                                        onDoubleTap={() => handleDoubleTapLike(post.id)}
                                        showLikeAnimation={likedPostAnimation === post.id}
                                    />
                                )}

                                {post.taggedDogs.length > 0 && (
                                    <div className={styles.postDogs}>
                                        {post.taggedDogs.map(({ dog }) => (
                                            <Link key={dog.id} href={`/community/dogs/${dog.id}`} className={styles.postDogTag}>
                                                🐕 {dog.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                <div className={styles.postActions}>
                                    <button
                                        className={`${styles.postAction} ${post.isLiked ? styles.postActionLiked : ''}`}
                                        onClick={() => handleLike(post.id)}
                                    >
                                        {post.isLiked ? '❤️' : '🤍'} {post._count.likes}
                                    </button>
                                    <button
                                        className={styles.postAction}
                                        onClick={() => toggleComments(post.id)}
                                    >
                                        💬 {post._count.comments}
                                    </button>
                                    <button
                                        className={`${styles.postAction} ${post.isSaved ? styles.postActionSaved : ''}`}
                                        onClick={() => handleSavePost(post.id)}
                                        title={post.isSaved ? 'Unsave' : 'Save'}
                                    >
                                        {post.isSaved ? '🔖' : '📑'}
                                    </button>
                                    <button
                                        className={styles.postAction}
                                        onClick={() => handleSharePost(post.id)}
                                        title="Share"
                                    >
                                        📤
                                    </button>
                                    {post.isOwner && (
                                        <button
                                            className={`${styles.postAction} ${styles.postActionDelete}`}
                                            onClick={() => handleDeletePost(post.id)}
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>

                                {expandedComments.has(post.id) && (
                                    <div className={styles.commentsSection}>
                                        <div className={styles.commentsList}>
                                            {(postComments[post.id] || []).map(comment => (
                                                <div key={comment.id} className={styles.comment}>
                                                    <div className={styles.commentAvatar}>
                                                        {comment.author.avatar ? (
                                                            <img src={comment.author.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                                        ) : (
                                                            comment.author.name[0]?.toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className={styles.commentContent}>
                                                        <span className={styles.commentAuthor}>{comment.author.name}</span>
                                                        <p className={styles.commentText}>{comment.content}</p>
                                                        <span className={styles.commentTime}>{formatTime(comment.createdAt)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className={styles.commentInput}>
                                            <input
                                                type="text"
                                                placeholder="Write a comment..."
                                                value={commentInputs[post.id] || ''}
                                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                            />
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleAddComment(post.id)}
                                            >
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </article>
                        ))}

                        {hasMore && (
                            <div className={styles.loadMore}>
                                <button
                                    className="btn btn-outline"
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </>
                )
                }
            </div >
        </div >
    )
}
