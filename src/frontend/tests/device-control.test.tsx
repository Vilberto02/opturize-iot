import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { DeviceControlDialog } from '../src/components/control/DeviceControlDialog';
import { useControlStore, usePlacesStore } from '../src/stores';
import { sendDeviceControl } from '../src/api';
import { deferred, place } from './fixtures';

vi.mock('../src/api', () => ({ sendDeviceControl: vi.fn(), getPlaces: vi.fn(), getPlaceHistory: vi.fn() }));
const refresh = vi.fn().mockResolvedValue(undefined);
beforeEach(() => {
  vi.clearAllMocks();
  useControlStore.setState({ isSending: false, lastResponse: null, error: null });
  usePlacesStore.setState({ fetchPlaces: refresh });
});

it('valida vacío, decimales y rango sin perder el borrador durante el polling', async () => {
  const user = userEvent.setup();
  const { rerender } = render(<DeviceControlDialog place={place()} isOpen onClose={vi.fn()} />);
  const input = screen.getByRole('spinbutton');
  await user.clear(input); await user.tab();
  expect(screen.getByRole('alert').textContent).toContain('entre 1 y 5000');
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Aplicar nueva capacidad' }).disabled).toBe(true);
  await user.type(input, '5001');
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Aplicar nueva capacidad' }).disabled).toBe(true);
  await user.clear(input); await user.type(input, '1.5');
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Aplicar nueva capacidad' }).disabled).toBe(true);
  await user.clear(input); await user.type(input, '250');
  rerender(<DeviceControlDialog place={place(1, { max_capacity: 150 })} isOpen onClose={vi.fn()} />);
  expect((input as HTMLInputElement).value).toBe('250');
  rerender(<DeviceControlDialog place={place(2, { max_capacity: 80 })} isOpen onClose={vi.fn()} />);
  expect((input as HTMLInputElement).value).toBe('80');
  expect(sendDeviceControl).not.toHaveBeenCalled();
});

it('envía el payload actual, impide duplicados y actualiza datos tras éxito', async () => {
  const user = userEvent.setup();
  const pending = deferred<any>();
  vi.mocked(sendDeviceControl).mockReturnValue(pending.promise);
  render(<DeviceControlDialog place={place()} isOpen onClose={vi.fn()} />);
  await user.clear(screen.getByRole('spinbutton')); await user.type(screen.getByRole('spinbutton'), '200');
  await user.click(screen.getByRole('button', { name: 'Aplicar nueva capacidad' }));
  expect(sendDeviceControl).toHaveBeenCalledWith(1, { comando: 'set_capacidad', valor: 200 });
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Resetear' }).disabled).toBe(true);
  expect(screen.getByText('Enviando comando al dispositivo…')).toBeTruthy();
  await act(async () => pending.resolve({ status: 'ok', topic: 'control/1', device_id: 'ESP32-1', payload: {} }));
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Comando enviado')).toBeTruthy();
});

it('conserva los comandos de barrera y reset y muestra fallos recuperables', async () => {
  const user = userEvent.setup();
  vi.mocked(sendDeviceControl).mockRejectedValue(new Error('No pudimos enviar el comando. Reintenta.'));
  render(<DeviceControlDialog place={place()} isOpen onClose={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: 'Forzar cierre' }));
  expect(sendDeviceControl).toHaveBeenCalledWith(1, { comando: 'forzar_barrera', abrir: false });
  expect(screen.getByRole('alert').textContent).toContain('Reintenta');
  expect(refresh).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Resetear' }));
  expect(sendDeviceControl).toHaveBeenLastCalledWith(1, { comando: 'reset_aforo' });
});

it('cierra con Escape y restaura foco y scroll al desmontar', async () => {
  const close = vi.fn();
  const trigger = document.createElement('button'); document.body.append(trigger); trigger.focus();
  const { unmount } = render(<DeviceControlDialog place={place()} isOpen onClose={close} />);
  expect(document.body.style.overflow).toBe('hidden');
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
  expect(close).toHaveBeenCalledTimes(1);
  unmount();
  expect(document.body.style.overflow).toBe('');
  expect(document.activeElement).toBe(trigger);
  trigger.remove();
});

it('no muestra en otra sesión la respuesta de un modal cerrado', async () => {
  const pending = deferred<any>();
  vi.mocked(sendDeviceControl).mockReturnValue(pending.promise);
  const send = useControlStore.getState().sendRemoteControl(1, { comando: 'reset_aforo' });
  useControlStore.getState().clearControlStatus();
  pending.resolve({ status: 'ok', topic: 'control/1', device_id: 'ESP32-1', payload: {} });
  await send;
  expect(useControlStore.getState().lastResponse).toBe(null);
  expect(useControlStore.getState().isSending).toBe(false);
});
