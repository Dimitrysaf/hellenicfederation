'use client';

import { useState, useEffect } from 'react';
import { Tabs, Container, Group, Title, Modal, PinInput, Button, Text, Center } from '@mantine/core';
import { ArticlesTab } from '../../components/ArticlesTab/ArticlesTab';
import { FaqTab } from '../../components/FaqTab/FaqTab';
import { useRouter } from 'next/navigation';
import { useDisclosure } from '@mantine/hooks';

export default function AdminPage() {
  const [twoFaRequired, setTwoFaRequired] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaError, setTwoFaError] = useState('');
  const [modalOpened, { open, close }] = useDisclosure(false);
  const router = useRouter();

  useEffect(() => {
    const check2Fa = async () => {
      const response = await fetch('/api/check-2fa-status');
      const data = await response.json();
      if (data.required) {
        setTwoFaRequired(true);
        open();
      }
    };
    check2Fa();
  }, [open]);

  const handle2FaSubmit = async () => {
    setTwoFaError('');
    const response = await fetch('/api/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: twoFaCode }),
    });

    const data = await response.json();

    if (response.ok) {
      setTwoFaRequired(false);
      close();
      router.refresh();
    } else {
      setTwoFaError(data.message || 'Invalid 2FA code');
    }
  };

  return (
    <Container>
      <Modal
        opened={modalOpened}
        onClose={() => {}}
        withCloseButton={false}
        closeOnClickOutside={false}
        closeOnEscape={false}
        title={<Title order={3}>Two-Factor Authentication</Title>}
        centered
      >
        <Text size="sm" mb="md">Please enter the 6-digit code from your authenticator app.</Text>
        <Center>
          <PinInput value={twoFaCode} onChange={setTwoFaCode} length={6} oneTimeCode={true} error={!!twoFaError} />
        </Center>
        {twoFaError ? <Text color="red" size="sm" mt="sm" ta="center">{twoFaError}</Text> : null}
        <Group justify="center" mt="xl">
          <Button onClick={handle2FaSubmit} disabled={twoFaCode.length !== 6}>Verify</Button>
        </Group>
      </Modal>

      <div style={{ pointerEvents: twoFaRequired ? 'none' : 'auto', opacity: twoFaRequired ? 0.5 : 1 }}>
        <Group justify="space-between" style={{ marginBottom: 16 }}>
          <Title><b>Διαχείριση</b></Title>
        </Group>

        <Tabs defaultValue="articles">
          <Tabs.List>
            <Tabs.Tab value="articles">Άρθρα</Tabs.Tab>
            <Tabs.Tab value="faqs">Ερωτήσεις</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="articles" pt="xs">
            <ArticlesTab />
          </Tabs.Panel>

          <Tabs.Panel value="faqs" pt="xs">
            <FaqTab />
          </Tabs.Panel>
        </Tabs>
      </div>
    </Container>
  );
}
