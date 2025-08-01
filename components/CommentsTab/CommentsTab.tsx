'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Group,
  Text,
  ActionIcon,
  Box,
  Flex,
  TextInput,
  Pagination,
  Loader,
  Center,
  CopyButton,
  Tooltip,
  SimpleGrid
} from '@mantine/core';
import { IconTrash, IconPinned, IconPinnedOff, IconEye, IconSearch, IconCopy, IconCheck } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import ErrorDisplay from '../ErrorDisplay/ErrorDisplay';

interface Comment {
  id: string;
  username: string;
  comment: string;
  upvotes: number;
  downvotes: number;
  parent_id?: string | null;
  score: number;
  created_at: string;
  depth: number;
  pinned: boolean;
}

const COMMENTS_PER_PAGE = 10;

export const CommentsTab: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 300);
  const [activePage, setActivePage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      const commentsWithScore = data.comments.map((comment: Comment) => ({
        ...comment,
        score: comment.upvotes - comment.downvotes,
      }));
      // Filter comments based on search query
      const filteredComments = commentsWithScore.filter((comment: Comment) =>
        comment.username.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        comment.comment.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
      setComments(filteredComments);
      setTotalPages(Math.ceil(filteredComments.length / COMMENTS_PER_PAGE));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [debouncedSearchQuery]); // Re-fetch when debounced search query changes

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        const response = await fetch(`/api/comments?id=${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to delete comment');
        }
        fetchComments(); // Refresh the list
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handlePin = async (id: string, currentPinnedStatus: boolean) => {
    try {
      const action = currentPinnedStatus ? 'unpin' : 'pin';
      const response = await fetch(`/api/comments?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} comment`);
      }
      fetchComments(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleView = (id: string) => {
    // Assuming your comments page can handle a direct link to a comment
    // You might need to adjust this URL based on your actual routing
    window.open(`/comments#${id}`, '_blank');
  };

  const startIndex = (activePage - 1) * COMMENTS_PER_PAGE;
  const endIndex = startIndex + COMMENTS_PER_PAGE;
  const paginatedComments = comments.slice(startIndex, endIndex);

  const rows = paginatedComments.map((comment) => (
    <Table.Tr key={comment.id}>
      <Table.Td visibleFrom="sm">
        <CopyButton value={comment.id} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Copied' : 'Copy ID'} withArrow position="right">
              <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Table.Td>
      <Table.Td>{comment.username}</Table.Td>
      <Table.Td style={{ maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <Text lineClamp={2} style={{ wordBreak: 'break-word' }}>{comment.comment}</Text>
      </Table.Td>
      <Table.Td visibleFrom="sm">{comment.score}</Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <ActionIcon variant="light" color="blue" onClick={() => handleView(comment.id)} title="View Comment">
            <IconEye size={16} />
          </ActionIcon>
          <ActionIcon
            variant="light"
            color={comment.pinned ? 'yellow' : 'gray'}
            onClick={() => handlePin(comment.id, comment.pinned)}
            title={comment.pinned ? 'Unpin Comment' : 'Pin Comment'}
          >
            {comment.pinned ? <IconPinnedOff size={16} /> : <IconPinned size={16} />}
          </ActionIcon>
          <ActionIcon variant="light" color="red" onClick={() => handleDelete(comment.id)} title="Delete Comment">
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="md">
        <Text fz="lg" fw={700}>Manage Comments</Text>
        <SimpleGrid cols={1}>
        <TextInput
          placeholder="Search comments..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
        />
        </SimpleGrid>
      </Flex>

      {loading ? (
        <Center style={{ height: 200 }}>
          <Loader />
        </Center>
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : comments.length === 0 ? (
        <Center style={{ height: 200 }}>
          <Text>No comments found.</Text>
        </Center>
      ) : (
        <>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: '0%' }} visibleFrom="sm">ID</Table.Th>
                <Table.Th style={{ width: '15%' }}>Username</Table.Th>
                <Table.Th style={{ width: '50%' }}>Comment</Table.Th>
                <Table.Th style={{ width: '0%' }} visibleFrom="sm">Votes</Table.Th>
                <Table.Th style={{ width: '0%' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
          <Group justify="flex-end" mt="md">
            <Pagination
              total={totalPages}
              value={activePage}
              onChange={setActivePage}
              siblings={1}
              boundaries={1}
            />
          </Group>
        </>
      )}
    </Box>
  );
};

export default CommentsTab;
