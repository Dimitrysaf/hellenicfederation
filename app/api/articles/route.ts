import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { Article } from '../../../db/articles';
import { kv } from '@vercel/kv';

const ARTICLES_CACHE_KEY = 'all_articles';
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

export async function GET() {
  try {
    // Try to fetch from cache first
    const cachedArticles: Article[] | null = await kv.get(ARTICLES_CACHE_KEY);
    if (cachedArticles) {
      console.log('Serving articles from cache');
      return NextResponse.json(cachedArticles);
    }

    // If not in cache, fetch from database
    const { rows } = await sql<Article>`SELECT * FROM articles ORDER BY number ASC;`;
    
    // Store in cache
    await kv.set(ARTICLES_CACHE_KEY, rows, { ex: CACHE_TTL_SECONDS });
    console.log('Serving articles from database and caching');
    
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

    // Invalidate cache after successful update
    await kv.del(ARTICLES_CACHE_KEY);
    console.log('Articles updated and cache invalidated');

    return NextResponse.json({ message: 'Articles saved successfully' });
  } catch (error) {
    console.error('Error saving articles:', error);
    return NextResponse.json({ message: 'Error saving articles' }, { status: 500 });
  }
}