'use client';

import { useEffect, useState } from 'react';
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
import { FAQ } from '../../db/faqs';

export function FaqTab() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [editedQuestion, setEditedQuestion] = useState('');
  const [editedAnswer, setEditedAnswer] = useState('');
  const [editedOrder, setEditedOrder] = useState<number | string>('');
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/faqs')
      .then((res) => res.json())
      .then((data) => {
        setFaqs(data.sort((a: FAQ, b: FAQ) => a.order - b.order));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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
      onConfirm: () => {
        let updatedFaqs = faqs.filter((faq) => faq.id !== id);
        updatedFaqs = updatedFaqs
          .sort((a, b) => a.order - b.order)
          .map((faq, index) => ({ ...faq, order: index + 1 }));
        setFaqs(updatedFaqs);
        fetch('/api/faqs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedFaqs),
        });
      },
    });
  };

  const handleSave = () => {
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
    fetch('/api/faqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalFaqs),
    });
    close();
    setSelectedFaq(null);
  };

  const handleCloseModal = () => {
    close();
    setSelectedFaq(null);
  };

  const rows = faqs.map((faq) => (
    <Table.Tr key={faq.id}>
      <Table.Td>{faq.order}</Table.Td>
      <Table.Td>{faq.question}</Table.Td>
      <Table.Td>
        <Group justify="flex-end">
          <Button size="xs" color="red" onClick={() => handleDelete(faq.id)}><IconTrash size={14} /></Button>
          <Button size="xs" onClick={() => handleEdit(faq)}><IconEdit size={14} /></Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container>
      <Group justify="space-between" style={{ marginBottom: 16 }}>
        <Title><b>Πίνακας συχνών ερωτήσεων</b></Title>
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
              <Table.Th>Ερώτηση</Table.Th>
              <Table.Th style={{ width: '14%' }}>Ενέργειες</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
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
    </Container>
  );
}
