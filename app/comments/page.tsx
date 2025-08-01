'use client';
import React, { useState, useEffect } from 'react';
import { Container, Title, Stack, Card, TextInput, Textarea, Button, Text, Group, Modal, Select, Divider, Skeleton, LoadingOverlay } from '@mantine/core';
import CommentCard from '../../components/CommentCard/CommentCard';
import { IconBold, IconItalic, IconLink, IconRefresh } from '@tabler/icons-react';

// --- Main Comments Page ---
interface Comment {
  id: string;
  username: string;
  comment: string;
  upvotes: number;
  downvotes: number;
  parent_id?: string | null;
  score: number;
  depth: number;
  pinned: boolean;
  created_at: string;
}

interface CommentNode extends Comment {
  children: CommentNode[];
}

const buildCommentTree = (comments: Comment[]): CommentNode[] => {
  console.log('Building comment tree from:', comments);
  const commentMap: { [key: string]: CommentNode } = {};
  const rootComments: CommentNode[] = [];

  comments.forEach(comment => {
    commentMap[comment.id] = { ...comment, children: [] };
  });

  comments.forEach(comment => {
    if (comment.parent_id && commentMap[comment.parent_id]) {
      const parent = commentMap[comment.parent_id];
      const child = commentMap[comment.id];
      parent.children.push(child);
    } else {
      rootComments.push(commentMap[comment.id]);
    }
  });

  Object.values(commentMap).forEach(comment => {
    comment.score = comment.upvotes - comment.downvotes;
  });

  console.log('Built comment tree:', rootComments);
  return rootComments;
};

const flattenComments = (nodes: CommentNode[]): Comment[] => {
  let flatList: Comment[] = [];
  nodes.forEach(node => {
    // Create a new object without the 'children' property to match the 'Comment' interface
    const { children, ...rest } = node;
    flatList.push(rest);
    if (children && children.length > 0) {
      flatList = flatList.concat(flattenComments(children));
    }
  });
  return flatList;
};

const updateCommentInTree = (
  nodes: CommentNode[],
  commentId: string,
  updateFn: (comment: CommentNode) => CommentNode
): CommentNode[] => {
  return nodes.map(node => {
    if (node.id === commentId) {
      return updateFn(node);
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: updateCommentInTree(node.children, commentId, updateFn)
      };
    }
    return node;
  });
};

