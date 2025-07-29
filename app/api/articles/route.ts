import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { Article, mockArticles } from '../../../db/articles';

const articlesFilePath = path.resolve(process.cwd(), 'db/articles.ts');

export async function GET() {
  return NextResponse.json(mockArticles);
}

export async function POST(request: Request) {
  try {
    const updatedArticles: Article[] = await request.json();
    const fileContent = `export interface Article {
  id: string;
  name: string;
  number: number;
  content: string;
}

export const mockArticles: Article[] = ${JSON.stringify(updatedArticles, null, 2)};
`;
    await fs.writeFile(articlesFilePath, fileContent, 'utf-8');
    return NextResponse.json({ message: 'Articles saved successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error saving articles' }, { status: 500 });
  }
}
