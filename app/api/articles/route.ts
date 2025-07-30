import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { Article } from '../../../db/articles';

export async function GET() {
  try {
    const { rows } = await sql<Article>`SELECT * FROM articles ORDER BY number ASC;`;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ message: 'Error fetching articles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const updatedArticles: Article[] = await request.json();

    // Clear existing articles and insert new ones to handle reordering and updates
    await sql`DELETE FROM articles;`;

    for (const article of updatedArticles) {
      await sql`
        INSERT INTO articles (id, name, number, content)
        VALUES (${article.id}, ${article.name}, ${article.number}, ${article.content})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          number = EXCLUDED.number,
          content = EXCLUDED.content;
      `;
    }

    return NextResponse.json({ message: 'Articles saved successfully' });
  } catch (error) {
    console.error('Error saving articles:', error);
    return NextResponse.json({ message: 'Error saving articles' }, { status: 500 });
  }
}