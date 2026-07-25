import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SpecialGameRoom } from './special-game-room';

const socketMock = vi.hoisted(() => {
  const listeners = new Map<string, (...args: never[]) => void>();
  return {
    id: 'socket-host',
    listeners,
    emit: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn((event: string, listener: (...args: never[]) => void) => {
      listeners.set(event, listener);
    }),
  };
});

vi.mock('socket.io-client', () => ({
  io: () => socketMock,
}));

describe('SpecialGameRoom', () => {
  afterEach(() => {
    socketMock.emit.mockClear();
    socketMock.disconnect.mockClear();
    socketMock.listeners.clear();
  });

  it('shows the parallel-world rules and creates a room after connecting', async () => {
    const user = userEvent.setup();
    render(<SpecialGameRoom mode="parallel-world" initialPin="" />);

    expect(screen.getByRole('heading', { name: 'العالم الموازي' })).toBeInTheDocument();
    expect(screen.getByText('٢ لاعبين')).toBeInTheDocument();

    socketMock.listeners.get('connect')?.();
    await user.click(screen.getByRole('button', { name: /أنشئ الغرفة/ }));

    expect(socketMock.emit).toHaveBeenCalledWith('special:room:create', {
      mode: 'parallel-world',
    });
  });

  it('prefills a QR invitation code and submits a player name', async () => {
    const user = userEvent.setup();
    render(<SpecialGameRoom mode="reverse-time" initialPin="123456" />);
    socketMock.listeners.get('connect')?.();

    await user.type(screen.getByLabelText('اسم اللاعب'), 'نورة');
    await user.click(screen.getByRole('button', { name: /ادخل الغرفة/ }));

    expect(socketMock.emit).toHaveBeenCalledWith('special:room:join', {
      pin: '123456',
      playerName: 'نورة',
    });
  });

  it('renders a scannable QR invitation after the room is created', () => {
    render(<SpecialGameRoom mode="parallel-world" initialPin="" />);

    act(() => {
      socketMock.listeners.get('connect')?.();
      socketMock.listeners.get('special:room:state')?.({
        pin: '654321',
        hostId: 'socket-host',
        mode: 'parallel-world',
        phase: 'lobby',
        roundIndex: 0,
        roundCount: 6,
        players: [],
      } as never);
    });

    expect(screen.getByLabelText('رمز QR للانضمام إلى الغرفة 654321')).toBeInTheDocument();
    expect(screen.getByText('654321')).toBeInTheDocument();
  });
});
