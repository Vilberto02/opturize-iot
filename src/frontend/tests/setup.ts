import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(cleanup);
Object.defineProperty(window, 'matchMedia', { value: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })) });
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { value: function(this: HTMLDialogElement) { this.setAttribute('open', ''); } });
Object.defineProperty(HTMLDialogElement.prototype, 'close', { value: function(this: HTMLDialogElement) { this.removeAttribute('open'); } });
HTMLElement.prototype.scrollIntoView = vi.fn();
