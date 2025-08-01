import React, { useState } from 'react';
import { Card, Text, Group, ActionIcon, Button, Stack, CopyButton, Tooltip } from '@mantine/core';
import { IconArrowUp, IconArrowDown, IconMessageCircle, IconChevronDown, IconChevronUp, IconLink, IconCopy, IconCheck } from '@tabler/icons-react';
import { useClipboard } from '@mantine/hooks';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CommentNode {
  id: string;
  username: string;
  comment: string;
  upvotes: number;
  downvotes: number;
  parent_id?: string | null;
  children: CommentNode[];
  score: number;
  created_at: string;
  depth: number;
  pinned: boolean;
}

interface CommentCardProps extends CommentNode {
  onVote: (commentId: string, type: 'upvote' | 'downvote') => void;
  allUserVotes: { [commentId: string]: 'upvote' | 'downvote' | null };
  onReply: (commentId: string, username: string) => void;
  onPin: (commentId: string, isPinned: boolean) => void;
  highlightedCommentId: string | null;
}

const CommentCard: React.FC<CommentCardProps> = ({ id, username, comment, score, onVote, allUserVotes, onReply, children, created_at, depth, pinned, onPin, highlightedCommentId }) => {
  const userVote = allUserVotes[id];
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const REPLY_LIMIT = 5;

  const handleVote = (type: 'upvote' | 'downvote') => {
    onVote(id, type);
  };

  const displayedChildren = showAllReplies ? children : children.slice(0, REPLY_LIMIT);

  const formattedDate = new Date(created_at).toLocaleString('en-GB', { hourCycle: 'h23', timeZone: 'Europe/Athens' });

  return (
    <div id={id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mantine-spacing-xs)', marginBlock: 'var(--mantine-spacing-sm)', scrollMarginTop: '56px' }}>
      <Card withBorder radius="md" p="md" style={id === highlightedCommentId ? { border: '2px solid var(--mantine-color-blue-filled)' } : {}}>
        <Text fw={500}>{username} <Text span size="sm" c="dimmed">• {formattedDate}{pinned && ' • Pinned'}</Text></Text>
        <Text size="sm" c="dimmed" mt={4} component="div" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} unwrapDisallowed={true}>
            {comment}
          </ReactMarkdown>
        </Text>
        <Group mt="xs">
          <Group gap={0} style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 'var(--mantine-radius-md)' }}>
            <ActionIcon variant={userVote === 'upvote' ? 'filled' : 'subtle'} color="blue" onClick={() => handleVote('upvote')} size="lg" radius="md">
              <IconArrowUp size={18} />
            </ActionIcon>
            <Text size="sm" fw={500} px="xs">
              {score}
            </Text>
            <ActionIcon variant={userVote === 'downvote' ? 'filled' : 'subtle'} color="red" onClick={() => handleVote('downvote')} size="lg" radius="md">
              <IconArrowDown size={18} />
            </ActionIcon>
          </Group>
          <Button variant="subtle" size="xs" leftSection={<IconMessageCircle size={14} />} onClick={() => onReply(id, username)} disabled={depth >= 4}>
            Reply
          </Button>
          <CopyButton value={`${window.location.origin}/comments#${id}`} timeout={2000}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Copied' : 'Copy link'} withArrow position="right">
                <ActionIcon color={copied ? 'teal' : 'blue'} variant="subtle" onClick={copy}>
                  {copied ? <IconCheck size={16} /> : <IconLink size={16} />}
              </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
          {children.length > 0 && (
            <Button variant="subtle" size="xs" onClick={() => setShowReplies(!showReplies)} leftSection={showReplies ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}>
              {showReplies ? 'Hide' : `Show ${children.length}`} replies
            </Button>
          )}
        </Group>
      </Card>
      {showReplies && children.length > 0 && (
        <div style={{ paddingLeft: 'var(--mantine-spacing-lg)', borderLeft: '2px solid var(--mantine-color-gray-3)' }}>
          {displayedChildren.map((childComment) => (
            <CommentCard
              key={childComment.id}
              {...childComment}
              onVote={onVote}
              allUserVotes={allUserVotes}
              onReply={onReply}
            />
          ))}
          {children.length > REPLY_LIMIT && !showAllReplies && (
            <Button variant="subtle" size="xs" onClick={() => setShowAllReplies(true)}>
              Show {children.length - REPLY_LIMIT} more replies
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentCard;