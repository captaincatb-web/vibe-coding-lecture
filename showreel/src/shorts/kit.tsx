import React, {useContext} from 'react';
import {AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame} from 'remotion';
import {FONT, Theme, ThemeCtx, clamp, ease, prog, useT} from '../news/kit';

export type VLine = {spk: 'A' | 'B'; scene: number; text: string; startF: number; endF: number};
export type VoiceData = {fps: number; total: number; lines: VLine[]; scenes: {from: number; to: number}[]; env: {A: number[]; B: number[]}};
export type SceneProps = {L: number[]; E: number[]; dur: number};

const OVER = 10;
export type Lang = {names: {A: string; B: string}; src: string; merge: number; max: number; font: number};
export const KO: Lang = {names: {A: '진행', B: '해설'}, src: '출처', merge: 20, max: 28, font: 62};
export const EN: Lang = {names: {A: 'Host', B: 'Analyst'}, src: 'Source', merge: 30, max: 46, font: 58};
export const LangCtx = React.createContext<Lang>(KO);

// ---------- scene stage ----------
export const Stage: React.FC<{children: React.ReactNode; justify?: 'center' | 'flex-start'}> = ({children, justify = 'center'}) => (
  <AbsoluteFill style={{top: 232, height: 690, bottom: 'auto', padding: '0 64px', justifyContent: justify, alignItems: 'stretch', display: 'flex', flexDirection: 'column'}}>{children}</AbsoluteFill>
);

export const Label: React.FC<{children: React.ReactNode; delay?: number; color?: string}> = ({children, delay = 0, color}) => {
  const f = useCurrentFrame();
  const t = useT();
  const p = prog(f, delay, delay + 12);
  return (
    <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 36, letterSpacing: 1, color: color ?? t.accent, opacity: p, transform: `translateX(${(1 - p) * -30}px)`, display: 'flex', alignItems: 'center', gap: 16}}>
      <div style={{width: 40 * p, height: 5, background: color ?? t.accent}} />{children}
    </div>
  );
};

export const Big: React.FC<{to: number; from?: number; decimals?: number; start?: number; dur?: number; prefix?: string; suffix?: string; size?: number; color?: string; shake?: boolean; sign?: boolean}> = ({
  to, from = 0, decimals = 0, start = 0, dur = 26, prefix = '', suffix = '', size = 260, color, shake, sign,
}) => {
  const f = useCurrentFrame();
  const t = useT();
  const p = prog(f, start, start + dur, Easing.bezier(0.22, 1, 0.36, 1));
  const v = from + (to - from) * p;
  const amp = shake ? interpolate(f, [start + dur, start + dur + 20], [8, 0], clamp) * (f >= start ? 1 : 0) : 0;
  const s = Math.abs(v).toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
  const sg = v < 0 ? '-' : sign ? '+' : '';
  return (
    <div style={{fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: -size * 0.045, lineHeight: 1, color: color ?? t.ink, fontVariantNumeric: 'tabular-nums', transform: `translate(${Math.sin(f * 2.3) * amp}px, ${Math.cos(f * 3.1) * amp * 0.6}px)`, opacity: prog(f, start - 2, start + 6)}}>
      {prefix}{sg}{s}{suffix}
    </div>
  );
};

