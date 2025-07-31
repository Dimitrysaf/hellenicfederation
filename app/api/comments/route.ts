import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    const { rows: comments } = await sql`
      SELECT id, username, comment, upvotes, downvotes, parent_id, created_at, depth FROM comments ORDER BY created_at DESC
    `;
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { username, comment, parent_id } = await request.json();

  if (!username || !comment) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const REPLY_LIMIT = 5;

  try {
    if (parent_id) {
      const { rows: existingReplies } = await sql`
        SELECT COUNT(*) FROM comments WHERE parent_id = ${parent_id}
      `;
      if (parseInt(existingReplies[0].count, 10) >= REPLY_LIMIT) {
        return NextResponse.json({ error: `Reply limit (${REPLY_LIMIT}) reached for this comment.` }, { status: 400 });
      }
    }

    let depth = 0;
    if (parent_id) {
      const { rows: parentComment } = await sql`
        SELECT depth FROM comments WHERE id = ${parent_id}
      `;
      if (parentComment.length > 0) {
        depth = parentComment[0].depth + 1;
      }
    }

    const { rows: newComment } = await sql`
      INSERT INTO comments (id, username, comment, parent_id, depth)
      VALUES (gen_random_uuid(), ${username}, ${comment}, ${parent_id}, ${depth})
      RETURNING *
    `;
    return NextResponse.json({ comment: newComment[0] });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const comment_id = searchParams.get('id');
  const { action } = await request.json();

  if (!comment_id || !action) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let query;
  switch (action) {
    case 'upvote':
      query = sql`UPDATE comments SET upvotes = upvotes + 1 WHERE id = ${comment_id} RETURNING *`;
      break;
    case 'downvote':
      query = sql`UPDATE comments SET downvotes = downvotes + 1 WHERE id = ${comment_id} RETURNING *`;
      break;
    case 'remove_upvote':
      query = sql`UPDATE comments SET upvotes = upvotes - 1 WHERE id = ${comment_id} RETURNING *`;
      break;
    case 'remove_downvote':
      query = sql`UPDATE comments SET downvotes = downvotes - 1 WHERE id = ${comment_id} RETURNING *`;
      break;
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  try {
    const { rows: updatedComment } = await query;
    return NextResponse.json({ comment: updatedComment[0] });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
