import { render } from '@testing-library/react';
import App from './App.tsx';
import {expect, test} from "vitest";

test('renders without crashing', () => {
  // eslint-disable-next-line react/react-in-jsx-scope
  const { baseElement } = render(<App />);
  expect(baseElement).toBeDefined();
});
