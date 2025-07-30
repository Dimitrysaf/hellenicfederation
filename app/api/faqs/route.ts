import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { FAQ } from '../../../db/faqs';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on('error', err => console.log('Redis Client Error', err));

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}


const FAQS_CACHE_KEY = 'all_faqs';
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

export async function GET() {
  try {
    // Try to fetch from cache first
    await connectRedis();
    const cachedFaqs: FAQ[] | null = JSON.parse(await redisClient.get(FAQS_CACHE_KEY) || 'null');
    if (cachedFaqs) {
      console.log('Serving FAQs from cache');
      return NextResponse.json(cachedFaqs);
    }

    // If not in cache, fetch from database
    const { rows } = await sql<FAQ>`SELECT * FROM faqs ORDER BY "order" ASC;`;
    
    // Store in cache
    await redisClient.set(FAQS_CACHE_KEY, JSON.stringify(rows), { EX: CACHE_TTL_SECONDS });
    console.log('Serving FAQs from database and caching');
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json({ message: 'Error fetching FAQs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const updatedFaqs: FAQ[] = await request.json();

    // Clear existing FAQs and insert new ones to handle reordering and updates
    await sql`DELETE FROM faqs;`;

    for (const faq of updatedFaqs) {
      await sql`
        INSERT INTO faqs (id, question, answer, "order")
        VALUES (${faq.id}, ${faq.question}, ${faq.answer}, ${faq.order})
        ON CONFLICT (id) DO UPDATE SET
          question = EXCLUDED.question,
          answer = EXCLUDED.answer,
          "order" = EXCLUDED."order";
      `;
    }

    // Invalidate cache after successful update
    await redisClient.del(FAQS_CACHE_KEY);
    console.log('FAQs updated and cache invalidated');

    return NextResponse.json({ message: 'FAQs saved successfully' });
  } catch (error) {
    console.error('Error saving FAQs:', error);
    return NextResponse.json({ message: 'Error saving FAQs' }, { status: 500 });
  }
}