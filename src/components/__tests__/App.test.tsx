import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

function DummyComponent() {
  return <h1>Hello Kompleet</h1>;
}

describe('DummyComponent', () => {
  it('renders correctly', () => {
    render(<DummyComponent />);
    expect(screen.getByText('Hello Kompleet')).toBeInTheDocument();
  });
});
