import React from 'react';
import { Card, Text, Center, Stack } from '@mantine/core';

interface ErrorDisplayProps {
  message: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
  return (
    <Center style={{ height: 200 }}>
      <Card withBorder radius="md" p="lg" shadow="sm">
        <Stack align="center">
          <Text style={{ fontSize: '3rem' }}>😢</Text>
          <Text color="red" size="lg" ta="center">Error: {message}</Text>
        </Stack>
      </Card>
    </Center>
  );
};

export default ErrorDisplay;
