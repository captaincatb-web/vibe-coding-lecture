import React from 'react';
import {AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT} from './theme';

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- shared pieces ----------
const Letters: React.FC<{
  text: string;
  size: number;
  color?: string;
  delay?: number;
  stagger?: number;
  from?: 'below' | 'scale' | 'spread';
  weight?: number;
}> = ({text, size, color = C.ink, delay = 0, stagger = 3, from = 'below', weight = 900}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{display: 'flex', fontFamily: FONT, fontWeight: weight, fontSize: size, color, letterSpacing: -size * 0.04, lineHeight: 1}}>
      {text.split('').map((ch, i) => {
        const p = spring({frame: f - delay - i * stagger, fps, config: {damping: 13, stiffness: 150, mass: 0.7}});
        const y = from === 'below' ? (1 - p) * size * 1.1 : 0;
        const s = from === 'scale' ? 0.2 + 0.8 * p : 1;
        const x = from === 'spread' ? (1 - p) * (i - text.length / 2) * size * 1.2 : 0;
        return (
          <span key={i} style={{display: 'inline-block', transform: `translate(${x}px, ${y}px) scale(${s})`, opacity: Math.min(1, p * 2), whiteSpace: 'pre'}}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

const Center: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>{children}</AbsoluteFill>
);

// ---------- scene 1: MOTION ----------
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const bar = interpolate(f, [18, 40], [0, 1], {...clamp, easing: ease});
  const out = interpolate(f, [52, 72], [1, 40], {...clamp, easing: Easing.bezier(0.7, 0, 0.84, 0)});
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Center>
        <div style={{transform: `scale(${out})`, transformOrigin: '62% 50%'}}>
          <Letters text="MOTION" size={330} from="below" stagger={3} />
          <div style={{height: 14, marginTop: 24, width: `${bar * 100}%`, background: C.lime, transformOrigin: 'left'}} />
        </div>
      </Center>
    </AbsoluteFill>
  );
};

// ---------- scene 2: kinetic words ----------
const Word: React.FC<{kind: 'spin' | 'shake' | 'merge'; text: string; bg: string; fg: string}> = ({kind, text, bg, fg}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  let t = 'none';
  if (kind === 'spin') {
    const r = interpolate(f, [4, 38], [-540, 0], {...clamp, easing: ease});
    const s = spring({frame: f, fps, config: {damping: 12}});
    t = `rotate(${r}deg) scale(${0.3 + 0.7 * s})`;
  }
  if (kind === 'shake') {
    const amp = interpolate(f, [10, 40], [26, 0], clamp);
    const s = spring({frame: f, fps, config: {damping: 10, stiffness: 220}});
    t = `translate(${Math.sin(f * 2.6) * amp}px, ${Math.cos(f * 3.7) * amp * 0.6}px) rotate(${Math.sin(f * 2.1) * amp * 0.25}deg) scale(${0.6 + 0.4 * s})`;
  }
  return (
    <AbsoluteFill style={{background: bg}}>
      <Center>
        {kind === 'merge' ? (
          <Letters text={text} size={300} color={fg} from="spread" stagger={0} delay={4} />
        ) : (
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 340, color: fg, letterSpacing: -14, transform: t}}>{text}</div>
        )}
      </Center>
      <div style={{position: 'absolute', left: 90, bottom: 80, fontFamily: FONT, fontWeight: 600, fontSize: 28, color: fg, opacity: 0.7, letterSpacing: 6}}>
        {String(['spin', 'shake', 'merge'].indexOf(kind) + 1).padStart(2, '0')} / 03
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene 3: dot-grid wave ----------
const Grid: React.FC = () => {
  const f = useCurrentFrame();
  const cols = 32, rows = 18, gap = 60;
  const cx = (cols - 1) / 2, cy = (rows - 1) / 2;
  const reveal = interpolate(f, [0, 20], [0, 1], clamp);
  const word = spring({frame: f - 30, fps: 30, config: {damping: 14}});
  const dots: React.ReactNode[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const d = Math.hypot(x - cx, (y - cy) * 1.2);
      const w = Math.sin(d * 0.55 - f * 0.28);
      const s = 0.25 + 0.95 * Math.max(0, w) * reveal;
      const hue = interpolate(w, [-1, 1], [0, 1]);
      const col = hue > 0.66 ? C.lime : hue > 0.33 ? C.blue : C.coral;
      dots.push(
        <div key={`${x}-${y}`} style={{position: 'absolute', left: 960 + (x - cx) * gap - 18, top: 540 + (y - cy) * gap - 18, width: 36, height: 36, borderRadius: '50%', background: col, transform: `scale(${s})`, opacity: 0.35 + 0.65 * Math.max(0, w)}} />,
      );
    }
  }
  return (
    <AbsoluteFill style={{background: C.bg}}>
      {dots}
      <Center>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 260, letterSpacing: -10, color: C.bg, WebkitTextStroke: `4px ${C.ink}`, transform: `scale(${0.7 + 0.3 * word})`, opacity: word, }}>
          RHYTHM
        </div>
      </Center>
    </AbsoluteFill>
  );
};

