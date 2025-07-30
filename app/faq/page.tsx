'use client';

import { useEffect, useState } from 'react';
import { Accordion, Container, Title, Text, Skeleton, Stack } from '@mantine/core';
import { FAQ } from '../../db/faqs';

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
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

  const items = faqs.map((item) => (
    <Accordion.Item key={item.id} value={item.id}>
      <Accordion.Control>{item.question}</Accordion.Control>
      <Accordion.Panel>
        <Text size="sm">{item.answer}</Text>
      </Accordion.Panel>
    </Accordion.Item>
  ));

  return (
    <Container>
      <Title style={{ marginBottom: '2rem' }}><b>Ερωτήσεις & Απαντήσεις</b></Title>
      {loading ? (
        <Stack>
          <Skeleton height={40} radius="sm" mb="md" />
          <Skeleton height={20} radius="sm" mb="xs" />
          <Skeleton height={40} radius="sm" mb="md" />
          <Skeleton height={20} radius="sm" mb="xs" />
        </Stack>
      ) : (
        <Accordion variant="filled">{items}</Accordion>
      )}
    </Container>
  );
}
