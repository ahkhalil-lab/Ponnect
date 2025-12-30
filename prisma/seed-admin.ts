// Run with: npx tsx prisma/seed-admin.ts

import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import * as bcrypt from 'bcryptjs'
import path from 'path'

const adapter = new PrismaLibSql({
    url: `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`,
})

const prisma = new PrismaClient({ adapter })

async function main() {
    const adminEmail = 'admin@ponnect.com.au'
    const adminPassword = 'Admin123!'

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    })

    if (existingAdmin) {
        // Update to admin role if not already
        if (existingAdmin.role !== 'ADMIN') {
            await prisma.user.update({
                where: { email: adminEmail },
                data: { role: 'ADMIN', isVerified: true },
            })
            console.log('✅ Updated existing user to ADMIN role')
        } else {
            console.log('ℹ️  Admin user already exists')
        }
    } else {
        // Create new admin user
        const hashedPassword = await bcrypt.hash(adminPassword, 10)

        await prisma.user.create({
            data: {
                name: 'Admin User',
                email: adminEmail,
                passwordHash: hashedPassword,
                role: 'ADMIN',
                isVerified: true,
                location: 'Brisbane, QLD',
                bio: 'Platform administrator',
            },
        })
        console.log('✅ Created new admin user')
    }

    console.log('')
    console.log('========================================')
    console.log('🔐 Admin Login Credentials:')
    console.log('   Email:    admin@ponnect.com.au')
    console.log('   Password: Admin123!')
    console.log('========================================')
}

main()
    .catch((e) => {
        console.error('Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