export const Pop: React.FC<{delay?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({delay = 0, children, style}) => {
  const f = useCurrentFrame();
  const p = spring({frame: f - delay, fps: 30, config: {damping: 15, stiffness: 160}});
  return <div style={{opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 50}px) scale(${0.92 + 0.08 * p})`, ...style}}>{children}</div>;
};

export const Tile: React.FC<{k: string; v: string; sub?: string; delay?: number; hot?: string; w?: number; vs?: number}> = ({k, v, sub, delay = 0, hot, w, vs = 62}) => {
  const t = useT();
  return (
    <Pop delay={delay} style={{flex: w ? undefined : 1, width: w, padding: '28px 30px', borderRadius: 26, background: t.panel, border: `2px solid ${hot ?? t.line}`, fontFamily: FONT}}>
      <div style={{fontSize: 30, fontWeight: 700, color: t.dim}}>{k}</div>
      <div style={{fontSize: vs, fontWeight: 900, color: hot ?? t.ink, marginTop: 6, letterSpacing: -2, fontVariantNumeric: 'tabular-nums'}}>{v}</div>
      {sub && <div style={{fontSize: 28, fontWeight: 600, color: '#A9B3C4', marginTop: 4}}>{sub}</div>}
    </Pop>
  );
};

export const Source: React.FC<{children: string}> = ({children}) => {
  const t = useT();
  const f = useCurrentFrame();
  return <div style={{position: 'absolute', left: 64, right: 64, bottom: -6, fontFamily: FONT, fontSize: 26, fontWeight: 600, color: '#A9B3C4', opacity: prog(f, 10, 24)}}>{useContext(LangCtx).src} · {children}</div>;
};

// horizontal bars with signed values (negative grow in warn color)
export const SignedBars: React.FC<{rows: {label: string; value: number; hi?: boolean}[]; max: number; delay?: number; step?: number; neg?: string; pos?: string}> = ({rows, max, delay = 0, step = 8, neg, pos}) => {
  const f = useCurrentFrame();
  const t = useT();
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 22, fontFamily: FONT}}>
      {rows.map((r, i) => {
        const p = prog(f, delay + i * step, delay + i * step + 26);
        const w = (Math.abs(r.value) / max) * 540 * p;
        const col = r.value < 0 ? neg ?? t.warn : pos ?? t.accent;
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 20, opacity: Math.min(1, p * 3)}}>
            <div style={{width: 220, fontSize: 38, fontWeight: 800, color: r.hi ? t.ink : t.dim, textAlign: 'right'}}>{r.label}</div>
            <div style={{height: 54, width: Math.max(4, w), background: col, borderRadius: 6, opacity: r.hi ? 1 : 0.65}} />
            <div style={{fontSize: 42, fontWeight: 900, color: col, fontVariantNumeric: 'tabular-nums'}}>{r.value > 0 ? '+' : '-'}{(Math.abs(r.value) * p).toFixed(String(Math.abs(r.value)).split('.')[1]?.length ?? 0)}%</div>
          </div>
        );
      })}
    </div>
  );
};

export const LineChart: React.FC<{pts: {x: string; y: number; est?: boolean}[]; delay?: number; color?: string; h?: number; fmt?: (n: number) => string}> = ({pts, delay = 0, color, h = 300, fmt = (n) => n.toLocaleString('en-US')}) => {
  const f = useCurrentFrame();
  const t = useT();
  const W = 830, pad = 30;
  const ys = pts.map((p) => p.y), lo = Math.min(...ys), hi = Math.max(...ys);
  const X = (i: number) => pad + (i / (pts.length - 1)) * (W - pad * 2);
  const Y = (v: number) => 40 + (1 - (v - lo) / (hi - lo || 1)) * (h - 90);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(i)} ${Y(p.y)}`).join(' ');
  const len = 1600, p = prog(f, delay, delay + 40);
  const col = color ?? t.warn;
  return (
    <svg width={W} height={h + 40} style={{overflow: 'visible', fontFamily: FONT}}>
      <path d={d} fill="none" stroke={col} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
      {pts.map((q, i) => {
        const on = prog(f, delay + (i / (pts.length - 1)) * 36, delay + (i / (pts.length - 1)) * 36 + 8);
        const last = i === pts.length - 1;
        return (
          <g key={i} opacity={on}>
            <circle cx={X(i)} cy={Y(q.y)} r={last ? 15 : 10} fill={last ? col : t.bg} stroke={col} strokeWidth={5} />
            <text x={X(i)} y={h + 24} textAnchor="middle" fontSize={30} fontWeight={700} fill="#A9B3C4">{q.x}{q.est ? '*' : ''}</text>
            {(last || i === 0) && <text x={X(i)} y={Y(q.y) - 26} textAnchor={i === 0 ? 'start' : 'end'} fontSize={32} fontWeight={800} fill={t.ink}>{fmt(q.y)}</text>}
          </g>
        );
      })}
    </svg>
  );
};

