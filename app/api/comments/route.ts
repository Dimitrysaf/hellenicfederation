import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    const { rows: pinnedComments } = await sql`
      SELECT id, username, comment, upvotes, downvotes, parent_id, created_at, depth, pinned FROM comments WHERE pinned = TRUE
    `;
    const pinnedComment = pinnedComments[0] || null;

    const { rows: otherComments } = await sql`
      SELECT id, username, comment, upvotes, downvotes, parent_id, created_at, depth, pinned FROM comments WHERE pinned = FALSE ORDER BY created_at DESC
    `;

    const comments = pinnedComment ? [pinnedComment, ...otherComments] : otherComments;

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
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
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
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
    case 'pin':
      // Unpin any currently pinned comment
      await sql`UPDATE comments SET pinned = FALSE WHERE pinned = TRUE`;
      // Pin the new comment
      query = sql`UPDATE comments SET pinned = TRUE WHERE id = ${comment_id} RETURNING *`;
      break;
    case 'unpin':
      query = sql`UPDATE comments SET pinned = FALSE WHERE id = ${comment_id} RETURNING *`;
      break;
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  try {
    const { rows: updatedComment } = await query;
    return NextResponse.json({ comment: updatedComment[0] });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
  }

  try {
    await sql`DELETE FROM comments WHERE id = ${id}`;
    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}