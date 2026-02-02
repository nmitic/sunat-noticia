import 'dotenv/config';
import { db, adminTable } from '@/lib/db/drizzle';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function main() {
  // Get credentials from environment variables
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'SecurePassword123';
  const name = 'SUNAT Admin';

  console.log(`Creating admin user with email: ${email}`);

  // Hash the password
  const passwordHash = await hash(password, 10);

  // Check if admin user already exists
  const [existing] = await db.select()
    .from(adminTable)
    .where(eq(adminTable.email, email))
    .limit(1);

  if (existing) {
    console.log('Admin user already exists:', existing);
  } else {
    // Create the admin user
    const [admin] = await db.insert(adminTable)
      .values({
        email,
        passwordHash,
        name,
      })
      .returning();

    console.log('Admin user created:', admin);
  }
}

main()
  .then(() => {
    console.log('Seeding completed');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  });
