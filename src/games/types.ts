import type { Child, Progress } from '../lib/types';

export interface GameProps {
  child: Child;
  progress: Progress;
  /** Ойын раунды аяқталғанда — жиналған жұлдыз */
  onFinish: (stars: number) => void;
}
