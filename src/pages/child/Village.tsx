import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Reveal, useTitle } from '../../components/kit';
import { Bar, Bota } from '../../components/ui';
import { phaseNow, placeItems, SLOTS, VillageScene, type Placed } from '../../components/VillageScene';
import { updateProgress } from '../../lib/db';
import { playCue, speak } from '../../lib/media';
import { useChild } from './ChildShell';

export const VILLAGE_ITEMS = [
  { id: 'flower', e: '🌼', name: 'Гүл', cost: 3, about: 'Даланы әсемдейді' },
  { id: 'tree', e: '🌳', name: 'Ағаш', cost: 5, about: 'Көлеңке мен таза ауа' },
  { id: 'sheep', e: '🐑', name: 'Қой', cost: 8, about: 'Шөп жеп жайылады' },
  { id: 'yurt', e: '⛺', name: 'Киіз үй', cost: 10, about: 'Қазақтың ұлттық баспанасы' },
  { id: 'well', e: '🪣', name: 'Құдық', cost: 12, about: 'Ауылға таза су' },
  { id: 'horse', e: '🐎', name: 'Жылқы', cost: 15, about: 'Қанатты серік' },
  { id: 'camel', e: '🐫', name: 'Түйе', cost: 15, about: 'Шөл даланың кемесі' },
  { id: 'apple', e: '🍎', name: 'Алма ағашы', cost: 18, about: 'Алматының алмасы' },
  { id: 'eagle', e: '🦅', name: 'Бүркіт', cost: 20, about: 'Аспанда қалықтайды' },
  { id: 'house', e: '🏡', name: 'Үй', cost: 25, about: 'Терезесі түнде жанады' },
  { id: 'school', e: '🏫', name: 'Мектеп', cost: 40, about: 'Ауылдың білім ордасы' },
  { id: 'rainbow', e: '🌈', name: 'Кемпірқосақ', cost: 50, about: 'Ең сирек сыйлық' },
];

const LEVELS = [
  { at: 0, name: 'Бос дала', icon: '🌾' },
  { at: 3, name: 'Қоныс', icon: '🏕️' },
  { at: 8, name: 'Ауыл', icon: '⛺' },
  { at: 16, name: 'Үлкен ауыл', icon: '🏡' },
  { at: 26, name: 'Гүлденген ауыл', icon: '🌈' },
];

const PHASE_TEXT = { morning: 'Таң атты', day: 'Күндіз', evening: 'Кеш түсті', night: 'Түн' } as const;

const TAP_TEXT: Record<string, string> = {
  sheep: 'Мә-ә-ә! Қой шөп жеп жүр.',
  horse: 'Жылқы кісінеді! Жылқы — қазақтың қанатты серігі.',
  camel: 'Түйе — шөлге төзімді жануар.',
  yurt: 'Киіз үйге қош келдің!',
  house: 'Бұл — жылы үй.',
  school: 'Мектепке барамыз, білім аламыз!',
  well: 'Құдықтан таза су аламыз.',
  tree: 'Ағаш бізге оттегі береді.',
  apple: 'Алма піскен екен!',
  flower: 'Гүл иісі қандай керемет!',
};

