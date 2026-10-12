import React from 'react';
import {AbsoluteFill, Easing, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// ---------- fonts ----------
const WEIGHTS: [string, number][] = [['Medium', 500], ['SemiBold', 600], ['Bold', 700], ['ExtraBold', 800], ['Black', 900]];
if (typeof document !== 'undefined') {
  const handle = delayRender('fonts');
  Promise.all(
    WEIGHTS.map(([n, w]) => {
      const f = new FontFace('Pretendard', `url(${staticFile(`fonts/Pretendard-${n}.woff2`)}) format('woff2')`, {weight: String(w)});
      return f.load().then((ff) => document.fonts.add(ff));
    }),
  ).then(() => continueRender(handle));
}
export const FONT = 'Pretendard, Inter, sans-serif';

// ---------- theme ----------
export type Theme = {bg: string; panel: string; ink: string; dim: string; accent: string; accent2: string; warn: string; line: string};
export const ThemeCtx = React.createContext<Theme>(null as unknown as Theme);
export const useT = () => React.useContext(ThemeCtx);

export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const prog = (f: number, a: number, b: number, e = ease) => interpolate(f, [a, b], [0, 1], {...clamp, easing: e});

// ---------- text ----------
export const Kicker: React.FC<{children: React.ReactNode; delay?: number; color?: string}> = ({children, delay = 0, color}) => {
  const f = useCurrentFrame();
  const t = useT();
  const p = prog(f, delay, delay + 16);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 18, fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: 2, color: color ?? t.accent, opacity: p}}>
      <div style={{width: 48 * p, height: 4, background: color ?? t.accent}} />
      {children}
    </div>
  );
};

