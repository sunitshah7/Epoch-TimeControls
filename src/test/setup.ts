import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// jsdom doesn't implement matchMedia, but Mantine's color-scheme and
// responsive hooks call it on every mount.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

// jsdom doesn't implement ResizeObserver, which Mantine's Select/Combobox
// and other components rely on.
if (!window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom doesn't implement scrollIntoView, which Mantine's Select/Combobox
// call when navigating options with the keyboard.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom has no FontFaceSet (document.fonts); some Mantine inputs listen
// for font-load events on it to re-measure themselves.
if (!document.fonts) {
  // @ts-expect-error -- minimal stub, not a full FontFaceSet
  document.fonts = {
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}
