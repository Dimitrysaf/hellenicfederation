import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get('articleId');

  if (!articleId) {
    return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
  }

  try {
    const { rows } = await sql`SELECT name FROM articles WHERE id = ${articleId}`;
    if (rows.length > 0) {
      return NextResponse.json({ name: rows[0].name });
    } else {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
