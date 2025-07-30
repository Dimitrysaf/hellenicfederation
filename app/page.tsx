'use client';

import { Card, Container, Title, Text, Stack, Skeleton, ActionIcon, CopyButton, Group } from '@mantine/core';
import { IconLink, IconCheck } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Article } from '@/db/articles';
import classes from './page.module.css';

export default function ConstitutionPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/articles')
      .then((res) => res.json())
      .then((data) => {
        setArticles(data.sort((a: Article, b: Article) => a.number - b.number));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Container>
        <Title style={{ marginBottom: '2rem' }}><b>Σύνταγμα</b></Title>
        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ marginBottom: '2rem' }}>
          <Title order={2} style={{ fontFamily: 'Times New Roman' }}><b>Προοίμιο</b></Title>
          <Text style={{ fontFamily: 'Times New Roman' }}>
            <b><i>Επικαλούμενοι τη βούληση του Ελληνικού Λαού και των συνιστωσών αυτού Περιφερειών,</i><br></br>
            Επιβεβαιώνοντες απαρασάλευτα τας δημοκρατικάς αρχάς, την ανθρώπινην αξιοπρέπειαν, την ελευθερίαν, την δικαιοσύνην, την αλληλεγγύην, την λογοδοσίαν και την διαφάνειαν,<br></br>
            Δεσμευόμενοι ανεπιφυλάκτως εις το κράτος δικαίου, την ειρήνην, την βιωσιμότητα και την εξωστρέφειαν,<br></br>
            Αναγνωρίζοντες την αδιάσπαστον ιστορικήν συνέχειαν του Έθνους, εν ταυτώ δε διακηρύττοντες την προσήλωσιν εις μίαν ανανεωμένην ομοσπονδιακήν δομήν και την ενίσχυσιν της ενεργού συμμετοχής των πολιτών.<br></br>
            <i>Ο Ελληνικός Λαός και οι συνιστώσαι αυτού Περιφέρειαι, εν ασκήσει της εκ φύσεως και ιστορίας απορρεούσης συντακτικής αυτών εξουσίας, αναδημιουργούσι το παρόν Σύνταγμα</i>:</b>
          </Text>
        </Card>
        {loading ? (
          <Stack>
            <Skeleton height={60} radius="sm" mb="md" />
            <Skeleton height={20} radius="sm" mb="xs" />
            <Skeleton height={20} radius="sm" mb="xs" />
            <Skeleton height={20} radius="sm" mb="xs" />
            <Skeleton height={60} radius="sm" mb="md" />
            <Skeleton height={20} radius="sm" mb="xs" />
            <Skeleton height={20} radius="sm" mb="xs" />
          </Stack>
        ) : (
          <Stack>
            {articles.map((article) => (
              <div key={article.id}>
                <Group style={{ alignItems: 'center' }} className={classes['article-heading-group']}>
                  <CopyButton value={`${window.location.origin}${window.location.pathname}#${article.id}`} timeout={2000}>
                    {({ copied, copy }) => (
                      <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy} className={classes['copy-button']}>
                        {copied ? <IconCheck size={16} /> : <IconLink size={16} />}
                      </ActionIcon>
                    )}
                  </CopyButton>
                  <Title order={3} id={article.id.toString()} style={{ scrollMarginTop: '56px' }}>
                    <a href={`#${article.id}`} style={{ color: 'inherit' }}>
                      Άρθρο {article.number} - {article.name}
                    </a>
                  </Title>
                </Group>
                <Text dangerouslySetInnerHTML={{ __html: article.content }} />
              </div>
            ))}
          </Stack>
        )}
      </Container>
    </>
  );
}