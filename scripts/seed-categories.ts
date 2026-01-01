import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const libsql = createClient({
    url: 'file:./prisma/dev.db',
});

const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter } as unknown as ConstructorParameters<typeof PrismaClient>[0]);

const categories = [
    { name: 'Grooming', slug: 'grooming', icon: '✂️', description: 'Professional grooming services', sortOrder: 1 },
    { name: 'Dog Walking', slug: 'walking', icon: '🚶', description: 'Daily walks and exercise', sortOrder: 2 },
    { name: 'Pet Sitting', slug: 'sitting', icon: '🏠', description: 'In-home pet care', sortOrder: 3 },
    { name: 'Training', slug: 'training', icon: '🎓', description: 'Obedience and behavior training', sortOrder: 4 },
    { name: 'Photography', slug: 'photography', icon: '📸', description: 'Pet photography sessions', sortOrder: 5 },
    { name: 'Boarding', slug: 'boarding', icon: '🛏️', description: 'Overnight stays', sortOrder: 6 },
    { name: 'Day Care', slug: 'daycare', icon: '☀️', description: 'Daytime care and play', sortOrder: 7 },
    { name: 'Vet Services', slug: 'vet', icon: '🏥', description: 'Veterinary care', sortOrder: 8 },
    { name: 'Party & Events', slug: 'events', icon: '🎉', description: 'Birthday parties and events', sortOrder: 9 },
    { name: 'Transport', slug: 'transport', icon: '🚗', description: 'Pet transportation', sortOrder: 10 },
];

async function seedCategories() {
    console.log('🌱 Seeding service categories...');

    for (const cat of categories) {
        await prisma.serviceCategory.upsert({
            where: { slug: cat.slug },
            update: cat,
            create: cat,
        });
        console.log(`  ✓ ${cat.icon} ${cat.name}`);
    }

    console.log('✅ Categories seeded successfully!');
}

seedCategories()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
