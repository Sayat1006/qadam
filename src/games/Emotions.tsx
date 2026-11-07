/* Эмоция театры: жағдаятты тыңдап, кейіпкердің сезімін және оған не көмектесетінін таңдау */
import { useMemo, useState } from 'react';
import { SpeakButton } from '../components/ui';
import { playCue } from '../lib/media';
import { sample, shuffle } from '../lib/random';
import type { GameProps } from './types';

const FEELINGS = [
  { id: 'joy', e: '😄', l: 'қуанышты' },
  { id: 'sad', e: '😢', l: 'мұңды' },
  { id: 'angry', e: '😠', l: 'ашулы' },
  { id: 'fear', e: '😨', l: 'қорқып тұр' },
  { id: 'surprise', e: '😲', l: 'таңғалды' },
  { id: 'shy', e: '😳', l: 'ұялды' },
];

const SCENES = [
  { who: '👧', story: 'Айгерімнің туған күнінде достары тосын сыйлық әкелді.', f: 'joy', help: 'Бірге қуанып, рахмет айту', wrong: ['Сыйлықты тығып қою', 'Ешкімге айтпау'] },
  { who: '👦', story: 'Ерланның сүйікті ойыншығы сынып қалды.', f: 'sad', help: 'Жанына барып, бірге жөндеуге ұсыныс жасау', wrong: ['Күліп жіберу', 'Назар аудармау'] },
  { who: '🧒', story: 'Біреу Дананың суретін рұқсатсыз алып, жыртып тастады.', f: 'angry', help: 'Терең тыныс алып, ересекке айту', wrong: ['Итеріп жіберу', 'Айқайлап, заттарды лақтыру'] },
  { who: '👦', story: 'Түнде терезе сыртында қатты күн күркіреді. Кіші Әли жалғыз жатыр.', f: 'fear', help: 'Жанына барып, жұбату', wrong: ['Одан бетер қорқыту', 'Есікті жабу'] },
  { who: '👧', story: 'Мадина қақпаны ашса, ауласында кішкентай күшік отыр екен.', f: 'surprise', help: 'Ересектермен ақылдасып, күшікке қамқор болу', wrong: ['Күшікті қуып жіберу', 'Ештеңе айтпау'] },
  { who: '🧒', story: 'Санжар сыныпта тақтаға шығып, сөзін ұмытып қалды. Бәрі оған қарап тұр.', f: 'shy', help: '«Асықпа, сен білесің» деп қолдау', wrong: ['Мазақтау', 'Күлу'] },
  { who: '👦', story: 'Нұрлан ұзақ дайындалып, жарыста бірінші орын алды.', f: 'joy', help: 'Құттықтап, бірге қуану', wrong: ['Қызғану', 'Көңіл бөлмеу'] },
  { who: '👧', story: 'Аружанның досы басқа қалаға көшіп кетті.', f: 'sad', help: 'Хат жазуды немесе қоңырау шалуды ұсыну', wrong: ['«Бәрібір» деу', 'Ойнамай қою'] },
];

const ROUNDS = 6;

export function Emotions({ child, onFinish }: GameProps) {
  const [game, setGame] = useState(0);
  const scenes = useMemo(() => sample(SCENES, ROUNDS), [game]);
  const [round, setRound] = useState(0);
  const [stage, setStage] = useState<'feel' | 'help'>('feel');
  const [tried, setTried] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState('');
  const done = round >= ROUNDS;
  const sc = scenes[Math.min(round, ROUNDS - 1)];
  const feelOpts = useMemo(() => shuffle([FEELINGS.find((f) => f.id === sc.f)!, ...sample(FEELINGS.filter((f) => f.id !== sc.f), 2)]), [sc]);
  const helpOpts = useMemo(() => shuffle([sc.help, ...sc.wrong]), [sc]);

  function pickFeel(id: string) {
    if (id === sc.f) {
      playCue('success', child.a11y.sound);
      if (!tried.length) setScore((s) => s + 1);
      setTried([]);
      setStage('help');
      setMsg(`Иә, ол ${FEELINGS.find((f) => f.id === id)!.l}. Ал оған не көмектеседі?`);
    } else {
      playCue('retry', child.a11y.sound);
      setTried((t) => [...t, id]);
      setMsg('Тағы ойланып көр: кейіпкердің орнында сен не сезінер едің?');
    }
  }

  function pickHelp(h: string) {
    if (h === sc.help) {
      playCue('success', child.a11y.sound);
      setMsg('Дұрыс! Сен — қамқор доссың.');
      window.setTimeout(() => {
        const n = round + 1;
        setRound(n);
        setStage('feel');
        setTried([]);
        setMsg('');
        if (n >= ROUNDS) onFinish(4 + score);
      }, 1300);
    } else {
      playCue('retry', child.a11y.sound);
      setTried((t) => [...t, h]);
      setMsg('Бұл кейіпкерге көмектеспейді. Басқасын таңда.');
    }
  }

  if (done)
    return (
      <div className="feedback good" role="status">
        🎭 Қойылым аяқталды! {ROUNDS} кейіпкердің {score} сезімін бірден таптың.
        <button
          className="btn"
          onClick={() => {
            setGame((g) => g + 1);
            setRound(0);
            setScore(0);
            setStage('feel');
            setTried([]);
          }}
        >
          Қайта ойнау
        </button>
      </div>
    );

  return (
    <div className="stack">
      <p className="muted" style={{ fontWeight: 600 }}>
        Көрініс {round + 1} / {ROUNDS}
      </p>
      <div className="theater">
        <div className="curtain l" aria-hidden="true" />
        <div className="curtain r" aria-hidden="true" />
        <div className="stage-actor" aria-hidden="true">
          {sc.who}
        </div>
        <div className="row" style={{ justifyContent: 'center', gap: 8, position: 'relative' }}>
          <p className="stage-story">{sc.story}</p>
          <SpeakButton text={sc.story} label="Тыңдау" />
        </div>
      </div>
      <h3 style={{ margin: 0 }}>{stage === 'feel' ? 'Кейіпкер не сезінеді?' : 'Оған не көмектеседі?'}</h3>
      <div className={`options ${stage === 'help' ? 'list' : ''}`}>
        {stage === 'feel'
          ? feelOpts.map((f) => (
              <button key={f.id} className={`opt ${tried.includes(f.id) ? 'wrong dim' : ''}`} disabled={tried.includes(f.id)} onClick={() => pickFeel(f.id)}>
                <span className="oe" aria-hidden="true">
                  {f.e}
                </span>
                {f.l}
              </button>
            ))
          : helpOpts.map((h) => (
              <button key={h} className={`opt ${tried.includes(h) ? 'wrong dim' : ''}`} disabled={tried.includes(h)} onClick={() => pickHelp(h)}>
                {h}
              </button>
            ))}
      </div>
      {msg && (
        <div className="feedback try" role="status">
          🐪 {msg}
        </div>
      )}
    </div>
  );
}