const CommentsPage = () => {
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [username, setUsername] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<{[commentId: string]: 'upvote' | 'downvote' | null}>({});
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyingToUsername, setReplyingToUsername] = useState<string | null>(null);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'created_at' | 'score'>('created_at'); // Default sort by date
  const [sortedComments, setSortedComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshingOnCooldown, setIsRefreshingOnCooldown] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const [scrollAttempted, setScrollAttempted] = useState(false);

  useEffect(() => {
    const sortComments = (commentsToSort: CommentNode[]): CommentNode[] => {
      const sorted = [...commentsToSort].sort((a, b) => {
        if (sortBy === 'created_at') {
          // Assuming 'created_at' can be compared directly or converted to a date
          // For now, let's assume it's a string that can be compared lexicographically
          // or you might need to parse it to Date objects if it's a date string
          return new Date(b.id).getTime() - new Date(a.id).getTime(); // Using ID as a proxy for creation time for now
        } else if (sortBy === 'score') {
          return b.score - a.score;
        }
        return 0;
      });

      return sorted.map(comment => ({
        ...comment,
        children: sortComments(comment.children) // Recursively sort children
      }));
    };

    setSortedComments(sortComments(comments));
  }, [comments, sortBy]);

  const handleReply = (commentId: string, username: string) => {
    setReplyingToCommentId(commentId);
    setReplyingToUsername(username);
  };

  const applyMarkdown = (syntax: string, value?: string, url?: string) => {
    const textarea = document.querySelector('textarea[name="comment"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    let newText = '';
    if (syntax === 'link') {
      newText = `${textarea.value.substring(0, start)}[${value || selectedText}](${url})${textarea.value.substring(end)}`;
    } else {
      newText = `${textarea.value.substring(0, start)}${syntax}${selectedText || value}${syntax}${textarea.value.substring(end)}`;
    }

    setComment(newText);
    // Restore cursor position (optional, but good UX)
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + syntax.length;
      textarea.selectionEnd = start + syntax.length + (selectedText ? selectedText.length : (value ? value.length : 0));
    }, 0);
  };

  const handleInsertLink = () => {
    applyMarkdown('link', linkText, linkUrl);
    setLinkText('');
    setLinkUrl('');
    setIsLinkModalOpen(false);
  };

  // Load votes from localStorage on initial render
  useEffect(() => {
    const savedVotes = localStorage.getItem('userVotes');
    if (savedVotes) {
      setUserVotes(JSON.parse(savedVotes));
    }
  }, []);

  // Save votes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userVotes', JSON.stringify(userVotes));
  }, [userVotes]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      console.log('Fetched comments data:', data.comments);
      setComments(buildCommentTree(data.comments || []));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  useEffect(() => {
    if (!loading && sortedComments.length > 0 && !scrollAttempted) { // Ensure comments are loaded and rendered before attempting to scroll
      const commentId = window.location.hash.substring(1); // Remove the #
      if (commentId) {
        setHighlightedCommentId(commentId);
        const element = document.getElementById(commentId);
        if (element) {
          const scroll = () => {
            // Check if the element is connected to the DOM and has a non-zero height
            if (element.isConnected && element.offsetHeight > 0) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setScrollAttempted(true); // Mark as attempted to prevent re-scrolling
            } else {
              requestAnimationFrame(scroll);
            }
          };
          requestAnimationFrame(scroll);
        } else {
          // If element not found immediately, reset scrollAttempted to try again on next render
          setScrollAttempted(false);
        }
      }
    }
  }, [loading, sortedComments, scrollAttempted]); // Re-run when loading state changes or comments are updated

  const handleVote = async (commentId: string, voteType: 'upvote' | 'downvote') => {
    const currentVote = userVotes[commentId];
    let apiCalls: Promise<Response>[] = [];

    const updatedComments = updateCommentInTree(comments, commentId, (commentToUpdate) => {
      if (currentVote === voteType) {
        // User is clicking the same button again, so remove the vote
        commentToUpdate[voteType === 'upvote' ? 'upvotes' : 'downvotes'] -= 1;
        apiCalls.push(fetch(`/api/comments?id=${commentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: `remove_${voteType}` }),
        }));
        setUserVotes({ ...userVotes, [commentId]: null });
      } else {
        // New vote or switching vote
        commentToUpdate[voteType === 'upvote' ? 'upvotes' : 'downvotes'] += 1;
        if (currentVote) {
          // If switching, remove the old vote
          const oldVoteType = currentVote;
          commentToUpdate[oldVoteType === 'upvote' ? 'upvotes' : 'downvotes'] -= 1;
          apiCalls.push(fetch(`/api/comments?id=${commentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: `remove_${oldVoteType}` }),
          }));
        }
        apiCalls.push(fetch(`/api/comments?id=${commentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: voteType }),
        }));
        setUserVotes({ ...userVotes, [commentId]: voteType });
      }

      // Update score for optimistic UI
      commentToUpdate.score = commentToUpdate.upvotes - commentToUpdate.downvotes;
      return commentToUpdate;
    });

    setComments(updatedComments);

    await Promise.all(apiCalls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, comment, parent_id: replyingToCommentId }),
      });
      if (!response.ok) {
        throw new Error('Failed to post comment');
      }
      const data = await response.json();
      if (data.comment) {
        // Flatten existing comments, add the new comment, and then rebuild the tree
        const existingFlatComments = flattenComments(comments);
        const updatedCommentsFlat = [...existingFlatComments, { ...data.comment, children: [] }];
        setComments(buildCommentTree(updatedCommentsFlat));
        setUsername('');
        setComment('');
        setReplyingToCommentId(null);
        setReplyingToUsername(null);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const handlePin = async (commentId: string, isPinned: boolean) => {
    try {
      const action = isPinned ? 'pin' : 'unpin';
      const response = await fetch(`/api/comments?id=${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} comment`);
      }

      // Re-fetch comments to get the updated pinned status and order
      fetchComments();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  return (
    <Container size="md" py="lg">
      <Title order={1} mb="lg">
        Comments
      </Title>
      <Stack>
        <Card withBorder radius="md" p="lg" pos="relative">
          <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
          <Title order={2} mb="md">Leave a Comment</Title>
          <form onSubmit={handleSubmit}>
            <Stack>
              {replyingToUsername && (
                <Text size="sm" c="dimmed">Replying to: {replyingToUsername} <Button variant="subtle" size="xs" onClick={() => { setReplyingToCommentId(null); setReplyingToUsername(null); }}>Cancel</Button></Text>
              )}
              <TextInput
                label="Username"
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.currentTarget.value)}
                required
              />
              <Group>
                <Button size="xs" onClick={() => applyMarkdown('**', 'bold text')} leftSection={<IconBold size={14} />}>Bold</Button>
                <Button size="xs" onClick={() => applyMarkdown('*', 'italic text')} leftSection={<IconItalic size={14} />}>Italic</Button>
                <Button size="xs" onClick={() => setIsLinkModalOpen(true)} leftSection={<IconLink size={14} />}>Link</Button>
              </Group>
              <Modal opened={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} title="Insert Link">
                <TextInput
                  label="Link Text"
                  placeholder="Text to display"
                  value={linkText}
                  onChange={(event) => setLinkText(event.currentTarget.value)}
                  mb="xs"
                />
                <TextInput
                  label="URL"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.currentTarget.value)}
                  mb="md"
                />
                <Button onClick={handleInsertLink}>Insert Link</Button>
              </Modal>
              <Textarea
                label="Comment"
                placeholder="Your comment"
                value={comment}
                onChange={(e) => setComment(e.currentTarget.value)}
                required
                minRows={8}
                autosize
                name="comment" // Added name attribute for easier selection
              />
              <Button type="submit" mt="md">Post Comment</Button>
            </Stack>
          </form>
        </Card>
        {error && <Text c="red">{error}</Text>}
        <Group justify="space-between" align="center" mb="md">
          <Divider style={{ flexGrow: 1 }} />
          <Select
            placeholder={`Sort by: ${sortBy === 'created_at' ? 'Date' : 'Votes'}`}
            data={[
              { value: 'created_at', label: 'Date' },
              { value: 'score', label: 'Votes' },
            ]}
            value={sortBy}
            onChange={(value) => setSortBy(value as 'created_at' | 'score')}
            size="sm"
            w={150} // Set a fixed width to make it smaller
          />
          <Button onClick={() => {
            fetchComments();
            setIsRefreshingOnCooldown(true);
            setTimeout(() => {
              setIsRefreshingOnCooldown(false);
            }, 2500);
          }} leftSection={<IconRefresh size={14} />} variant="default" size="sm" disabled={loading || isRefreshingOnCooldown}>Refresh</Button>
        </Group>
        <Stack mt="lg">
          {loading ? (
            <Stack>
              <Skeleton height={80} radius="md" />
              <Skeleton height={80} radius="md" />
              <Skeleton height={80} radius="md" />
            </Stack>
          ) : sortedComments && sortedComments.length > 0 ? (
            sortedComments.map((comment) => (
              <CommentCard key={comment.id} {...comment} onVote={handleVote} allUserVotes={userVotes} onReply={handleReply} onPin={handlePin} depth={comment.depth} highlightedCommentId={highlightedCommentId} />
            ))
          ) : (
            <Text>No comments yet. Be the first to comment!</Text>
          )}
        </Stack>
      </Stack>
    </Container>
  );
};

export default CommentsPage;