// ---------- scene 4: orbit -> collapse -> burst ----------
const Orbit: React.FC = () => {
  const f = useCurrentFrame();
  const n = 14;
  const collapse = interpolate(f, [34, 52], [1, 0], {...clamp, easing: Easing.bezier(0.7, 0, 0.84, 0)});
  const burst = interpolate(f, [52, 78], [0, 1], {...clamp, easing: ease});
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + f * 0.09 * (i % 2 ? 1 : -1);
    const r = (260 + (i % 3) * 120) * collapse;
    const x = 960 + Math.cos(a) * r, y = 540 + Math.sin(a) * r * 0.62;
    const col = [C.lime, C.coral, C.blue, C.violet][i % 4];
    const size = 56 + (i % 3) * 22;
    const shape = i % 3;
    items.push(
      <div key={i} style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, background: shape === 2 ? 'transparent' : col, border: shape === 2 ? `6px solid ${col}` : undefined, borderRadius: shape === 0 ? '50%' : shape === 1 ? 8 : '50%', transform: `rotate(${f * 6 * (i % 2 ? 1 : -1)}deg) scale(${interpolate(f, [0, 12], [0, 1], clamp)})`, opacity: f < 52 ? 1 : 0}} />,
    );
  }
  const rings = [0, 1, 2, 3].map((k) => {
    const p = interpolate(burst, [k * 0.12, 1], [0, 1], clamp);
    const size = p * 2600;
    return (
      <div key={k} style={{position: 'absolute', left: 960 - size / 2, top: 540 - size / 2, width: size, height: size, borderRadius: '50%', border: `${14 - k * 3}px solid ${[C.lime, C.coral, C.blue, C.violet][k]}`, opacity: 1 - p}} />
    );
  });
  const flash = interpolate(f, [50, 54, 66], [0, 1, 0], clamp);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      {items}
      {rings}
      <AbsoluteFill style={{background: C.ink, opacity: flash * 0.9}} />
    </AbsoluteFill>
  );
};

// ---------- scene 5: title ----------
const Title: React.FC = () => {
  const f = useCurrentFrame();
  const line = interpolate(f, [0, 22], [0, 1], {...clamp, easing: ease});
  const sub = spring({frame: f - 14, fps: 30, config: {damping: 16}});
  return (
    <AbsoluteFill style={{background: C.lime}}>
      <Center>
        <div style={{width: 1200}}>
          <div style={{overflow: 'hidden'}}>
            <Letters text="MOTION REEL" size={190} color={C.bg} stagger={2} />
          </div>
          <div style={{height: 10, background: C.bg, width: `${line * 100}%`, margin: '28px 0'}} />
          <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT, fontWeight: 700, fontSize: 40, color: C.bg, letterSpacing: 10, opacity: sub, transform: `translateY(${(1 - sub) * 30}px)`}}>
            <span>CODE · TYPE · RHYTHM</span>
            <span>2026</span>
          </div>
        </div>
      </Center>
    </AbsoluteFill>
  );
};

// ---------- timeline with circle-wipe transitions ----------
const scenes: {start: number; dur: number; el: React.ReactNode; wx?: number; wy?: number}[] = [
  {start: 0, dur: 72, el: <S1 />},
  {start: 72, dur: 50, el: <Word kind="spin" text="SPIN" bg={C.coral} fg={C.bg} />, wx: 62, wy: 50},
  {start: 122, dur: 50, el: <Word kind="shake" text="SHAKE" bg={C.blue} fg={C.ink} />, wx: 20, wy: 80},
  {start: 172, dur: 54, el: <Word kind="merge" text="MERGE" bg={C.ink} fg={C.bg} />, wx: 85, wy: 20},
  {start: 226, dur: 90, el: <Grid />, wx: 50, wy: 50},
  {start: 316, dur: 78, el: <Orbit />, wx: 50, wy: 50},
  {start: 394, dur: 56, el: <Title />, wx: 50, wy: 50},
];
const OVER = 14;

const Wipe: React.FC<{wx: number; wy: number; children: React.ReactNode}> = ({wx, wy, children}) => {
  const f = useCurrentFrame();
  const r = interpolate(f, [0, OVER], [0, 150], {...clamp, easing: Easing.bezier(0.77, 0, 0.18, 1)});
  return <AbsoluteFill style={{clipPath: `circle(${r}% at ${wx}% ${wy}%)`}}>{children}</AbsoluteFill>;
};

export const Reel: React.FC = () => (
  <AbsoluteFill style={{background: C.bg}}>
    {scenes.map((s, i) => {
      const next = scenes[i + 1];
      const dur = next ? next.start + OVER - s.start : s.dur;
      return (
        <Sequence key={i} from={s.start} durationInFrames={dur}>
          {s.wx !== undefined ? <Wipe wx={s.wx} wy={s.wy!}>{s.el}</Wipe> : s.el}
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
