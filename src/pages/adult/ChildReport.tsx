import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { A11yForm } from '../../components/A11y';
import { Bar, Seg } from '../../components/ui';
import { getSubject, LEVEL_NAMES, subjects } from '../../content';
import { summarize } from '../../lib/adaptive';
import { addNote, loginChild, today, updateChild, updateProgress, useStore } from '../../lib/db';
import type { Adult, Child } from '../../lib/types';
import { MOODS } from '../child/ChildHome';

function lastDays(n: number) {
  const out: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    out.push(today(x));
  }
  return out;
}
const WD = ['Жс', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн'];
const fmtMin = (sec: number) => `${Math.round(sec / 60)} мин`;

export function ChildReport({ child, viewer }: { child: Child; viewer: Adult }) {
  const { db } = useStore();
  const navigate = useNavigate();
  const p = db.progress[child.id];
  const [tab, setTab] = useState<'overview' | 'subjects' | 'notes' | 'settings'>('overview');
  if (!p) return null;
  const d = today();
  const days = lastDays(7);
  const weekSec = days.map((x) => p.seconds[x] ?? 0);
  const maxSec = Math.max(60, ...weekSec);
  const todayAttempts = p.attempts.filter((a) => today(new Date(a.t)) === d);
  const weekAttempts = p.attempts.filter((a) => days.includes(today(new Date(a.t))));
  const weekAcc = weekAttempts.length ? Math.round((100 * weekAttempts.filter((a) => a.firstTry).length) / weekAttempts.length) : null;
  const sums = subjects.map((s) => summarize(p.attempts, s.id, p.levels[s.id] ?? 1));
  const support = sums.filter((s) => s.needsSupport);
  const strongAll = sums.flatMap((s) => s.strong.map((t) => `${getSubject(s.subject)!.title}: ${t}`));
  const weakAll = sums.flatMap((s) => s.weak.map((t) => ({ subject: s.subject, t })));
  const moods = days.map((x) => p.moods.find((m) => m.date === x));
  const notes = db.notes.filter((n) => n.childId === child.id).sort((a, b) => b.t - a.t);
  const canEdit = viewer.role !== 'parent' || child.parentIds.includes(viewer.id);

  // Қарапайым тілмен қорытынды
  const summaryLines: string[] = [];
  if (!p.attempts.length) summaryLines.push(`${child.name} әлі тапсырма орындаған жоқ.`);
  else {
    summaryLines.push(`Осы аптада ${child.name} ${fmtMin(weekSec.reduce((a, b) => a + b, 0))} оқып, ${weekAttempts.length} тапсырма орындады.`);
    if (weekAcc !== null) summaryLines.push(`Тапсырмалардың ${weekAcc}%-ын бірінші әрекеттен дұрыс орындады.`);
    if (strongAll.length) summaryLines.push(`Жақсы меңгерген тақырыптары: ${strongAll.slice(0, 4).join(', ')}.`);
    if (weakAll.length) summaryLines.push(`Көбірек жаттығуды қажет ететін тақырыптар: ${weakAll.slice(0, 4).map((w) => w.t).join(', ')}.`);
    if (support.length) summaryLines.push(`⚠️ ${support.map((s) => getSubject(s.subject)!.title).join(', ')} пәнінде соңғы тапсырмалар қиын болып жатыр — маманмен ақылдасып, деңгейді уақытша төмендетуді қарастырыңыз.`);
  }

  function openAsChild() {
    loginChild(child.id, [], viewer.id);
    navigate('/child');
  }

  return (
    <div className="stack">
      <div className="row spread">
        <div className="row">
          <span style={{ fontSize: '2.6rem' }} aria-hidden="true">
            {child.avatar}
          </span>
          <div>
            <h2 style={{ margin: 0 }}>{child.name}</h2>
            <span className="muted small">
              {new Date().getFullYear() - child.birthYear} жас · ⭐ {p.stars - p.spentStars} жұлдыз
            </span>
          </div>
        </div>
        <button className="btn" onClick={openAsChild}>
          <span aria-hidden="true">▶</span> Бала режимін ашу
        </button>
      </div>

      <div className="tabs" role="tablist" aria-label="Есеп бөлімдері">
        {(
          [
            ['overview', 'Шолу'],
            ['subjects', 'Пәндер'],
            ['notes', 'Жазбалар'],
            ['settings', 'Баптаулар'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="stack">
          <div className="grid cols-4">
            <div className="card stat">
              <span className="v">{fmtMin(p.seconds[d] ?? 0)}</span>
              <span className="l">Бүгін оқыды</span>
            </div>
            <div className="card stat">
              <span className="v">{todayAttempts.length}</span>
              <span className="l">Бүгінгі тапсырма</span>
            </div>
            <div className="card stat">
              <span className="v">{weekAcc === null ? '—' : weekAcc + '%'}</span>
              <span className="l">Аптадағы дәлдік</span>
            </div>
            <div className="card stat">
              <span className="v">{Object.values(p.lessonsDone).reduce((a, b) => a + b, 0)}</span>
              <span className="l">Аяқталған сабақ</span>
            </div>
          </div>

          <div className="card">
            <h3>Қысқаша қорытынды</h3>
            {summaryLines.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>

          <div className="grid cols-2">
            <div className="card">
              <h3>Апта бойы оқу уақыты</h3>
              <div className="week" role="img" aria-label={days.map((x, i) => `${x}: ${fmtMin(weekSec[i])}`).join('; ')}>
                {days.map((x, i) => (
                  <div className="col" key={x}>
                    <span>{Math.round(weekSec[i] / 60)}</span>
                    <div className="b" style={{ height: `${(weekSec[i] / maxSec) * 100}%` }} />
                    <span>{WD[new Date(x + 'T12:00').getDay()]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3>Көңіл-күй күнделігі</h3>
              <div className="week" style={{ height: 'auto', alignItems: 'center' }}>
                {days.map((x, i) => {
                  const m = moods[i] && MOODS.find((mm) => mm.id === moods[i]!.mood);
                  return (
                    <div className="col" key={x} style={{ height: 'auto' }}>
                      <span style={{ fontSize: '1.8rem' }} role="img" aria-label={m ? m.l : 'белгі жоқ'}>
                        {m ? m.e : '·'}
                      </span>
                      <span>{WD[new Date(x + 'T12:00').getDay()]}</span>
                    </div>
                  );
                })}
              </div>
              {moods.filter((m) => m && (m.mood === 'sad' || m.mood === 'angry')).length >= 3 && (
                <p className="notice small" style={{ marginTop: 12 }}>
                  Осы аптада бала бірнеше рет мұңды немесе ашулы екенін белгіледі. Онымен әңгімелесіп көріңіз.
                </p>
              )}
            </div>
          </div>

          {weakAll.length > 0 && (
            <div className="card">
              <h3>Үйде көмектесу жолдары</h3>
              <ul>
                {[...new Set(weakAll.map((w) => w.subject))].map((s) => (
                  <li key={s}>
                    <strong>{getSubject(s)!.title}:</strong> {getSubject(s)!.homeTip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'subjects' && (
        <div className="grid cols-2">
          {sums.map((s) => {
            const subj = getSubject(s.subject)!;
            const lvl = subj.levels.find((l) => l.level === s.level)!;
            const ln = LEVEL_NAMES[s.level];
            return (
              <div key={s.subject} className="card stack" style={{ borderLeft: `10px solid ${subj.color}` }}>
                <div className="row spread">
                  <h3 style={{ margin: 0 }}>
                    <span aria-hidden="true">{subj.emoji}</span> {subj.title}
                  </h3>
                  <span className="level-badge">
                    {ln.icon} {s.level}-деңгей
                  </span>
                </div>
                <p className="small muted" style={{ margin: 0 }}>
                  <strong>Мақсат:</strong> {lvl.goal}
                </p>
                <div>
                  <div className="row spread small">
                    <span>Соңғы 20 тапсырма дәлдігі</span>
                    <strong>{s.recentAccuracy === null ? '—' : s.recentAccuracy + '%'}</strong>
                  </div>
                  <Bar value={s.recentAccuracy ?? 0} label={`${subj.title} дәлдігі`} />
                </div>
                <p className="small" style={{ margin: 0 }}>
                  Барлығы: {s.total} тапсырма · Орташа кеңес: {s.avgHints.toFixed(1)}
                </p>
                {(s.strong.length > 0 || s.weak.length > 0) && (
                  <div className="chips">
                    {s.strong.map((t) => (
                      <span key={t} className="chip good">
                        ✓ {t}
                      </span>
                    ))}
                    {s.weak.map((t) => (
                      <span key={t} className="chip weak">
                        ↻ {t}
                      </span>
                    ))}
                  </div>
                )}
                {s.needsSupport && <p className="notice small">Қолдау қажет: соңғы тапсырмалар қиын болып жатыр.</p>}
                {viewer.role !== 'parent' && (
                  <div>
                    <p className="small" style={{ fontWeight: 800, margin: '4px 0' }}>
                      Деңгейді қолмен өзгерту
                    </p>
                    <Seg
                      label={`${subj.title} деңгейі`}
                      value={s.level}
                      onChange={(v) =>
                        updateProgress(child.id, (pp) => {
                          pp.levels[s.subject] = v;
                          pp.levelHistory.push({ t: Date.now(), subject: s.subject, level: v, by: viewer.id });
                        })
                      }
                      options={subj.levels.map((l) => ({ v: l.level, l: `${LEVEL_NAMES[l.level].icon} ${l.level}` }))}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'notes' && <Notes childId={child.id} viewer={viewer} notes={notes} />}

      {tab === 'settings' && canEdit && (
        <div className="grid cols-2">
          <div className="card stack">
            <h3>Уақыт пен сабақ</h3>
            <label className="field">
              <span>Күнделікті уақыт шегі</span>
              <select value={child.settings.dailyLimitMin} onChange={(e) => updateChild(child.id, (c) => (c.settings.dailyLimitMin = Number(e.target.value)))}>
                {[15, 20, 30, 45, 60, 90, 0].map((m) => (
                  <option key={m} value={m}>
                    {m === 0 ? 'Шектеусіз' : `${m} минут`}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Үзіліс туралы еске салу</span>
              <select value={child.settings.breakEveryMin} onChange={(e) => updateChild(child.id, (c) => (c.settings.breakEveryMin = Number(e.target.value)))}>
                {[10, 15, 20, 30, 0].map((m) => (
                  <option key={m} value={m}>
                    {m === 0 ? 'Еске салмау' : `Әр ${m} минут сайын`}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Бір сабақтағы тапсырма саны</span>
              <select value={child.settings.lessonSize} onChange={(e) => updateChild(child.id, (c) => (c.settings.lessonSize = Number(e.target.value)))}>
                {[4, 5, 6, 8, 10].map((m) => (
                  <option key={m} value={m}>
                    {m} тапсырма
                  </option>
                ))}
              </select>
            </label>
            {viewer.role !== 'parent' && (
              <label className="field">
                <span>Бүгінгі ұсынылған пән</span>
                <select value={child.settings.focusSubject ?? ''} onChange={(e) => updateChild(child.id, (c) => (c.settings.focusSubject = e.target.value || null))}>
                  <option value="">Автоматты</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="card">
            <h3>Баланың қолжетімділік баптаулары</h3>
            <A11yForm value={child.a11y} onChange={(s) => updateChild(child.id, (c) => (c.a11y = s))} />
          </div>
        </div>
      )}
    </div>
  );
}

function Notes({ childId, viewer, notes }: { childId: string; viewer: Adult; notes: { id: string; authorId: string; text: string; t: number }[] }) {
  const { db } = useStore();
  const [text, setText] = useState('');
  return (
    <div className="stack">
      <form
        className="card stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          addNote(childId, viewer.id, text);
          setText('');
        }}
      >
        <label className="field">
          <span>Жаңа жазба (ата-ана мен мұғалім көреді)</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Мысалы: Бүгін сабақта 10-ға дейін санауды жақсы орындады." />
        </label>
        <button className="btn" style={{ alignSelf: 'flex-start' }}>
          Жіберу
        </button>
      </form>
      {notes.length === 0 && <p className="muted">Әзірге жазба жоқ.</p>}
      {notes.map((n) => {
        const a = db.adults.find((x) => x.id === n.authorId);
        return (
          <div key={n.id} className="card">
            <p className="small muted" style={{ margin: 0 }}>
              {a ? a.name : 'Жойылған пайдаланушы'} · {new Date(n.t).toLocaleString('kk-KZ')}
            </p>
            <p style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{n.text}</p>
          </div>
        );
      })}
    </div>
  );
}
