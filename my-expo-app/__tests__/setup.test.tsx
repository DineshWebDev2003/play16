import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

// Example test to verify Jest is working
test('Jest is configured correctly', () => {
  const { getByText } = render(<Text>Hello Jest</Text>);
  expect(getByText('Hello Jest')).toBeTruthy();
});
