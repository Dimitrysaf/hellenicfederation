
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function seed() {
  try {
    // Check if the article already exists
    const existing = await sql`SELECT * FROM articles WHERE id = '123-abc'`;
    if (existing.rowCount > 0) {
      console.log('Dummy article already exists.');
      return;
    }

    // Insert a dummy article
    await sql`
      INSERT INTO articles (id, name, number, content)
      VALUES ('123-abc', 'Test Article', 1, 'This is a test article for comments.')
    `;
    console.log('Successfully seeded dummy article.');
  } catch (error) {
    console.error('Error seeding article:', error);
  }
}

seed();
