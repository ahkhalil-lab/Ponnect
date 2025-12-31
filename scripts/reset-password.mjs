import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'
import bcrypt from 'bcryptjs'

const adapter = new PrismaLibSql({ url: `file:${path.join(process.cwd(), 'prisma', 'dev.db')}` })
const prisma = new PrismaClient({ adapter })

async function main() {
    const email = 'test_unique_subagent_2@example.com'
    const newPassword = 'password'

    // Hash the password
    const passwordHash = await bcrypt.hash(newPassword, 12)

    // Update the user's password
    const result = await prisma.user.update({
        where: { email },
        data: { passwordHash },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            expertType: true,
            isVerified: true
        }
    })

    console.log('\n=== Password Reset Complete ===')
    console.log('User:', result.name)
    console.log('Email:', result.email)
    console.log('Role:', result.role)
    console.log('Expert Type:', result.expertType)
    console.log('Is Verified:', result.isVerified)
    console.log('New password: password')
}

main().catch(console.error).finally(() => prisma.$disconnect())
