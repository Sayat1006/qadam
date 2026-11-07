import { useTitle } from '../../components/kit';
import { useState } from 'react';
import { Bota } from '../../components/ui';
import { LEVEL_NAMES, subjects } from '../../content';
import { summarize } from '../../lib/adaptive';
import { childrenFor, today, useStore } from '../../lib/db';
import type { Adult, Child } from '../../lib/types';
import { AdultShell } from './AdultShell';
import { ChildReport } from './ChildReport';
import { AssignmentsPanel } from './Plans';

function ChildPicker({ list, value, onChange }: { list: Child[]; value: string | null; onChange: (id: string) => void }) {
  if (list.length <= 1) return null;
  return (
    <div className="row" role="group" aria-label="Баланы таңдау" style={{ marginBottom: 16 }}>
      {list.map((c) => (
        <button key={c.id} className={`btn ${value === c.id ? '' : 'secondary'}`} aria-pressed={value === c.id} onClick={() => onChange(c.id)}>
          <span aria-hidden="true">{c.avatar}</span> {c.name}
        </button>
      ))}
    </div>
  );
}

function ParentView({ adult }: { adult: Adult }) {
  useTitle('Ата-ана панелі');
  useStore();
  const list = childrenFor(adult);
  const [sel, setSel] = useState<string | null>(list[0]?.id ?? null);
  const child = list.find((c) => c.id === sel) ?? list[0];
  return (
    <div className="stack">
      <h1>Ата-ана панелі</h1>
      {!child ? (
        <Bota text="Сізге әлі бала тіркелгісі байланыстырылмаған. Мектеп немесе орталық әкімшісіне хабарласыңыз." />
      ) : (
        <>
          <ChildPicker list={list} value={child.id} onChange={setSel} />
          <ChildReport child={child} viewer={adult} />
        </>
      )}
    </div>
  );
}

export function ParentPage() {
  return <AdultShell role="parent">{(a) => <ParentView adult={a} />}</AdultShell>;
}

function TeacherView({ adult }: { adult: Adult }) {
  useTitle('Мұғалім кабинеті');
  const { db } = useStore();
  const list = childrenFor(adult);
  const [sel, setSel] = useState<string | null>(null);
  const child = list.find((c) => c.id === sel);
  const d = today();

  if (child)
    return (
      <div className="stack">
        <button className="btn secondary" style={{ alignSelf: 'flex-start' }} onClick={() => setSel(null)}>
          <span aria-hidden="true">←</span> Барлық оқушылар
        </button>
        <ChildReport child={child} viewer={adult} />
      </div>
    );

  return (
    <div className="stack">
      <h1>Мұғалім кабинеті</h1>
      {list.length === 0 ? (
        <Bota text="Сізге әлі оқушы бекітілмеген. Әкімші оқушыларды сізге байланыстырады." />
      ) : (
        <>
          <p className="muted">Кестеде әр пән бойынша деңгей мен соңғы 20 тапсырманың дәлдігі көрсетілген. Сары ұяшық — көбірек жаттығу керек тақырып бар, қызғылт ұяшық — көмек керек.</p>
          <div className="card table-wrap">
            <table className="list">
              <caption className="sr-only">Оқушылардың пәндер бойынша жетістігі</caption>
              <thead>
                <tr>
                  <th scope="col">Оқушы</th>
                  {subjects.map((s) => (
                    <th scope="col" key={s.id}>
                      <span aria-hidden="true">{s.emoji}</span> {s.title}
                    </th>
                  ))}
                  <th scope="col">Бүгін</th>
                  <th scope="col">
                    <span className="sr-only">Әрекет</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const p = db.progress[c.id];
                  return (
                    <tr key={c.id}>
                      <th scope="row">
                        <span aria-hidden="true">{c.avatar}</span> {c.name}
                      </th>
                      {subjects.map((s) => {
                        const sum = summarize(p.attempts, s.id, p.levels[s.id] ?? 1);
                        return (
                          <td key={s.id} style={sum.needsSupport ? { background: 'var(--warn-soft)' } : sum.weak.length ? { background: 'var(--accent-soft)' } : undefined}>
                            {LEVEL_NAMES[sum.level].icon} {sum.level} · {sum.recentAccuracy === null ? '—' : sum.recentAccuracy + '%'}
                            {sum.needsSupport && <span className="sr-only"> (көмек керек)</span>}
                          </td>
                        );
                      })}
                      <td>{Math.round((p.seconds[d] ?? 0) / 60)} мин</td>
                      <td>
                        <button className="btn secondary" onClick={() => setSel(c.id)}>
                          Толығырақ
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <AssignmentsPanel teacher={adult} students={list} />
        </>
      )}
    </div>
  );
}

export function TeacherPage() {
  return <AdultShell role="teacher">{(a) => <TeacherView adult={a} />}</AdultShell>;
}
