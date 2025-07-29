'use client';

import { useEffect, useState } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Tabs, Container, Group, Title } from '@mantine/core';
import { ArticlesTab } from '../../components/ArticlesTab/ArticlesTab';

export default function AdminPage() {
  return (
    <Container>
      <Group justify="space-between" style={{ marginBottom: 16 }}>
        <Title><b>Διαχείριση</b></Title>
      </Group>

      <Tabs defaultValue="articles">
        <Tabs.List>
          <Tabs.Tab value="articles">Άρθρα</Tabs.Tab>
          <Tabs.Tab value="faq">Ερωτήσεις</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="articles" pt="xs">
          <ArticlesTab />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}