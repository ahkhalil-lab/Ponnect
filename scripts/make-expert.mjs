import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

// Create prisma client with libsql adapter
const adapter = new PrismaLibSql({
    url: `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`,
})

const prisma = new PrismaClient({
    adapter,
})

async function main() {
    // Update test user to be a verified expert
    const result = await prisma.user.updateMany({
        where: {
            email: 'test_unique_subagent_2@example.com'
        },
        data: {
            role: 'EXPERT',
            expertType: 'VET',
            isVerified: true
        }
    })

    console.log('Updated users:', result.count)

    // Also show the updated user
    const user = await prisma.user.findFirst({
        where: { email: 'test_unique_subagent_2@example.com' },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            expertType: true,
            isVerified: true
        }
    })

    console.log('User details:', user)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
