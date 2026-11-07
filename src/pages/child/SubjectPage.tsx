import { useTitle } from '../../components/kit';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Bota } from '../../components/ui';
import { getSubject, LEVEL_NAMES } from '../../content';
import { useChild } from './ChildShell';

export function SubjectPage() {
  useTitle('Пән');
  const { sid = '' } = useParams();
  const { progress } = useChild();
  const subject = getSubject(sid);
  if (!subject) return <Navigate to="/child" replace />;
  const current = progress.levels[sid] ?? 1;
  const atLevel = progress.attempts.filter((a) => a.subject === sid && a.level === current);
  const recentOk = atLevel.slice(-6).filter((a) => a.firstTry).length;

  return (
    <div className="stack">
      <div className="row">
        <Link className="btn secondary" to="/child">
          <span aria-hidden="true">←</span> Артқа
        </Link>
        <h1 style={{ margin: 0 }}>
          <span aria-hidden="true">{subject.emoji}</span> {subject.title}
        </h1>
      </div>
      <Bota
        text={
          atLevel.length === 0
            ? `${current}-деңгейдің жаңа тапсырмалары сені күтіп тұр!`
            : `Сен ${current}-деңгейдесің. Келесі деңгейге өту үшін тапсырмаларды қатесіз орында. Соңғы тапсырмалардың ішінде ${recentOk} тапсырманы бірден таптың!`
        }
      />
      {!progress.placement?.[sid] && (
        <div className="card row spread">
          <div style={{ minWidth: 0, flex: 1 }}>
            <strong>Деңгейіңді анықтайық</strong>
            <p className="muted small" style={{ margin: 0 }}>
              5–10 минуттық ойын: тапсырмалар біртіндеп қиындайды, нәтижесінде сабақ өз деңгейіңнен басталады.
            </p>
          </div>
          <Link to={`/child/placement/${sid}`} className="btn">
            🧭 Анықтау
          </Link>
        </div>
      )}
      <ol className="path" style={{ listStyle: 'none', padding: 0 }}>
        {subject.levels.map((l) => {
          const state = l.level < current ? 'done' : l.level === current ? 'current' : 'locked';
          const ln = LEVEL_NAMES[l.level];
          return (
            <li key={l.level} className={`card path-step ${state}`}>
              <span className="node" aria-hidden="true">
                {state === 'locked' ? '🔒' : ln.icon}
              </span>
              <div>
                <div className="row spread">
                  <h2 style={{ margin: 0, fontSize: '1.15rem' }}>
                    {l.level}-деңгей · {ln.name}: {l.title}
                    {state === 'locked' && <span className="sr-only"> (әлі ашылмаған)</span>}
                  </h2>
                  {state === 'current' && (
                    <Link className="btn big" to={`/child/lesson/${sid}`}>
                      Сабақты бастау <span aria-hidden="true">➜</span>
                    </Link>
                  )}
                  {state === 'done' && (
                    <Link className="btn secondary" to={`/child/lesson/${sid}?level=${l.level}`}>
                      Қайталау
                    </Link>
                  )}
                  {state === 'current' && (
                    <Link className="btn secondary" to={`/child/exam/${sid}`}>
                      <span aria-hidden="true">⏱</span> Өзіңді тексер
                    </Link>
                  )}
                </div>
                <p className="muted small" style={{ margin: '6px 0 0' }}>
                  {l.topics.map((t) => t.title).filter((x, i, a) => a.indexOf(x) === i).join(' · ')}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