export function Village() {
  useTitle('Менің ауылым');
  const { child, progress } = useChild();
  const left = progress.stars - progress.spentStars;
  const [fresh, setFresh] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const count = (id: string) => progress.village.filter((v) => v === id).length;
  const placed = placeItems(progress.village).length;
  const lvlIdx = LEVELS.reduce((k, l, i) => (placed >= l.at ? i : k), 0);
  const lvl = LEVELS[lvlIdx];
  const next = LEVELS[lvlIdx + 1];
  const pct = next ? Math.round((100 * (placed - lvl.at)) / (next.at - lvl.at)) : 100;
  const phase = phaseNow();

  function buy(id: string, cost: number) {
    const max = SLOTS[id]?.length ?? 0;
    if (left < cost || count(id) >= max) return;
    playCue('success', child.a11y.sound);
    const k = count(id);
    updateProgress(child.id, (p) => {
      p.spentStars += cost;
      p.village.push(id);
    });
    setFresh(`${id}-${k}`);
    const item = VILLAGE_ITEMS.find((v) => v.id === id)!;
    setMsg(`${item.name} ауылыңа қосылды!`);
    window.setTimeout(() => setFresh(null), 1200);
    document.getElementById('vscene')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function onTap(p: Placed) {
    playCue('tap', child.a11y.sound);
    const t = TAP_TEXT[p.type];
    if (t) {
      setMsg(t);
      if (child.a11y.autoRead) speak(t);
    }
  }

  return (
    <div className="stack">
      <div className="row spread" style={{ alignItems: 'flex-end' }}>
        <div>
          <p className="eyebrow">
            {PHASE_TEXT[phase]} · {lvl.icon} {lvl.name}
          </p>
          <h1 style={{ margin: 0 }}>Менің ауылым</h1>
        </div>
        <span className="stars-pill village-stars" style={{ height: 48, fontSize: '1.1rem' }} aria-label={`${left} жұлдыз`}>
          ⭐ {left}
        </span>
      </div>

      <div
        className="vwrap"
        id="vscene"
        ref={(el) => {
          // телефонда көріністі ортадан бастау
          if (el && el.scrollWidth > el.clientWidth && el.dataset.c !== '1') {
            el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
            el.dataset.c = '1';
          }
        }}
      >
        <VillageScene village={progress.village} fresh={fresh} onTap={onTap} />
      </div>
      <p className="vpan-hint muted small">👆 Даланы солға-оңға жылжытып қара</p>
      <div className="card vlevel">
          <span className="vlevel-icon" aria-hidden="true">
            {lvl.icon}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row spread small">
              <strong>{lvl.name}</strong>
              <span>{next ? `${next.icon} ${next.name}: ${placed} / ${next.at}` : 'Ең жоғары деңгей!'}</span>
            </div>
            <Bar value={pct} label={next ? `${next.name} деңгейіне ${pct}%` : 'Ауыл толық гүлденді'} />
          </div>
      </div>

      <Bota
        text={
          msg ??
          (placed === 0
            ? `${child.name}, бұл — сенің далаң. Сабақ оқып жұлдыз жина да, ауылыңды өзің сал!`
            : `Ауылың өсіп келеді, ${child.name}! Нысанды бассаң, ол жанданады.`)
        }
      />

      <section aria-labelledby="shop-h">
        <div className="row spread">
          <h2 id="shop-h" style={{ margin: 0 }}>
            Ауыл дүкені
          </h2>
          {left < 3 && (
            <Link to="/child" className="btn secondary">
              Жұлдыз жинау
            </Link>
          )}
        </div>
        <div className="grid cols-4" style={{ marginTop: 14 }}>
          {VILLAGE_ITEMS.map((v, i) => {
            const have = count(v.id);
            const max = SLOTS[v.id]?.length ?? 0;
            const full = have >= max;
            const short = v.cost - left;
            return (
              <Reveal key={v.id} delay={(i % 4) * 50} className={`card shop-card ${full ? 'full' : short > 0 ? 'locked' : 'ok'}`}>
                <span className="shop-art" aria-hidden="true">
                  {v.e}
                </span>
                <strong>{v.name}</strong>
                <span className="muted small">{v.about}</span>
                <span className="muted small">
                  Ауылда: {have} / {max}
                </span>
                <button className="btn" onClick={() => buy(v.id, v.cost)} disabled={full || short > 0} aria-label={`${v.name} сатып алу, ${v.cost} жұлдыз`}>
                  {full ? 'Орын жоқ' : short > 0 ? `⭐ ${v.cost} · тағы ${short}` : `⭐ ${v.cost} · Алу`}
                </button>
              </Reveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}