// ---------- overlay: chrome, progress, caption, avatars ----------
const Chrome: React.FC<{label: string; date: string; data: VoiceData}> = ({label, date, data}) => {
  const f = useCurrentFrame();
  const t = useT();
  const cur = Math.max(0, data.scenes.findIndex((s, i) => f >= s.from && (f < s.to || i === data.scenes.length - 1)));
  return (
    <AbsoluteFill style={{pointerEvents: 'none', fontFamily: FONT}}>
      <div style={{position: 'absolute', left: 64, right: 64, top: 130, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontSize: 32, fontWeight: 900, letterSpacing: 3, color: t.ink}}>
          <div style={{width: 16, height: 16, borderRadius: 8, background: t.warn, opacity: 0.5 + 0.5 * Math.sin(f / 6)}} />
          TODAY BRIEF <span style={{color: t.dim, fontWeight: 700}}>· {label}</span>
        </div>
        <div style={{fontSize: 28, fontWeight: 700, color: t.dim, letterSpacing: 2}}>{date}</div>
      </div>
      <div style={{position: 'absolute', left: 64, right: 64, top: 192, display: 'flex', gap: 8}}>
        {data.scenes.map((s, i) => {
          const fill = i < cur ? 1 : i > cur ? 0 : (f - s.from) / Math.max(1, s.to - s.from);
          return (
            <div key={i} style={{flex: s.to - s.from, height: 6, borderRadius: 3, background: t.line, overflow: 'hidden'}}>
              <div style={{width: `${Math.min(1, fill) * 100}%`, height: '100%', background: t.accent}} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const chunkify = (text: string, merge = 20, max = 28): string[] => {
  const raw = text.split(/(?<=[.,?!])\s+/).filter(Boolean);
  const out: string[] = [];
  for (const r of raw) {
    if (out.length && out[out.length - 1].length + r.length + 1 <= merge) out[out.length - 1] += ' ' + r;
    else out.push(r);
  }
  const res: string[] = [];
  for (const c of out) {
    if (c.length <= max) { res.push(c); continue; }
    const w = c.split(' '); let acc = ''; let i = 0;
    for (; i < w.length; i++) { if (acc && (acc + ' ' + w[i]).length > c.length / 2) break; acc = acc ? acc + ' ' + w[i] : w[i]; }
    res.push(acc); res.push(w.slice(i).join(' '));
  }
  return res;
};

const Caption: React.FC<{data: VoiceData}> = ({data}) => {
  const f = useCurrentFrame();
  const t = useT();
  let cur = -1;
  data.lines.forEach((l, i) => { if (f >= l.startF - 2) cur = i; });
  if (cur < 0) return null;
  const l = data.lines[cur];
  const LG = useContext(LangCtx);
  const chunks = chunkify(l.text, LG.merge, LG.max);
  const wts = chunks.map((c) => c.replace(/\s/g, '').length + 2);
  const tot = wts.reduce((a, b) => a + b, 0);
  const span = Math.max(1, l.endF - l.startF - 4);
  let ci = 0, c0 = 0, acc = 0;
  chunks.forEach((_, i) => { const st = acc / tot; if ((f - l.startF) / span >= st) { ci = i; c0 = st; } acc += wts[i]; });
  const c1 = c0 + wts[ci] / tot;
  const cStart = l.startF + c0 * span;
  const enter = prog(f, cStart - 1, cStart + 7);
  const fade = 1 - prog(f, l.endF + 26, l.endF + 42);
  const words = chunks[ci].split(' ');
  const ww = words.map((w) => w.length + 1.2);
  const wt = ww.reduce((a, b) => a + b, 0);
  const p = Math.min(1, Math.max(0, ((f - l.startF) / span - c0) / (c1 - c0)));
  const col = l.spk === 'A' ? t.accent : t.accent2;
  let a2 = 0;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 64, top: 930, width: 850, height: 196, boxSizing: 'border-box', padding: '0 34px', borderRadius: 28, background: 'rgba(4,6,12,0.78)', borderLeft: `10px solid ${col}`, display: 'flex', alignItems: 'center', opacity: fade, fontFamily: FONT}}>
        <div style={{display: 'flex', flexWrap: 'wrap', columnGap: 16, rowGap: 2, fontSize: LG.font, fontWeight: 800, lineHeight: 1.22, letterSpacing: -1.5, opacity: 0.35 + 0.65 * enter, transform: `translateY(${(1 - enter) * 14}px)`}}>
          {words.map((w, i) => {
            const st = a2 / wt; a2 += ww[i];
            const state = p >= a2 / wt ? 'done' : p >= st ? 'now' : 'next';
            return <span key={i} style={{color: state === 'now' ? col : '#FFFFFF', opacity: state === 'next' ? 0.62 : 1}}>{w}</span>;
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Avatars: React.FC<{data: VoiceData}> = ({data}) => {
  const LG = useContext(LangCtx);
  const f = useCurrentFrame();
  const t = useT();
  const sm = (a: number[]) => ((a[f - 1] ?? 0) + (a[f] ?? 0) * 2 + (a[f + 1] ?? 0)) / 4;
  const Av = ({spk, col}: {spk: 'A' | 'B'; col: string}) => {
    const e = sm(data.env[spk]);
    const on = e > 0.04;
    return (
      <div style={{display: 'flex', alignItems: 'center', gap: 14, opacity: on ? 1 : 0.55}}>
        <div style={{width: 76, height: 76, borderRadius: 38, background: on ? col : t.panel, border: `4px solid ${col}`, transform: `scale(${1 + e * 0.12})`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5}}>
          {[0.5, 1, 0.7].map((m, i) => (
            <div key={i} style={{width: 7, height: 10 + e * 40 * m * (0.6 + 0.4 * Math.sin(f * 0.9 + i * 2)), borderRadius: 4, background: on ? t.bg : col}} />
          ))}
        </div>
        <div style={{fontFamily: FONT, fontSize: 34, fontWeight: 800, color: on ? '#FFFFFF' : '#A9B3C4'}}>{LG.names[spk]}</div>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 64, top: 1150, display: 'flex', gap: 48}}>
        <Av spk="A" col={t.accent} />
        <Av spk="B" col={t.accent2} />
      </div>
    </AbsoluteFill>
  );
};

const Wipe: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  const t = useT();
  const p = prog(f, 0, OVER, Easing.bezier(0.77, 0, 0.18, 1));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: `inset(${(1 - p) * 100}% 0 0 0)`}}>{children}</AbsoluteFill>
      {p < 1 && <div style={{position: 'absolute', left: 0, right: 0, top: `${(1 - p) * 100}%`, height: 14, background: t.accent}} />}
    </AbsoluteFill>
  );
};

export const Short: React.FC<{theme: Theme; label: string; date: string; data: VoiceData; scenes: React.FC<SceneProps>[]; lang?: Lang}> = ({theme, label, date, data, scenes, lang = KO}) => (
  <LangCtx.Provider value={lang}><ThemeCtx.Provider value={theme}>
    <AbsoluteFill style={{background: theme.bg}}>
      {scenes.map((S, i) => {
        const sc = data.scenes[i];
        const dur = sc.to - sc.from + (i < scenes.length - 1 ? OVER : 0);
        const ls = data.lines.filter((l) => l.scene === i);
        const L = ls.map((l) => l.startF - sc.from);
        const E = ls.map((l) => l.endF - sc.from);
        return (
          <Sequence key={i} from={sc.from} durationInFrames={dur}>
            {i === 0 ? <S L={L} E={E} dur={dur} /> : <Wipe><S L={L} E={E} dur={dur} /></Wipe>}
          </Sequence>
        );
      })}
      <Chrome label={label} date={date} data={data} />
      <Caption data={data} />
      <Avatars data={data} />
    </AbsoluteFill>
  </ThemeCtx.Provider></LangCtx.Provider>
);
