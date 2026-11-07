/*
 * Тоғызқұмалақ-мини (жеңілдетілген ереже, балаларға):
 * - Әр ойыншыда 5 отау, әр отауда 5 құмалақ (барлығы 50).
 * - Ойыншы өз отауын таңдап, барлық құмалақты алады да, сол отаудан бастап
 *   сағат тіліне қарсы бір-бірден тастайды (1 құмалақ болса — келесі отауға).
 * - Соңғы құмалақ қарсыластың отауына түсіп, ондағы сан жұп болса — бәрін ұтады (қазанға).
 * - Қазанында 26 немесе одан көп құмалақ жинаған жеңеді; жүріс жоқ болса, ойын бітеді.
 */
export const HOLES = 5;
export const START = 5;
export const WIN = 26;

export interface TogyzState {
  board: number[]; // 0..4 — бала (төменгі қатар), 5..9 — Бота (жоғарғы қатар)
  kazan: [number, number];
  turn: 0 | 1;
  over: boolean;
  last: number | null;
}

export function initial(): TogyzState {
  return { board: Array(HOLES * 2).fill(START), kazan: [0, 0], turn: 0, over: false, last: null };
}

const own = (player: 0 | 1, i: number) => (player === 0 ? i < HOLES : i >= HOLES);

export function legalMoves(s: TogyzState, player = s.turn) {
  const out: number[] = [];
  for (let i = 0; i < HOLES * 2; i++) if (own(player, i) && s.board[i] > 0) out.push(i);
  return out;
}

export function move(s: TogyzState, from: number): TogyzState {
  if (s.over || !own(s.turn, from) || s.board[from] === 0) return s;
  const board = [...s.board];
  const kazan: [number, number] = [...s.kazan];
  let n = board[from];
  board[from] = 0;
  let i = from;
  if (n === 1) {
    i = (i + 1) % (HOLES * 2);
    board[i]++;
  } else {
    board[i]++;
    n--;
    while (n > 0) {
      i = (i + 1) % (HOLES * 2);
      board[i]++;
      n--;
    }
  }
  if (!own(s.turn, i) && board[i] % 2 === 0) {
    kazan[s.turn] += board[i];
    board[i] = 0;
  }
  const next: 0 | 1 = s.turn === 0 ? 1 : 0;
  const ns: TogyzState = { board, kazan, turn: next, over: false, last: i };
  if (kazan[0] >= WIN || kazan[1] >= WIN || legalMoves(ns, next).length === 0) {
    // Қалған құмалақтар өз иесінің қазанына
    for (let k = 0; k < HOLES * 2; k++) {
      kazan[k < HOLES ? 0 : 1] += board[k];
      board[k] = 0;
    }
    ns.over = true;
  }
  return ns;
}

/** Ботаның жүрісі: ең көп ұтатын жүріс, тең болса — кездейсоқ */
export function botMove(s: TogyzState, rnd = Math.random) {
  const moves = legalMoves(s, 1);
  let best: number[] = [];
  let bestGain = -1;
  for (const m of moves) {
    const gain = move(s, m).kazan[1] - s.kazan[1];
    if (gain > bestGain) {
      bestGain = gain;
      best = [m];
    } else if (gain === bestGain) best.push(m);
  }
  return best[Math.floor(rnd() * best.length)];
}
