import { expect, it, vi } from 'vitest';
import { getPlaces } from '../src/api/placesApi';
import { apiFetch } from '../src/api/client';
import { place } from './fixtures';

vi.mock('../src/api/client', () => ({ apiFetch: vi.fn() }));

it('recorre todas las páginas antes de entregar los destinos', async () => {
  vi.mocked(apiFetch).mockResolvedValueOnce({ results: [place()], next: 'http://localhost/api/places/?page=2', count: 2 })
    .mockResolvedValueOnce({ results: [place(2)], next: null, count: 2 });
  expect((await getPlaces()).map(p => p.id)).toEqual([1, 2]);
  expect(vi.mocked(apiFetch).mock.calls.map(call => call[0])).toEqual(['/places/?page=1', '/places/?page=2']);
});

it('no entrega un resultado parcial si falla una página', async () => {
  vi.mocked(apiFetch).mockResolvedValueOnce({ results: [place()], next: '?page=2', count: 2 }).mockRejectedValueOnce(new Error('Sin conexión'));
  await expect(getPlaces()).rejects.toThrow('Sin conexión');
});
