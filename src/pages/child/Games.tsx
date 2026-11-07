import { useTitle } from '../../components/kit';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Bota } from '../../components/ui';
import { games } from '../../games';
import { gameMeta } from '../../games/meta';
import { today, updateProgress } from '../../lib/db';
import { useChild } from './ChildShell';

export function GamesList() {
  useTitle('Ойындар');
  return (
    <div className="stack">
      <h1>Ойындар залы</h1>
      <Bota text="Ойнай жүріп үйренеміз! Мұнда ұтылу жоқ — тек жаңа әрекет бар." />
      <div className="grid cols-2">
        {gameMeta.map((g) => (
          <Link key={g.id} to={`/child/games/${g.id}`} className="card subject-card lift">
            <span className="emoji" aria-hidden="true">
              {g.emoji}
            </span>
            <strong style={{ fontSize: '1.25rem' }}>{g.title}</strong>
            <span className="muted">{g.about}</span>
            <span className="chip" style={{ alignSelf: 'flex-start' }}>
              {g.skill}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function GamePage() {
  const { gid = '' } = useParams();
  const { child, progress } = useChild();
  const game = games.find((g) => g.id === gid);
  if (!game) return <Navigate to="/child/games" replace />;
  const { Component } = game;

  function onFinish(stars: number) {
    updateProgress(child.id, (p) => {
      p.stars += stars;
      p.gamesPlayed[gid] = (p.gamesPlayed[gid] ?? 0) + 1;
      const d = today();
      p.gamesByDay[d] = (p.gamesByDay[d] ?? 0) + 1;
    });
  }

  return (
    <div className="stack" style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="row">
        <Link className="btn secondary" to="/child/games">
          <span aria-hidden="true">←</span> Ойындар
        </Link>
        <h1 style={{ margin: 0 }}>
          <span aria-hidden="true">{game.emoji}</span> {game.title}
        </h1>
      </div>
      <p className="muted">{game.about}</p>
      <Component child={child} progress={progress} onFinish={onFinish} />
    </div>
  );
}
