'use client';

import { Container, Title, Text, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Article } from '../db/articles';

export default function ConstitutionPage() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    fetch('/api/articles')
      .then((res) => res.json())
      .then((data) => {
        setArticles(data.sort((a: Article, b: Article) => a.number - b.number));
      });
  }, []);

  return (
    <Container>
      <Title style={{ marginBottom: '2rem' }}>Σύνταγμα</Title>
      <Stack>
        {articles.map((article) => (
          <div key={article.id}>
            <Title order={2}>Άρθρο {article.number} - {article.name}</Title>
            <Text dangerouslySetInnerHTML={{ __html: article.content }} />
          </div>
        ))}
      </Stack>
    </Container>
  );
}