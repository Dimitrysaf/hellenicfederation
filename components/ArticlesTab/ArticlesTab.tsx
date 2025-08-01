'use client';

import { useEffect, useState } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Button,
  Container,
  Group,
  Modal,
  NumberInput,
  Table,
  Text,
  TextInput,
  Title,
  Stack,
  LoadingOverlay,
  Box,
  Flex,
  Pagination,
  Loader,
  Center,
  CopyButton,
  Tooltip,
  ActionIcon,
  SimpleGrid
} from '@mantine/core';
import { IconEdit, IconTrash, IconPlus, IconSearch, IconCopy, IconCheck, IconEye } from '@tabler/icons-react';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { Link, RichTextEditor } from '@mantine/tiptap';
import { Article } from '@/db/articles';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import { OrderedListExtension } from './OrderedListExtension';
import ErrorDisplay from '../ErrorDisplay/ErrorDisplay';

const ARTICLES_PER_PAGE = 10;

export function ArticlesTab() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedNumber, setEditedNumber] = useState<number | string>('');
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(true);
  const [isSavingOrDeleting, setIsSavingOrDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 300);
  const [activePage, setActivePage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
       bulletList:{
        HTMLAttributes: {
          class: "bullet_class",
          style: "padding-left: 15px;",
         },
       },
       orderedList: false,
       heading: {
        HTMLAttributes: {
          class: "headers_class",
         },
        },
      }),
      Link,
      Highlight,
      Underline,
      SubScript,
      Superscript,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      OrderedListExtension,
    ],
    content: '',
    immediatelyRender: false,
  });

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      const filteredArticles = data.filter((article: Article) =>
        article.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
      setArticles(filteredArticles.sort((a: Article, b: Article) => a.number - b.number));
      setTotalPages(Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE));
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (selectedArticle) {
      setEditedName(selectedArticle.name);
      setEditedNumber(selectedArticle.number);
      editor?.commands.setContent(selectedArticle.content);
    } else {
      setEditedName('');
      setEditedNumber(articles.length + 1);
      editor?.commands.setContent('');
    }
  }, [selectedArticle, editor, articles.length]);

  const handleEdit = (article: Article) => {
    setSelectedArticle(article);
    open();
  };

  const handleAdd = () => {
    setSelectedArticle(null);
    open();
  };

  const handleDelete = (id: string) => {
    modals.openConfirmModal({
      title: 'Διαγραφή άρθρου',
      children: (
        <Text size="sm">
          Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτό το άρθρο; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
        </Text>
      ),
      labels: { confirm: 'Διαγραφή', cancel: 'Ακύρωση' },
      onConfirm: async () => {
        setIsSavingOrDeleting(true);
        let updatedArticles = articles.filter((article) => article.id !== id);
        updatedArticles = updatedArticles
          .sort((a, b) => a.number - b.number)
          .map((article, index) => ({ ...article, number: index + 1 }));
        setArticles(updatedArticles);
        try {
          const response = await fetch('/api/articles', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedArticles),
          });

          if (!response.ok) {
            throw new Error('Failed to delete article');
          }
          fetchArticles();
        } catch (error) {
          if (error instanceof Error) {
            setError(error.message);
          } else {
            setError('An unknown error occurred');
          }
        } finally {
          setIsSavingOrDeleting(false);
        }
      },
    });
  };

  const handleSave = async () => {
    setIsSavingOrDeleting(true);
    if (!editor) {
      return;
    }

    const newNumber = typeof editedNumber === 'string' ? parseInt(editedNumber, 10) : editedNumber;
    const newName = editedName.trim();

    if (!newName || editor.isEmpty) {
      modals.open({
        title: 'Ελλιπές άρθρο',
        children: <Text size="sm">Το όνομα και το περιεχόμενο του άρθρου δεν μπορούν να είναι κενά.</Text>,
      });
      return;
    }

    if (newNumber < 1) {
      modals.open({
        title: 'Μη έγκυρος αριθμός άρθρου',
        children: <Text size="sm">Ο αριθμός άρθρου δεν μπορεί να είναι μικρότερος από 1.</Text>,
      });
      return;
    }

    const articleToSave = {
      id: selectedArticle ? selectedArticle.id : Date.now().toString(),
      name: newName,
      number: newNumber,
      content: editor.getHTML(),
    };

    const currentArticles = articles.filter((a) => a.id !== selectedArticle?.id);

    // Find the correct insertion index
    let insertIndex = currentArticles.findIndex(a => a.number >= newNumber);
    if (insertIndex === -1) {
      insertIndex = currentArticles.length; // Insert at the end if no article has a greater or equal number
    }

    // Insert the new/edited article at the determined index
    currentArticles.splice(insertIndex, 0, articleToSave);

    // Renumber all articles sequentially from 1
    const finalArticles = currentArticles.map((article, index) => ({
      ...article,
      number: index + 1,
    }));

    

    setArticles(finalArticles);
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalArticles),
      });

      if (!response.ok) {
        throw new Error('Failed to save articles');
      }

      fetchArticles();

      close();
      setSelectedArticle(null);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsSavingOrDeleting(false);
    }
  };

  const handleCloseModal = () => {
    close();
    setSelectedArticle(null);
  };

  const handleView = (id: string) => {
    window.open(`/#${id}`, '_blank');
  };

  const startIndex = (activePage - 1) * ARTICLES_PER_PAGE;
  const endIndex = startIndex + ARTICLES_PER_PAGE;
  const paginatedArticles = articles.slice(startIndex, endIndex);

  const rows = paginatedArticles.map((article) => (
    <Table.Tr key={article.id}>
      <Table.Td visibleFrom="sm">
        <CopyButton value={article.id} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Copied' : 'Copy ID'} withArrow position="right">
              <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Table.Td>
      <Table.Td visibleFrom="sm">{article.number}</Table.Td>
      <Table.Td>{article.name}</Table.Td>
      <Table.Td style={{ maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis' }} visibleFrom="sm">
        <Text lineClamp={2} style={{ wordBreak: 'break-word' }}>{article.content}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <ActionIcon variant="light" color="blue" onClick={() => handleView(article.id)} title="View Article">
            <IconEye size={16} />
          </ActionIcon>
          <ActionIcon variant="light" color="blue" onClick={() => handleEdit(article)} title="Edit Article">
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon variant="light" color="red" onClick={() => handleDelete(article.id)} title="Delete Article">
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="md">
        <Text fz="lg" fw={700}>Manage Articles</Text>
        <SimpleGrid cols={2}>
          <TextInput
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
          />
          <Button onClick={handleAdd} leftSection={<IconPlus size={14} />}>Add Article</Button>
        </SimpleGrid>
      </Flex>

      {loading ? (
        <Center style={{ height: 200 }}>
          <Loader />
        </Center>
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : articles.length === 0 ? (
        <Center style={{ height: 200 }}>
          <Text>No articles found.</Text>
        </Center>
      ) : (
        <>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: '0%' }} visibleFrom="sm">ID</Table.Th>
                <Table.Th style={{ width: '5%' }} visibleFrom="sm">Number</Table.Th>
                <Table.Th style={{ width: '15%' }}>Name</Table.Th>
                <Table.Th style={{ width: '50%' }} visibleFrom="sm">Content</Table.Th>
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

      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title={selectedArticle ? 'Επεξεργασία' : 'Προσθήκη'}
        size="xl"
      >
        <LoadingOverlay visible={isSavingOrDeleting} />
        <TextInput
          label="Όμονα άρθρου"
          value={editedName}
          onChange={(event) => setEditedName(event.currentTarget.value)}
        />
        <NumberInput
          label="Αριθμός άρθρου"
          value={editedNumber}
          onChange={setEditedNumber}
          min={1}
        /><br></br>
        <RichTextEditor editor={editor}>
          <RichTextEditor.Toolbar sticky stickyOffset={60}>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.Underline />
              <RichTextEditor.Strikethrough />
              <RichTextEditor.ClearFormatting />
              <RichTextEditor.Highlight />
              <RichTextEditor.Code />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.H1 />
              <RichTextEditor.H2 />
              <RichTextEditor.H3 />
              <RichTextEditor.H4 />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Blockquote />
              <RichTextEditor.Hr />
              <RichTextEditor.BulletList />
              <RichTextEditor.OrderedList />
              <RichTextEditor.Subscript />
              <RichTextEditor.Superscript />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Link />
              <RichTextEditor.Unlink />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.AlignLeft />
              <RichTextEditor.AlignCenter />
              <RichTextEditor.AlignJustify />
              <RichTextEditor.AlignRight />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Undo />
              <RichTextEditor.Redo />
            </RichTextEditor.ControlsGroup>
          </RichTextEditor.Toolbar>

          <RichTextEditor.Content />
        </RichTextEditor>
        <Group style={{ marginTop: 16 }}>
          <Button onClick={handleSave}>Αποθήκευση</Button>
          <Button variant="default" onClick={handleCloseModal}>
            Ακύρωση
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}