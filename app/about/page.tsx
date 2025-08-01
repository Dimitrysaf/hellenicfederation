import { Container, Title, Card, Text, Group, Anchor } from '@mantine/core';
import { IconBrandGithub, IconMail } from '@tabler/icons-react';
import { MantineLogo } from '@mantinex/mantine-logo';

export default function AboutPage() {
  return (
    <Container>
      <Title style={{ marginBottom: '2rem' }}><b>Σχετικά</b></Title>
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ marginBottom: '2rem' }}>
        <Title order={2}><b>Η Ιδέα</b></Title>
        <Text>
          Η ιδέα για αυτό το <b>Ομοσπονδιακό Σύνταγμα</b> γεννήθηκε μέσα από βαθύ προβληματισμό για τις χρόνιες παθογένειες του ελληνικού πολιτικού συστήματος. 
          Η συγκέντρωση εξουσίας, η έλλειψη πραγματικής λογοδοσίας και η απομάκρυνση του πολίτη από τη λήψη αποφάσεων, 
          με ώθησαν να αναζητήσω ένα ριζικά διαφορετικό πλαίσιο διακυβέρνησης. Πιστεύω ακράδαντα ότι η Ελλάδα χρειάζεται 
          ένα Σύνταγμα που να είναι πραγματικά ένα 'κοινωνικό συμβόλαιο' – ένα κείμενο που όχι μόνο ρυθμίζει τους θεσμούς, 
          αλλά ενδυναμώνει τον πολίτη και διασφαλίζει τη διαφάνεια σε κάθε επίπεδο.
        </Text>
      </Card>
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ marginBottom: '2rem' }}>
        <Title order={2}><b>Τεχνικά</b></Title>
        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ marginTop: '1rem' }}>
          <Group>
            <IconBrandGithub size={24} />
            <Anchor href="https://github.com/Dimitrysaf/hellenicfederation" target="_blank" rel="noopener noreferrer">
              Dimitrysaf/hellenicfederation
            </Anchor>
          </Group>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ marginTop: '1rem' }}>
          <Group>
            <MantineLogo size={24} />
            <Anchor href="https://mantine.dev/" target="_blank" rel="noopener noreferrer">
              Βιβλιοθήκη Mantine Widget
            </Anchor>
          </Group>
        </Card>

      </Card>
            <Card shadow="sm" padding="lg" radius="md" withBorder style={{ marginBottom: '2rem' }}>
        <Title order={2}><b>Επικοινωνία</b></Title>
        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ marginTop: '1rem' }}>
          <Group>
            <IconMail size={24} />
            <Anchor href="mailto:demetresmeliates+me@gmail.com">
              demetresmeliates+me@gmail.com
            </Anchor>
          </Group>
        </Card>
        
      </Card>
    </Container>
  );
}
