import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { FAQ } from '../../../db/faqs';

export async function GET() {
  try {
    const { rows } = await sql<FAQ>`SELECT * FROM faqs ORDER BY "order" ASC;`;
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

    return NextResponse.json({ message: 'FAQs saved successfully' });
  } catch (error) {
    console.error('Error saving FAQs:', error);
    return NextResponse.json({ message: 'Error saving FAQs' }, { status: 500 });
  }
}