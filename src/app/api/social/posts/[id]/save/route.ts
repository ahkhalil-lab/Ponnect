import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Toggle save/unsave post
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            )
        }

        const { id: postId } = await params

        // Check if post exists
        const post = await prisma.socialPost.findUnique({
            where: { id: postId },
        })

        if (!post) {
            return NextResponse.json(
                { success: false, error: 'Post not found' },
                { status: 404 }
            )
        }

        // Check if already saved
        const existingSave = await prisma.savedPost.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId: user.id,
                },
            },
        })

        if (existingSave) {
            // Unsave
            await prisma.savedPost.delete({
                where: { id: existingSave.id },
            })

            return NextResponse.json({
                success: true,
                data: { isSaved: false },
            })
        } else {
            // Save
            await prisma.savedPost.create({
                data: {
                    postId,
                    userId: user.id,
                },
            })

            return NextResponse.json({
                success: true,
                data: { isSaved: true },
            })
        }
    } catch (error) {
        console.error('Save post error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to save post' },
            { status: 500 }
        )
    }
}
