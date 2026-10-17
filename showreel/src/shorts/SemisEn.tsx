import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT, prog, useT} from '../news/kit';
import {semiTheme} from '../news/Semis';
import data from './data/semis_en.json';
import {Big, EN, Label, LineChart, Pop, SceneProps, Short, Source, Stage, Tile, VoiceData} from './kit';

const at = (L: number[], E: number[], i: number, frac: number) => Math.round(L[i] + (E[i] - L[i]) * frac);

// 0: hook
const S0: React.FC<SceneProps> = ({L}) => {
  const t = useT();
  return (
    <Stage>
      <Label delay={4}>KOSPI · Thu 10/15 close</Label>
      <div style={{height: 14}} />
      <Big to={-7.57} decimals={2} suffix="%" start={L[0]} dur={28} color={t.warn} shake size={230} />
      <Pop delay={L[0] + 34}><div style={{fontFamily: FONT, fontSize: 44, fontWeight: 800, color: t.ink, margin: '6px 0 14px'}}>5,554.22 <span style={{color: t.dim, fontWeight: 600, fontSize: 32}}>close</span></div></Pop>
      <LineChart delay={L[0] + 20} h={180} pts={[{x: '10/5', y: 7003.74, est: true}, {x: '10/12', y: 6384.24}, {x: '10/14', y: 6008.81, est: true}, {x: '10/15', y: 5554.22}]} />
      <Source>Yonhap · Newspim · * close derived from reported change</Source>
    </Stage>
  );
};

// 1: Samsung / SK hynix + circuit breaker
const S1: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  const f = useCurrentFrame();
  const badge = at(L, E, 0, 0.62);
  return (
    <Stage>
      <Label delay={4}>Chip giants fall together amid foreign selling</Label>
      <div style={{height: 26}} />
      <div style={{display: 'flex', gap: 22}}>
        <Tile k="Samsung Electronics" v="-9.48%" sub="Closed at ₩210,000" hot={t.warn} delay={L[0] + 2} vs={84} />
        <Tile k="SK hynix" v="-11.06%" sub="Closed at ₩1,262,000" hot={t.warn} delay={L[0] + 24} vs={84} />
      </div>
      <Pop delay={badge} style={{marginTop: 34}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 16, padding: '20px 30px', borderRadius: 18, background: t.warn, color: '#fff', fontFamily: FONT, fontSize: 40, fontWeight: 900, opacity: 0.8 + 0.2 * Math.sin(f / 4)}}>
          <div style={{width: 18, height: 18, borderRadius: 9, background: '#fff'}} />Circuit breaker triggered intraday
        </div>
        <div style={{fontFamily: FONT, fontSize: 30, fontWeight: 600, color: '#A9B3C4', marginTop: 14}}>Triggered in both KOSPI and KOSDAQ</div>
      </Pop>
      <Source>Newspim (KRX data), Oct 15, 2026</Source>
    </Stage>
  );
};

// 2: reasons
const S2: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  const Card = ({d, k, v, s, hot}: {d: number; k: string; v: string; s: string; hot?: string}) => (
    <Tile k={k} v={v} sub={s} delay={d} hot={hot ?? t.warn} w={undefined} vs={60} />
  );
  return (
    <Stage>
      <Label delay={4}>3 reasons behind the plunge</Label>
      <div style={{height: 22}} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
        <Card d={at(L, E, 1, 0.02)} k="① U.S. September CPI" v="+3.7%" s="Forecast 3.6% · Rate-hike fears grow" />
        <Card d={at(L, E, 1, 0.38)} k="② Philadelphia Semiconductor Index (10/14)" v="-4.3%" s="NVIDIA, AMD also fell · 6 straight down days" />
        <Card d={at(L, E, 1, 0.66)} k="③ China's CXMT catching up" v="Supply fears" s="Cited as a drag on Samsung and SK" hot={t.accent2} />
      </div>
      <Source>ABC News (10/15) · Newspim (10/15)</Source>
    </Stage>
  );
};

// 3: TSMC
const S3: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  return (
    <Stage>
      <Label delay={4}>TSMC Q3 2026 (reported 10/15)</Label>
      <div style={{height: 10}} />
      <Big to={41.2} decimals={1} sign suffix="%" start={at(L, E, 1, 0.3)} dur={26} color={t.accent} size={220} />
      <Pop delay={at(L, E, 1, 0.3)}><div style={{fontFamily: FONT, fontSize: 34, fontWeight: 700, color: t.dim, margin: '8px 0 30px'}}>Revenue, year over year (USD)</div></Pop>
      <div style={{display: 'flex', gap: 18}}>
        <Tile k="Revenue" v="$46.7B" sub="$46.72 billion" delay={at(L, E, 1, 0.3)} hot={t.accent} vs={54} />
        <Tile k="Gross margin" v="66.4%" delay={at(L, E, 1, 0.74)} hot={t.accent} vs={54} />
        <Tile k="Net income" v="+68.7%" sub="NT$763 billion" delay={at(L, E, 1, 0.9)} vs={54} />
      </div>
      <Source>TSMC earnings release, Oct 15, 2026</Source>
    </Stage>
  );
};

