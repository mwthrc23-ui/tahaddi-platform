import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPECIAL_GAME_META, SPECIAL_GAME_ORDER } from '@tahaddi/domain';
import { SpecialGameRoom } from './special-game-room';

const ioMock = vi.hoisted(() => vi.fn());

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
  io: (...args: unknown[]) => {
    ioMock(...args);
    return socketMock;
  },
}));

describe('SpecialGameRoom', () => {
  afterEach(() => {
    socketMock.emit.mockClear();
    socketMock.disconnect.mockClear();
    socketMock.listeners.clear();
    ioMock.mockClear();
  });

  it('shows the first room mode rules and creates a room after connecting', async () => {
    const user = userEvent.setup();
    const mode = SPECIAL_GAME_ORDER[0];
    render(<SpecialGameRoom mode={mode} initialPin="" />);

    expect(
      screen.getByRole('heading', { name: SPECIAL_GAME_META[mode].title }),
    ).toBeInTheDocument();
    expect(screen.getByText('٢ لاعبين')).toBeInTheDocument();
    expect(ioMock).toHaveBeenCalledWith(
      '/special-games',
      expect.objectContaining({
        transports: ['websocket', 'polling'],
      }),
    );

    socketMock.listeners.get('connect')?.();
    await user.click(screen.getByRole('button', { name: /أنشئ الغرفة/ }));

    expect(socketMock.emit).toHaveBeenCalledWith('special:room:create', {
      mode,
    });
  });

  it('prefills a QR invitation code and submits a player name', async () => {
    const user = userEvent.setup();
    render(<SpecialGameRoom mode={SPECIAL_GAME_ORDER[1]} initialPin="123456" />);
    socketMock.listeners.get('connect')?.();

    await user.type(screen.getByLabelText('اسم اللاعب'), 'نورة');
    await user.click(screen.getByRole('button', { name: /ادخل الغرفة/ }));

    expect(socketMock.emit).toHaveBeenCalledWith('special:room:join', {
      pin: '123456',
      playerName: 'نورة',
    });
  });

  it('renders a scannable QR invitation after the room is created', () => {
    render(<SpecialGameRoom mode={SPECIAL_GAME_ORDER[0]} initialPin="" />);

    act(() => {
      socketMock.listeners.get('connect')?.();
      socketMock.listeners.get('special:room:state')?.({
        pin: '654321',
        hostId: 'socket-host',
        mode: SPECIAL_GAME_ORDER[0],
        phase: 'lobby',
        roundIndex: 0,
        roundCount: 6,
        players: [],
      } as never);
    });

    expect(screen.getByLabelText('رمز QR للانضمام إلى الغرفة 654321')).toBeInTheDocument();
    expect(screen.getByText('654321')).toBeInTheDocument();
  });

  it('keeps the third room mode role private and submits the assigned answer', async () => {
    const user = userEvent.setup();
    const mode = SPECIAL_GAME_ORDER[2];
    render(<SpecialGameRoom mode={mode} initialPin="" />);

    act(() => {
      socketMock.listeners.get('connect')?.();
      socketMock.listeners.get('special:room:state')?.({
        pin: '112233',
        hostId: 'host-socket',
        mode,
        phase: 'infiltrator-answering',
        roundIndex: 0,
        roundCount: 6,
        players: [
          { id: 'socket-host', name: 'سارة', score: 0 },
          { id: 'p2', name: 'فيصل', score: 0 },
          { id: 'p3', name: 'نور', score: 0 },
          { id: 'p4', name: 'عمر', score: 0 },
        ],
      } as never);
      socketMock.listeners.get('infiltrator:round')?.({
        roundId: 'parallel-cairo',
        roundNumber: 1,
        roundCount: 6,
        prompt: 'ما عاصمة المملكة العربية السعودية؟',
        options: ['الرياض', 'جدة', 'الدمام', 'أبها'],
        isInfiltrator: true,
        startsAt: Date.now(),
        timeLimit: 45,
      } as never);
    });

    expect(screen.getByText('أنت الدخيل')).toBeInTheDocument();
    expect(screen.getByText(/تظاهر أن سؤالك/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'الرياض' }));

    expect(socketMock.emit).toHaveBeenCalledWith('infiltrator:answer:submit', {
      pin: '112233',
      roundId: 'parallel-cairo',
      answer: 'الرياض',
    });
  });
});
