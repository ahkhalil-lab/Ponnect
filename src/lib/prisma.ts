import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

function createPrismaClient() {
    // PrismaLibSql now takes config object directly with url
    const adapter = new PrismaLibSql({
        url: `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`,
    })

    return new PrismaClient({
        adapter,
        log: ['query', 'error', 'warn'],
    })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