// 4: Samsung OP + selling
const S4: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  return (
    <Stage>
      <Label delay={4}>Samsung Q3 operating profit (reported 10/8)</Label>
      <div style={{height: 12}} />
      <div style={{display: 'flex', alignItems: 'baseline', gap: 16}}>
        <Big to={107.4} decimals={1} start={L[0] + 2} dur={36} size={200} color={t.accent} />
        <Pop delay={L[0] + 30}><span style={{fontFamily: FONT, fontWeight: 900, fontSize: 64, color: t.ink}}>trillion won</span></Pop>
      </div>
      <div style={{height: 34}} />
      <Pop delay={at(L, E, 0, 0.62)}>
        <Tile k="Yet on 10/15, foreign investors" v="net sold ~₩4.8 tn" sub="KOSPI · KRX data" hot={t.warn} vs={56} />
      </Pop>
      <Source>Focus on Economy (10/12) · Newspim (10/15)</Source>
    </Stage>
  );
};

// 5: Friday rebound
const S5: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  return (
    <Stage>
      <Label delay={4}>KOSPI · Fri 10/16 · first rebound in 8 sessions</Label>
      <div style={{height: 8}} />
      <Big to={2.05} decimals={2} sign suffix="%" start={L[1]} dur={22} color={t.accent} size={200} />
      <div style={{height: 10}} />
      <LineChart delay={L[1] + 8} color={t.accent} h={200} pts={[{x: '10/5', y: 7003.74, est: true}, {x: '10/12', y: 6384.24}, {x: '10/14', y: 6008.81, est: true}, {x: '10/15', y: 5554.22}, {x: '10/16', y: 5668.05}]} />
      <div style={{display: 'flex', gap: 20, marginTop: 34}}>
        <Tile k="Samsung Electronics" v="+2.62%" delay={at(L, E, 1, 0.62)} hot={t.accent} vs={64} />
        <Tile k="SK hynix" v="+0.79%" sub="Weaker recovery" delay={at(L, E, 1, 0.72)} vs={64} />
      </div>
      <Source>Yonhap (10/16) · * derived from reported changes</Source>
    </Stage>
  );
};

// 6: wrap-up
const S6: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  const Row = ({d, ok, k, v}: {d: number; ok: boolean; k: string; v: string}) => (
    <Pop delay={d}>
      <div style={{display: 'flex', alignItems: 'center', gap: 26, padding: '26px 30px', borderRadius: 26, background: t.panel, border: `2px solid ${ok ? t.accent : t.warn}`, fontFamily: FONT}}>
        <div style={{width: 70, height: 70, borderRadius: 35, background: ok ? t.accent : t.warn, color: t.bg, fontSize: 44, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{ok ? '✓' : '?'}</div>
        <div><div style={{fontSize: 44, fontWeight: 900, color: t.ink}}>{k}</div><div style={{fontSize: 28, fontWeight: 600, color: t.dim, marginTop: 4}}>{v}</div></div>
      </div>
    </Pop>
  );
  return (
    <Stage>
      <Label delay={4}>Wrap-up</Label>
      <div style={{height: 22}} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
        <Row d={L[0] + 4} ok k="Earnings" v="TSMC revenue +41.2% · Samsung op. profit above ₩107 tn" />
        <Row d={L[1] + 4} ok={false} k="Flows" v="Will foreign selling ease?" />
        <Row d={at(L, E, 1, 0.55)} ok={false} k="Wildcard" v="U.S. inflation and the rate path" />
      </div>
      <Pop delay={at(L, E, 1, 0.8)}><div style={{fontFamily: FONT, fontSize: 28, fontWeight: 600, color: '#A9B3C4', marginTop: 24}}>※ News summary, not investment advice.</div></Pop>
    </Stage>
  );
};

export const ShortSemisEn: React.FC = () => <Short theme={semiTheme} label="SEMIS" date="OCT 17, 2026 (SAT)" lang={EN} data={data as unknown as VoiceData} scenes={[S0, S1, S2, S3, S4, S5, S6]} />;
