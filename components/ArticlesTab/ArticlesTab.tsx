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
  Skeleton,
  Stack,
} from '@mantine/core';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { Link, RichTextEditor } from '@mantine/tiptap';
import { Article } from '@/db/articles';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';

export function ArticlesTab() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedNumber, setEditedNumber] = useState<number | string>('');
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
       bulletList:{
        HTMLAttributes: {
          class: "bullet_class",
          style: "padding-left: 15px;",
         },
       },
       orderedList:{
        HTMLAttributes: {
          class: "order_class",
          style: "padding-left: 15px;",
         },
       },
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
    ],
    content: '',
    immediatelyRender: false,
  });

  useEffect(() => {
    fetch('/api/articles')
      .then((res) => res.json())
      .then((data) => {
        console.log('Articles state on mount:', data);
        setArticles(data.sort((a: Article, b: Article) => a.number - b.number));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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

          // Re-fetch articles to ensure local state is in sync with the database
          const updatedData = await fetch('/api/articles').then((res) => res.json());
          setArticles(updatedData.sort((a: Article, b: Article) => a.number - b.number));
        } catch (error) {
          console.error('Error deleting article:', error);
          modals.open({
            title: 'Σφάλμα',
            children: <Text size="sm">Προέκυψε σφάλμα κατά τη διαγραφή του άρθρου.</Text>,
          });
        }
      },
    });
  };

  const handleSave = async () => {
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

    let currentArticles = articles.filter((a) => a.id !== selectedArticle?.id);

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

    console.log('Final articles after renumbering:', finalArticles);

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

      // Re-fetch articles to ensure local state is in sync with the database
      const updatedData = await fetch('/api/articles').then((res) => res.json());
      setArticles(updatedData.sort((a: Article, b: Article) => a.number - b.number));

      close();
      setSelectedArticle(null);
    } catch (error) {
      console.error('Error saving articles:', error);
      modals.open({
        title: 'Σφάλμα',
        children: <Text size="sm">Προέκυψε σφάλμα κατά την αποθήκευση των άρθρων.</Text>,
      });
    }
  };

  const handleCloseModal = () => {
    close();
    setSelectedArticle(null);
  };

  const rows = articles.map((article) => (
    <Table.Tr key={article.id}>
      <Table.Td>{article.number}</Table.Td>
      <Table.Td>{article.name}</Table.Td>
      <Table.Td>
        <Group justify="flex-end">
          <Button size="xs" color="red" onClick={() => handleDelete(article.id)}><IconTrash size={14} /></Button>
          <Button size="xs" onClick={() => handleEdit(article)}><IconEdit size={14} /></Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container>
      <Group justify="space-between" style={{ marginBottom: 16 }}>
        <Title><b>Πίνακας άρθρων</b></Title>
        <Button onClick={handleAdd}><IconPlus size={14}/></Button>
      </Group>
      {loading ? (
        <Stack>
          <Skeleton height={40} radius="sm" />
          <Skeleton height={40} radius="sm" />
          <Skeleton height={40} radius="sm" />
          <Skeleton height={40} radius="sm" />
        </Stack>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: '1%' }}>Α/A</Table.Th>
              <Table.Th>Όνομα</Table.Th>
              <Table.Th style={{ width: '14%' }}>Ενέργειες</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      )}

      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title={selectedArticle ? 'Επεξεργασία' : 'Προσθήκη'}
        size="xl"
      >
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
    </Container>
  );
}
