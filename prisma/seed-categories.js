const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const categories = [
    {
        name: 'General Discussion',
        slug: 'general',
        description: 'Chat about anything dog-related',
        icon: '💬',
        color: '#FF6B35',
        order: 1,
    },
    {
        name: 'Health & Wellness',
        slug: 'health',
        description: 'Discuss health issues, symptoms, and vet experiences',
        icon: '🏥',
        color: '#22C55E',
        order: 2,
    },
    {
        name: 'Training & Behavior',
        slug: 'training',
        description: 'Tips and questions about training your pup',
        icon: '🎓',
        color: '#3B82F6',
        order: 3,
    },
    {
        name: 'Nutrition & Diet',
        slug: 'nutrition',
        description: 'Food recommendations, diet tips, and feeding schedules',
        icon: '🍖',
        color: '#F59E0B',
        order: 4,
    },
    {
        name: 'Breed Talk',
        slug: 'breeds',
        description: 'Discuss specific breeds and their characteristics',
        icon: '🐕',
        color: '#8B5CF6',
        order: 5,
    },
    {
        name: 'Puppy Corner',
        slug: 'puppies',
        description: 'Everything about raising puppies',
        icon: '🐶',
        color: '#EC4899',
        order: 6,
    },
    {
        name: 'Senior Dogs',
        slug: 'seniors',
        description: 'Care and support for older dogs',
        icon: '🦮',
        color: '#6B7280',
        order: 7,
    },
    {
        name: 'Lost & Found',
        slug: 'lost-found',
        description: 'Help reunite lost dogs with their families',
        icon: '🔍',
        color: '#EF4444',
        order: 8,
    },
]

async function seedCategories() {
    console.log('🌱 Seeding forum categories...')

    for (const category of categories) {
        await prisma.forumCategory.upsert({
            where: { slug: category.slug },
            update: category,
            create: category,
        })
        console.log(`  ✓ ${category.name}`)
    }

    console.log('✅ Forum categories seeded successfully!')
}

seedCategories()
    .catch((e) => {
        console.error('Error seeding categories:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
