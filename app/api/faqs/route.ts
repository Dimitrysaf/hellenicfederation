import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { faqs, FAQ } from '../../../db/faqs';

const faqsFilePath = path.resolve(process.cwd(), 'db/faqs.ts');

export async function GET() {
  return NextResponse.json(faqs);
}

export async function POST(request: Request) {
  try {
    const updatedFaqs: FAQ[] = await request.json();
    const fileContent = `export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export const faqs: FAQ[] = ${JSON.stringify(updatedFaqs, null, 2)};
`;
    await fs.writeFile(faqsFilePath, fileContent, 'utf-8');
    // Update the in-memory array as well for consistency within the current server instance
    faqs.splice(0, faqs.length, ...updatedFaqs);
    return NextResponse.json({ message: 'FAQs updated successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error saving FAQs' }, { status: 500 });
  }
}
