import { useTitle } from '../../components/kit';
import { Bota } from '../../components/ui';
import { updateProgress } from '../../lib/db';
import { playCue } from '../../lib/media';
import { useChild } from './ChildShell';

export const VILLAGE_ITEMS = [
  { id: 'flower', e: '🌼', name: 'Гүл', cost: 3 },
  { id: 'tree', e: '🌳', name: 'Ағаш', cost: 5 },
  { id: 'sheep', e: '🐑', name: 'Қой', cost: 8 },
  { id: 'yurt', e: '⛺', name: 'Киіз үй', cost: 10 },
  { id: 'well', e: '⛲', name: 'Құдық', cost: 12 },
  { id: 'horse', e: '🐎', name: 'Жылқы', cost: 15 },
  { id: 'camel', e: '🐫', name: 'Түйе', cost: 15 },
  { id: 'apple', e: '🍎', name: 'Алма бағы', cost: 18 },
  { id: 'eagle', e: '🦅', name: 'Бүркіт', cost: 20 },
  { id: 'house', e: '🏡', name: 'Үй', cost: 25 },
  { id: 'school', e: '🏫', name: 'Мектеп', cost: 40 },
  { id: 'rainbow', e: '🌈', name: 'Кемпірқосақ', cost: 50 },
];

export function Village() {
  useTitle('Менің ауылым');
  const { child, progress } = useChild();
  const left = progress.stars - progress.spentStars;

  function buy(id: string, cost: number) {
    if (left < cost) return;
    playCue('success', child.a11y.sound);
    updateProgress(child.id, (p) => {
      p.spentStars += cost;
      p.village.push(id);
    });
  }

  return (
    <div className="stack">
      <h1>Менің ауылым</h1>
      <Bota text={progress.village.length ? `Ауылың әдемі болып келеді, ${child.name}! Жұлдыздарыңа тағы не қосамыз?` : 'Жұлдыз жинап, өз ауылыңды сал! Алғашқы гүлден баста.'} />
      <div className="village" role="img" aria-label={`Ауылда ${progress.village.length} нысан бар`}>
        <span className="decor" style={{ fontSize: '2rem', alignSelf: 'flex-start', marginRight: 'auto' }} aria-hidden="true">
          ☀️
        </span>
        {progress.village.length === 0 && <span className="muted" style={{ fontSize: '1rem', width: '100%' }}>Әзірге бос дала...</span>}
        {progress.village.map((id, i) => (
          <span key={i} aria-hidden="true">
            {VILLAGE_ITEMS.find((v) => v.id === id)?.e}
          </span>
        ))}
      </div>
      <h2>Дүкен <span className="stars-pill" style={{ fontSize: '1rem' }}>⭐ {left}</span></h2>
      <div className="grid cols-4">
        {VILLAGE_ITEMS.map((v) => (
          <div key={v.id} className="card shop-item">
            <span className="big-emoji" aria-hidden="true">
              {v.e}
            </span>
            <strong>{v.name}</strong>
            <button className="btn" onClick={() => buy(v.id, v.cost)} disabled={left < v.cost} aria-label={`${v.name} сатып алу, ${v.cost} жұлдыз`}>
              ⭐ {v.cost}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
