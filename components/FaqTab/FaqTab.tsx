'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Group,
  Text,
  TextInput,
  Box,
  Flex,
  Pagination,
  Loader,
  Center,
  CopyButton,
  Tooltip,
  ActionIcon,
  Modal, 
  NumberInput,
  SimpleGrid
} from '@mantine/core';
import { IconEdit, IconTrash, IconPlus, IconSearch, IconCopy, IconCheck } from '@tabler/icons-react';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { FAQ } from '@/db/faqs';
import ErrorDisplay from '../ErrorDisplay/ErrorDisplay';

const FAQS_PER_PAGE = 10;

export function FaqTab() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [editedQuestion, setEditedQuestion] = useState('');
  const [editedAnswer, setEditedAnswer] = useState('');
  const [editedOrder, setEditedOrder] = useState<number | string>('');
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 300);
  const [activePage, setActivePage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/faqs');
        const data = await res.json();
        const filteredFaqs = data.filter((faq: FAQ) =>
          faq.question.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
        setFaqs(filteredFaqs.sort((a: FAQ, b: FAQ) => a.order - b.order));
        setTotalPages(Math.ceil(filteredFaqs.length / FAQS_PER_PAGE));
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (selectedFaq) {
      setEditedQuestion(selectedFaq.question);
      setEditedAnswer(selectedFaq.answer);
      setEditedOrder(selectedFaq.order);
    } else {
      setEditedQuestion('');
      setEditedAnswer('');
      setEditedOrder(faqs.length + 1);
    }
  }, [selectedFaq, faqs.length]);

  const handleEdit = (faq: FAQ) => {
    setSelectedFaq(faq);
    open();
  };

  const handleAdd = () => {
    setSelectedFaq(null);
    open();
  };

  const handleDelete = (id: string) => {
    modals.openConfirmModal({
      title: 'Διαγραφή FAQ',
      children: (
        <Text size="sm">
          Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτήν την ερώτηση; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
        </Text>
      ),
      labels: { confirm: 'Διαγραφή', cancel: 'Ακύρωση' },
      onConfirm: async () => {
        let updatedFaqs = faqs.filter((faq) => faq.id !== id);
        updatedFaqs = updatedFaqs
          .sort((a, b) => a.order - b.order)
          .map((faq, index) => ({ ...faq, order: index + 1 }));
        setFaqs(updatedFaqs);
        try {
          const response = await fetch('/api/faqs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedFaqs),
          });

          if (!response.ok) {
            throw new Error('Failed to delete FAQ');
          }
          fetchFaqs();
        } catch (error: any) {
          setError(error.message);
          modals.open({
            title: 'Σφάλμα',
            children: <Text size="sm">Προέκυψε σφάλμα κατά τη διαγραφή της συχνής ερώτησης.</Text>,
          });
        }
      },
    });
  };

  const handleSave = async () => {
    const newOrder = typeof editedOrder === 'string' ? parseInt(editedOrder, 10) : editedOrder;
    const newQuestion = editedQuestion.trim();
    const newAnswer = editedAnswer.trim();

    if (!newQuestion || !newAnswer) {
      modals.open({
        title: 'Ελλιπές FAQ',
        children: <Text size="sm">Η ερώτηση και η απάντηση δεν μπορούν να είναι κενές.</Text>,
      });
      return;
    }

    if (newOrder < 1) {
      modals.open({
        title: 'Μη έγκυρος αριθμός σειράς',
        children: <Text size="sm">Ο αριθμός σειράς δεν μπορεί να είναι μικρότερος από 1.</Text>,
      });
      return;
    }

    const faqToSave = {
      id: selectedFaq ? selectedFaq.id : Date.now().toString(),
      question: newQuestion,
      answer: newAnswer,
      order: newOrder,
    };

    let currentFaqs = faqs.filter((f) => f.id !== selectedFaq?.id);

    let insertIndex = currentFaqs.findIndex(f => f.order >= newOrder);
    if (insertIndex === -1) {
      insertIndex = currentFaqs.length;
    }

    currentFaqs.splice(insertIndex, 0, faqToSave);

    const finalFaqs = currentFaqs.map((faq, index) => ({
      ...faq,
      order: index + 1,
    }));

    setFaqs(finalFaqs);
    try {
      const response = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalFaqs),
      });

      if (!response.ok) {
        throw new Error('Failed to save FAQs');
      }

      fetchFaqs();

      close();
      setSelectedFaq(null);
    } catch (error: any) {
      setError(error.message);
      modals.open({
        title: 'Σφάλμα',
        children: <Text size="sm">Προέκυψε σφάλμα κατά την αποθήκευση των συχνών ερωτήσεων.</Text>,
      });
    }
  };

  const handleCloseModal = () => {
    close();
    setSelectedFaq(null);
  };

  const startIndex = (activePage - 1) * FAQS_PER_PAGE;
  const endIndex = startIndex + FAQS_PER_PAGE;
  const paginatedFaqs = faqs.slice(startIndex, endIndex);

  const rows = paginatedFaqs.map((faq) => (
    <Table.Tr key={faq.id}>
      <Table.Td visibleFrom="sm">
        <CopyButton value={faq.id} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Copied' : 'Copy ID'} withArrow position="right">
              <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Table.Td>
      <Table.Td visibleFrom="sm">{faq.order}</Table.Td>
      <Table.Td>{faq.question}</Table.Td>
      <Table.Td style={{ maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis' }} visibleFrom="sm">
        <Text lineClamp={2} style={{ wordBreak: 'break-word' }}>{faq.answer}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <ActionIcon variant="light" color="blue" onClick={() => handleEdit(faq)} title="Edit FAQ">
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon variant="light" color="red" onClick={() => handleDelete(faq.id)} title="Delete FAQ">
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="md">
        <Text fz="lg" fw={700}>Manage FAQs</Text>
        <SimpleGrid cols={2}>
          <TextInput
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
          />
          <Button onClick={handleAdd} leftSection={<IconPlus size={14} />}>Add FAQ</Button>
        </SimpleGrid>
      </Flex>

      {loading ? (
        <Center style={{ height: 200 }}>
          <Loader />
        </Center>
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : faqs.length === 0 ? (
        <Center style={{ height: 200 }}>
          <Text>No FAQs found.</Text>
        </Center>
      ) : (
        <>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: '0%' }} visibleFrom="sm">ID</Table.Th>
                <Table.Th style={{ width: '5%' }} visibleFrom="sm">Order</Table.Th>
                <Table.Th style={{ width: '20%' }}>Question</Table.Th>
                <Table.Th style={{ width: '50%' }} visibleFrom="sm">Answer</Table.Th>
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
        title={selectedFaq ? 'Επεξεργασία FAQ' : 'Προσθήκη FAQ'}
        size="xl"
      >
        <TextInput
          label="Ερώτηση"
          value={editedQuestion}
          onChange={(event) => setEditedQuestion(event.currentTarget.value)}
        />
        <TextInput
          label="Απάντηση"
          value={editedAnswer}
          onChange={(event) => setEditedAnswer(event.currentTarget.value)}
        />
        <NumberInput
          label="Σειρά"
          value={editedOrder}
          onChange={setEditedOrder}
          min={1}
        /><br></br>
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
