'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Burger, Container, Drawer, Group, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { MantineLogo } from '@mantinex/mantine-logo';
import classes from './HeaderSimple.module.css';

import { ColorSchemeToggle } from '../ColorSchemeToggle/ColorSchemeToggle';

const links = [
  { link: '/', label: 'Σύνταγμα' },
  { link: '/faq', label: 'Ερωτήσεις' },
  { link: '/discuss', label: 'Συζήτηση' },
  { link: '/about', label: 'Σχετικά' },
];

export function HeaderSimple() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const [active, setActive] = useState(links[0].link);

  const items = links.map((link) => (
    <Link
      key={link.label}
      href={link.link}
      className={classes.link}
      data-active={active === link.link || undefined}
      onClick={() => {
        setActive(link.link);
        close();
      }}
    >
      {link.label}
    </Link>
  ));

  return (
    <header className={classes.header}>
      <Container size="md" className={classes.inner}>
        {/* TODO: Replace with logo */}
        <MantineLogo size={28} />
        <Group gap={5} visibleFrom="xs">
          {items}
        </Group>
        <Group>
          <ColorSchemeToggle />
          <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" />
        </Group>
        <Drawer opened={opened} onClose={close} title="Πλοήγηση" hiddenFrom="xs" size="md">
          <Stack>{items}</Stack>
        </Drawer>
      </Container>
    </header>
  );
}
