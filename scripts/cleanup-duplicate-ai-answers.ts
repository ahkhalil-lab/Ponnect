// Script to clean up duplicate AI answers
// Run with: npx tsx scripts/cleanup-duplicate-ai-answers.ts

import { prisma } from '../src/lib/prisma'

async function main() {
    console.log('Finding AI-generated answers...')

    const aiAnswers = await prisma.expertAnswer.findMany({
        where: { isAiGenerated: true },
        orderBy: { createdAt: 'asc' },
    })

    console.log(`Found ${aiAnswers.length} AI answers total`)

    // Group by question ID
    const byQuestion: Record<string, typeof aiAnswers> = {}
    aiAnswers.forEach(a => {
        if (!byQuestion[a.questionId]) byQuestion[a.questionId] = []
        byQuestion[a.questionId].push(a)
    })

    let deletedCount = 0

    // Delete duplicates (keep the first one)
    for (const questionId of Object.keys(byQuestion)) {
        const answers = byQuestion[questionId]
        if (answers.length > 1) {
            const duplicates = answers.slice(1) // Keep first, delete rest
            console.log(`Question ${questionId}: deleting ${duplicates.length} duplicate(s)`)

            for (const dup of duplicates) {
                await prisma.expertAnswer.delete({ where: { id: dup.id } })
                deletedCount++
            }
        }
    }

    console.log(`Done! Deleted ${deletedCount} duplicate AI answers.`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
