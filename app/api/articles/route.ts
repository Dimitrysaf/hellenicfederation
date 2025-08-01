import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { Article } from '../../../db/articles';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on('error', err => console.log('Redis Client Error', err));

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}


const ARTICLES_CACHE_KEY = 'all_articles';
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

export async function GET() {
  try {
    // Try to fetch from cache first
    await connectRedis();
    const cachedArticles: Article[] | null = JSON.parse(await redisClient.get(ARTICLES_CACHE_KEY) || 'null');
    if (cachedArticles) {
      console.log('Serving articles from cache');
      return NextResponse.json(cachedArticles);
    }

    // If not in cache, fetch from database
    await sql`SET client_encoding = 'UTF8';`;
    const { rows } = await sql<Article>`SELECT * FROM articles ORDER BY number ASC;`;
    
    // Store in cache
    await redisClient.set(ARTICLES_CACHE_KEY, JSON.stringify(rows), { EX: CACHE_TTL_SECONDS });
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
    await redisClient.del(ARTICLES_CACHE_KEY);
    console.log('Articles updated and cache invalidated');

    return NextResponse.json({ message: 'Articles saved successfully' });
  } catch (error) {
    console.error('Error saving articles:', error);
    return NextResponse.json({ message: 'Σφάλμα αποθήκευσης άρθρων' }, { status: 500 });
  }
}