// word-by-word masked rise
export const Headline: React.FC<{text: string; size?: number; delay?: number; color?: string; weight?: number; stagger?: number; align?: 'left' | 'center'}> = ({
  text, size = 96, delay = 0, color, weight = 800, stagger = 3, align = 'left',
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = useT();
  const lines = text.split('\n');
  let k = 0;
  return (
    <div style={{fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.18, letterSpacing: -size * 0.03, color: color ?? t.ink, textAlign: align}}>
      {lines.map((ln, li) => (
        <div key={li} style={{display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', columnGap: size * 0.26}}>
          {ln.split(' ').map((w, wi) => {
            const p = spring({frame: f - delay - k++ * stagger, fps, config: {damping: 18, stiffness: 140}});
            return (
              <span key={wi} style={{display: 'inline-block', overflow: 'hidden', paddingBottom: size * 0.08}}>
                <span style={{display: 'inline-block', transform: `translateY(${(1 - p) * 110}%)`}}>{w}</span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const CountUp: React.FC<{to: number; from?: number; decimals?: number; start?: number; dur?: number; prefix?: string; suffix?: string; size?: number; color?: string; sign?: boolean}> = ({
  to, from = 0, decimals = 0, start = 0, dur = 36, prefix = '', suffix = '', size = 220, color, sign,
}) => {
  const f = useCurrentFrame();
  const t = useT();
  const v = from + (to - from) * prog(f, start, start + dur, Easing.bezier(0.22, 1, 0.36, 1));
  const s = v.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
  return (
    <span style={{fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: -size * 0.04, color: color ?? t.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1}}>
      {prefix}{sign && to > 0 ? '+' : ''}{s}{suffix}
    </span>
  );
};

export const FadeUp: React.FC<{delay?: number; children: React.ReactNode; dist?: number; style?: React.CSSProperties}> = ({delay = 0, children, dist = 40, style}) => {
  const f = useCurrentFrame();
  const p = prog(f, delay, delay + 20);
  return <div style={{opacity: p, transform: `translateY(${(1 - p) * dist}px)`, ...style}}>{children}</div>;
};

// ---------- charts ----------
export const HBars: React.FC<{rows: {label: string; value: number; hi?: boolean}[]; max: number; delay?: number; suffix?: string; width?: number}> = ({rows, max, delay = 0, suffix = '%', width = 1000}) => {
  const f = useCurrentFrame();
  const t = useT();
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 26}}>
      {rows.map((r, i) => {
        const p = prog(f, delay + i * 6, delay + i * 6 + 34);
        const w = (r.value / max) * width * p;
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 28, fontFamily: FONT}}>
            <div style={{width: 170, fontSize: 40, fontWeight: 700, color: r.hi ? t.ink : t.dim, textAlign: 'right'}}>{r.label}</div>
            <div style={{height: 56, width: Math.max(4, w), background: r.hi ? t.accent : t.line, borderRadius: 4}} />
            <div style={{fontSize: 44, fontWeight: 800, color: r.hi ? t.accent : t.ink, opacity: p, fontVariantNumeric: 'tabular-nums'}}>
              +{(r.value * p).toFixed(1)}{suffix}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const Donut: React.FC<{pct: number; size?: number; delay?: number; stroke?: number}> = ({pct, size = 520, delay = 0, stroke = 56}) => {
  const f = useCurrentFrame();
  const t = useT();
  const p = prog(f, delay, delay + 45, Easing.bezier(0.22, 1, 0.36, 1));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{transform: 'rotate(-90deg)'}}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.line} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.accent} strokeWidth={stroke} strokeDasharray={`${c * (pct / 100) * p} ${c}`} strokeLinecap="butt" />
    </svg>
  );
};

// ---------- chrome & timeline ----------
export type SceneDef = {dur: number; el: React.ReactNode; source?: string};
const OVER = 16;

const Wipe: React.FC<{dir: number; children: React.ReactNode}> = ({dir, children}) => {
  const f = useCurrentFrame();
  const t = useT();
  const p = prog(f, 0, OVER, Easing.bezier(0.77, 0, 0.18, 1));
  const clip = dir % 2 === 0 ? `inset(0 ${(1 - p) * 100}% 0 0)` : `inset(${(1 - p) * 100}% 0 0 0)`;
  const edge = dir % 2 === 0
    ? {left: `${p * 100}%`, top: 0, width: 14, height: '100%'}
    : {top: `${(1 - p) * 100}%`, left: 0, height: 14, width: '100%'};
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: clip}}>{children}</AbsoluteFill>
      {p < 1 && <div style={{position: 'absolute', background: t.accent, ...edge}} />}
    </AbsoluteFill>
  );
};

export const Episode: React.FC<{theme: Theme; label: string; date: string; scenes: SceneDef[]}> = ({theme, label, date, scenes}) => {
  const f = useCurrentFrame();
  const starts: number[] = [];
  scenes.reduce((acc, s) => (starts.push(acc), acc + s.dur), 0);
  const total = scenes.reduce((a, s) => a + s.dur, 0);
  const cur = Math.max(0, starts.findIndex((st, i) => f >= st && f < st + scenes[i].dur));
  const chromeIn = prog(f, 6, 26);
  const chromeOut = 1 - prog(f, total - 20, total - 4);
  return (
    <ThemeCtx.Provider value={theme}>
      <AbsoluteFill style={{background: theme.bg}}>
        {scenes.map((s, i) => (
          <Sequence key={i} from={starts[i]} durationInFrames={s.dur + (i < scenes.length - 1 ? OVER : 0)}>
            {i === 0 ? s.el : <Wipe dir={i}>{s.el}</Wipe>}
          </Sequence>
        ))}
        {/* chrome */}
        <AbsoluteFill style={{opacity: chromeIn * chromeOut, pointerEvents: 'none', fontFamily: FONT}}>
          <div style={{position: 'absolute', left: 90, top: 64, display: 'flex', alignItems: 'center', gap: 16, fontSize: 26, fontWeight: 800, color: theme.ink, letterSpacing: 3}}>
            <div style={{width: 14, height: 14, borderRadius: 7, background: theme.warn, opacity: 0.5 + 0.5 * Math.sin(f / 6)}} />
            TODAY BRIEF <span style={{color: theme.dim, fontWeight: 600}}>· {label}</span>
          </div>
          <div style={{position: 'absolute', right: 90, top: 64, fontSize: 26, fontWeight: 700, color: theme.dim, letterSpacing: 3}}>{date}</div>
          <div style={{position: 'absolute', left: 90, right: 90, bottom: 56, display: 'flex', gap: 8}}>
            {scenes.map((s, i) => {
              const fill = i < cur ? 1 : i > cur ? 0 : (f - starts[i]) / s.dur;
              return (
                <div key={i} style={{flex: s.dur, height: 5, background: theme.line, overflow: 'hidden', borderRadius: 3}}>
                  <div style={{width: `${fill * 100}%`, height: '100%', background: theme.accent}} />
                </div>
              );
            })}
          </div>
          {scenes[cur]?.source && (
            <div style={{position: 'absolute', left: 90, bottom: 84, fontSize: 22, fontWeight: 500, color: theme.dim}}>출처 · {scenes[cur].source}</div>
          )}
        </AbsoluteFill>
      </AbsoluteFill>
    </ThemeCtx.Provider>
  );
};

export const Pad: React.FC<{children: React.ReactNode; center?: boolean}> = ({children, center}) => (
  <AbsoluteFill style={{padding: '170px 140px 150px', justifyContent: 'center', alignItems: center ? 'center' : 'stretch'}}>{children}</AbsoluteFill>
);

export const totalFrames = (s: SceneDef[]) => s.reduce((a, x) => a + x.dur, 0);
