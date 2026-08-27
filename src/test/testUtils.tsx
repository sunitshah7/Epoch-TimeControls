import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';

// Every component under test renders Mantine components, which need a
// MantineProvider ancestor to resolve theme tokens/CSS variables.
export function renderWithProvider(ui: ReactElement, options?: RenderOptions) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <MantineProvider>{children}</MantineProvider>;
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
