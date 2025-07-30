import { Card, Container, Title, Text, Center } from '@mantine/core';

export default function NotFoundPage() {
  return (
    <Container size="sm" style={{ marginTop: '50px', marginBottom: '50px' }}>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Center>
          <Title order={1} style={{ fontSize: '150px', marginBottom: '20px' }}>
            🤷
          </Title>
        </Center>
        <Title order={2} ta="center" mb="md">404 - Δεν βρέθηκε η σελίδα</Title>
        <Text ta="center" size="lg">
          Αυτή η σελίδα που ψάχνετε δεν υπάρχει ή έχει μετακινηθεί.
        </Text>
      </Card>
    </Container>
  );
}