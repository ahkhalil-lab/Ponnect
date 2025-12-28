import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seed() {
    console.log('🌱 Seeding database...')

    // Seed Forum Categories
    const categories = [
        { name: 'Health & Wellness', slug: 'health', description: 'Vet advice, vaccinations, medications, and general health questions', icon: '🏥', order: 1, color: '#22C55E' },
        { name: 'Training & Behaviour', slug: 'training', description: 'Tips for training, addressing behavioural issues, and obedience', icon: '🎓', order: 2, color: '#3B82F6' },
        { name: 'Puppies', slug: 'puppies', description: 'Everything about raising puppies - from housetraining to teething', icon: '🐕', order: 3, color: '#F59E0B' },
        { name: 'Food & Nutrition', slug: 'nutrition', description: 'Diet advice, food recommendations, and feeding schedules', icon: '🍖', order: 4, color: '#EF4444' },
        { name: 'Brisbane & QLD', slug: 'brisbane-qld', description: 'Local discussions, parks, vets, and services in Brisbane and Queensland', icon: '🌴', order: 5, color: '#FF6B35' },
        { name: 'Breed Talk', slug: 'breeds', description: 'Discussions about specific breeds, breed-specific health, and traits', icon: '🐾', order: 6, color: '#9B5DE5' },
        { name: 'Rescue & Adoption', slug: 'rescue', description: 'Adopt don\'t shop! Rescue stories, adoption advice, and fostering', icon: '❤️', order: 7, color: '#FF6B9D' },
        { name: 'General Chat', slug: 'general', description: 'Off-topic discussions, dog memes, and fun stuff', icon: '💬', order: 8, color: '#4ECDC4' },
    ]

    for (const category of categories) {
        await prisma.forumCategory.upsert({
            where: { slug: category.slug },
            update: category,
            create: category,
        })
    }
    console.log('✅ Forum categories seeded')

    // Seed Regional Alerts (example for QLD)
    await prisma.regionalAlert.upsert({
        where: { id: 'tick-alert-qld-2025' },
        update: {},
        create: {
            id: 'tick-alert-qld-2025',
            title: 'Paralysis Tick Season Alert',
            message: 'Risk is HIGH in Southeast Queensland. Ensure your dog has up-to-date tick prevention and check them daily after outdoor activities. Symptoms include wobbly back legs, changed bark, and difficulty breathing. Seek vet help immediately if suspected.',
            region: 'QLD',
            severity: 'WARNING',
            type: 'TICK',
            isActive: true,
        },
    })
    console.log('✅ Regional alerts seeded')

    console.log('🎉 Database seeding complete!')
}

seed()
    .catch((e) => {
        console.error('❌ Seeding failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
