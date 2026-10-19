import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {FONT, Theme, clamp, prog, useT} from '../news/kit';
import data from './data/roadster.json';
import {Big, Label, Pop, SceneProps, Short, Source, Stage, Tile, VoiceData} from './kit';

export const roadTheme: Theme = {bg: '#07080C', panel: '#12151C', ink: '#F4F5F7', dim: '#8B93A3', accent: '#FF3B41', accent2: '#4DD2FF', warn: '#FFB020', line: '#232833'};
const at = (L: number[], E: number[], i: number, frac: number) => Math.round(L[i] + (E[i] - L[i]) * frac);
const BODY = '#E9EDF2';

// simple side-view car with optional cold-gas puffs (rear + underside)
const Car: React.FC<{w?: number; color?: string; puff?: number; label?: string}> = ({w = 220, color = BODY, puff = 0}) => {
  const t = useT();
  const f = useCurrentFrame();
  return (
    <svg width={w} height={w * 0.42} viewBox="0 0 220 92" style={{overflow: 'visible'}}>
      {puff > 0 && [0, 1, 2, 3].map((i) => (
        <g key={i}>
          <circle cx={-6 - i * 24 * puff} cy={52 + ((i + Math.floor(f / 3)) % 2 ? 7 : -7)} r={7 + i * 6 * puff} fill={t.accent2} opacity={(0.95 - i * 0.2) * puff} />
          <circle cx={60 + i * 34} cy={90 + i * 8 * puff} r={6 + i * 4 * puff} fill={t.accent2} opacity={(0.9 - i * 0.2) * puff * 0.8} />
        </g>
      ))}
      <path d="M8 62 C8 52 24 46 56 42 L86 20 C93 15 102 13 114 13 L146 13 C160 13 171 22 180 36 L206 43 C214 46 216 52 216 62 Z" fill={color} />
      <path d="M92 24 L110 20 L114 40 L70 42 Z" fill="#0A0C10" opacity={0.65} />
      <circle cx="56" cy="66" r="17" fill="#0A0C10" stroke={color} strokeWidth="4" />
      <circle cx="172" cy="66" r="17" fill="#0A0C10" stroke={color} strokeWidth="4" />
    </svg>
  );
};

const bez = (p: number[][], t: number) => {
  const u = 1 - t;
  const x = u ** 3 * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t ** 3 * p[3][0];
  const y = u ** 3 * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t ** 3 * p[3][1];
  const dx = 3 * u * u * (p[1][0] - p[0][0]) + 6 * u * t * (p[2][0] - p[1][0]) + 3 * t * t * (p[3][0] - p[2][0]);
  const dy = 3 * u * u * (p[1][1] - p[0][1]) + 6 * u * t * (p[2][1] - p[1][1]) + 3 * t * t * (p[3][1] - p[2][1]);
  return {x, y, a: (Math.atan2(dy, dx) * 180) / Math.PI};
};
const pathD = (p: number[][]) => `M${p[0][0]} ${p[0][1]} C${p[1][0]} ${p[1][1]} ${p[2][0]} ${p[2][1]} ${p[3][0]} ${p[3][1]}`;

// 0: hook
const S0: React.FC<SceneProps> = ({L}) => {
  const t = useT();
  const f = useCurrentFrame();
  const bob = -24 + 12 * Math.sin(f / 9);
  return (
    <Stage>
      <Label delay={4}>2026.10.15 · SpaceX McGregor, TX</Label>
      <div style={{height: 20}} />
      <Pop delay={L[0] - 4}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 132, lineHeight: 0.98, letterSpacing: -5, color: t.ink}}>FLYING<br /><span style={{color: t.accent}}>ROADSTER</span></div>
      </Pop>
      <div style={{position: 'relative', height: 260, marginTop: 30}}>
        <div style={{position: 'absolute', left: 250, top: 40 + bob, opacity: prog(f, 8, 24)}}><Car w={330} puff={0.55 + 0.25 * Math.sin(f / 4)} /></div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 20, height: 4, background: t.line}} />
      </div>
      <Source>CNBC · TechCrunch (2026.10.15)</Source>
    </Stage>
  );
};

// 1: ramp + flip
const S1: React.FC<SceneProps> = ({L}) => {
  const t = useT();
  const f = useCurrentFrame();
  const ramp = [[30, 470], [440, 470], [720, 430], [760, 130]];
  const fly = [[760, 130], [640, 10], [330, 90], [140, 440]];
  const t0 = L[0] + 8;
  const a = prog(f, t0, t0 + 70, Easing.bezier(0.45, 0, 0.8, 0.6));
  const b = prog(f, t0 + 70, t0 + 135, Easing.inOut(Easing.quad));
  const onFly = f >= t0 + 70;
  const pos = onFly ? bez(fly, b) : bez(ramp, a);
  const rot = onFly ? interpolate(b, [0, 0.85], [pos.a * 0 - 70, -430], clamp) : pos.a;
  const land = prog(f, t0 + 130, t0 + 150);
  return (
    <Stage>
      <Label delay={4}>흡입 팬 + 냉가스 추진기</Label>
      <svg width={952} height={560} style={{marginTop: 8, overflow: 'visible', fontFamily: FONT}}>
        <path d={pathD(ramp)} fill="none" stroke={t.line} strokeWidth={14} strokeLinecap="round" />
        <path d={pathD(fly)} fill="none" stroke={t.accent2} strokeWidth={4} strokeDasharray="4 14" strokeLinecap="round" opacity={0.7} />
        <line x1={20} y1={500} x2={932} y2={500} stroke={t.line} strokeWidth={4} />
        <g transform={`translate(${pos.x}, ${pos.y}) rotate(${rot}) translate(-75, -38)`}>
          <foreignObject width={160} height={80} style={{overflow: 'visible'}}><div style={{width: 150}}><Car w={150} puff={onFly ? 0.7 : 0.15 + land * 0.4} /></div></foreignObject>
        </g>
        <text x={70} y={535} fontSize={30} fontWeight={800} fill="#A9B3C4" opacity={prog(f, t0, t0 + 14)}>① 흡입 팬이 차를 바닥에 붙인다</text>
        <text x={500} y={42} fontSize={30} fontWeight={800} fill={t.accent2} opacity={prog(f, t0 + 70, t0 + 84)}>② 압축가스로 자세 제어·회전</text>
      </svg>
      <Source>TechCrunch(10.15) · 전자신문(10.16)</Source>
    </Stage>
  );
};

// 2: jump over five Teslas
const S2: React.FC<SceneProps> = ({L}) => {
  const t = useT();
  const f = useCurrentFrame();
  const names = ['사이버캡', '사이버트럭', '세미', '모델 Y', '모델 3'];
  const cols = ['#5A6272', '#6B7384', '#7D8597', '#565E6E', '#6B7384'];
  const t0 = L[1] + 18;
  const p = prog(f, t0, t0 + 70, Easing.inOut(Easing.sin));
  const x = 20 + 760 * p;
  const y = 500 - 4 * 270 * p * (1 - p);
  const roll = 360 * clamp01((p - 0.18) / 0.64);
  const puff = p > 0 && p < 0.2 ? 1 - p / 0.2 : p > 0.8 && p < 1 ? (p - 0.8) / 0.2 : f < t0 ? 0.25 : 0;
  return (
    <Stage>
      <Label delay={4}>무인 시연 · 테슬라 5대 뛰어넘기</Label>
      <svg width={952} height={600} style={{marginTop: 4, overflow: 'visible', fontFamily: FONT}}>
        <line x1={0} y1={502} x2={952} y2={502} stroke={t.line} strokeWidth={4} />
        {names.map((n, i) => (
          <g key={n} opacity={prog(f, 6 + i * 4, 18 + i * 4)}>
            <foreignObject x={190 + i * 118} y={440} width={110} height={60} style={{overflow: 'visible'}}><div style={{width: 104}}><Car w={104} color={cols[i]} /></div></foreignObject>
            <text x={190 + i * 118 + 52} y={540} textAnchor="middle" fontSize={22} fontWeight={700} fill="#A9B3C4">{n}</text>
          </g>
        ))}
        <path d={`M20 500 Q ${20 + 380} ${500 - 540} ${780 + 20} 500`} fill="none" stroke={t.accent2} strokeWidth={3} strokeDasharray="4 12" opacity={0.5} />
        <g transform={`translate(${x}, ${y}) rotate(${-roll}) translate(-70, -34)`}>
          <foreignObject width={150} height={70} style={{overflow: 'visible'}}><div style={{width: 140}}><Car w={140} puff={puff} /></div></foreignObject>
        </g>
      </svg>
      <Source>TechCrunch(10.15) · 더구루(10.16)</Source>
    </Stage>
  );
};
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// 3: performance claims
const S3: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  return (
    <Stage>
      <Label delay={4}>시연 후 공개된 사양 (회사 발표)</Label>
      <div style={{height: 6}} />
      <div style={{fontFamily: FONT, fontSize: 34, fontWeight: 700, color: '#A9B3C4'}}>0 → 60mph (약 97km/h)</div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 14}}>
        <Big to={0.81} decimals={2} start={L[1] + 4} dur={26} size={230} color={t.accent} />
        <Pop delay={L[1] + 20}><span style={{fontFamily: FONT, fontWeight: 900, fontSize: 80, color: t.ink}}>초</span></Pop>
      </div>
      <div style={{display: 'flex', gap: 18, marginTop: 30}}>
        <Tile k="최고 속도" v="230mph+" sub="약 370km/h 이상" delay={at(L, E, 1, 0.55)} hot={t.accent2} vs={50} />
        <Tile k="주행거리" v="300mi+" sub="약 480km 이상" delay={at(L, E, 1, 0.7)} vs={50} />
      </div>
      <Pop delay={at(L, E, 1, 0.8)}><div style={{fontFamily: FONT, fontSize: 28, fontWeight: 700, color: t.warn, marginTop: 22}}>※ 회사 발표치 · 독립 검증 없음</div></Pop>
      <Source>CNBC · TechCrunch · 더구루</Source>
    </Stage>
  );
};

// 4: trims + deposits
const S4: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  const Row = ({d, name, sub, v, hot}: {d: number; name: string; sub: string; v: string; hot?: string}) => (
    <Pop delay={d}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '26px 32px', borderRadius: 26, background: t.panel, border: `2px solid ${hot ?? t.line}`, fontFamily: FONT}}>
        <div><div style={{fontSize: 46, fontWeight: 900, color: t.ink}}>{name}</div><div style={{fontSize: 28, fontWeight: 600, color: '#A9B3C4', marginTop: 4}}>{sub}</div></div>
        <div style={{fontSize: 40, fontWeight: 900, color: hot ?? t.ink, textAlign: 'right'}}>{v}</div>
      </div>
    </Pop>
  );
  return (
    <Stage>
      <Label delay={4}>3개 트림 · 판매가는 미공개</Label>
      <div style={{height: 20}} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
        <Row d={L[1] + 2} name="Performance" sub="도로 주행용 · 2인승" v="예약금 $50,000" />
        <Row d={at(L, E, 1, 0.45)} name="Thrust" sub="후방 추진기 · 2인승" v="예약금 $250,000" hot={t.accent2} />
        <Row d={at(L, E, 1, 0.75)} name="Rocket" sub="추진기 10개 · 1인승" v="초대 전용" hot={t.accent} />
      </div>
      <Source>TechCrunch(10.15) · 전자신문(10.16)</Source>
    </Stage>
  );
};

// 5: timeline + skeptic
const S5: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  const f = useCurrentFrame();
  const line = prog(f, L[1], L[1] + 60);
  const Node = ({x, y, k, v, d, hot}: {x: number; y: string; k: string; v: string; d: number; hot?: string}) => (
    <Pop delay={d} style={{position: 'absolute', left: x, top: 0, width: 300, fontFamily: FONT}}>
      <div style={{width: 28, height: 28, borderRadius: 14, background: hot ?? t.dim, margin: '0 0 14px 0'}} />
      <div style={{fontSize: 52, fontWeight: 900, color: hot ?? t.ink}}>{y}</div>
      <div style={{fontSize: 28, fontWeight: 700, color: t.ink, marginTop: 4}}>{k}</div>
      <div style={{fontSize: 26, fontWeight: 600, color: '#A9B3C4', marginTop: 2}}>{v}</div>
    </Pop>
  );
  return (
    <Stage>
      <Label delay={4}>약속과 현실</Label>
      <div style={{position: 'relative', height: 250, marginTop: 40}}>
        <div style={{position: 'absolute', left: 14, top: 13, height: 4, width: `${line * 90}%`, background: t.line}} />
        <Node x={0} y="2017" k="공개" v="2020년 인도 약속" d={L[1]} />
        <Node x={320} y="~2026" k="인도 0대" v="9년째 지연" d={at(L, E, 1, 0.3)} hot={t.warn} />
        <Node x={640} y="2028" k="양산 목표" v="이번 시연에서 재확인" d={at(L, E, 1, 0.55)} hot={t.accent} />
      </div>
      <Pop delay={L[2]} style={{marginTop: 26}}>
        <div style={{padding: '26px 32px', borderRadius: 26, background: t.panel, borderLeft: `10px solid ${t.accent2}`, fontFamily: FONT}}>
          <div style={{fontSize: 44, fontWeight: 900, color: t.ink, lineHeight: 1.25}}>“지속 비행이 아니라<br />사실상 점프”</div>
          <div style={{fontSize: 26, fontWeight: 600, color: '#A9B3C4', marginTop: 10}}>CNN이 인용한 항공 전문가</div>
        </div>
      </Pop>
      <Source>CNBC(10.15) · CNN/WRAL(10.16) · 디지털투데이(10.14)</Source>
    </Stage>
  );
};

// 6: wrap-up
const S6: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  const Row = ({d, ok, k, v}: {d: number; ok: boolean; k: string; v: string}) => (
    <Pop delay={d}>
      <div style={{display: 'flex', alignItems: 'center', gap: 26, padding: '24px 30px', borderRadius: 26, background: t.panel, border: `2px solid ${ok ? t.accent2 : t.warn}`, fontFamily: FONT}}>
        <div style={{width: 66, height: 66, borderRadius: 33, background: ok ? t.accent2 : t.warn, color: t.bg, fontSize: 42, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{ok ? '✓' : '?'}</div>
        <div><div style={{fontSize: 42, fontWeight: 900, color: t.ink}}>{k}</div><div style={{fontSize: 28, fontWeight: 600, color: '#A9B3C4', marginTop: 4}}>{v}</div></div>
      </div>
    </Pop>
  );
  return (
    <Stage>
      <Label delay={4}>정리</Label>
      <div style={{height: 20}} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
        <Row d={L[0] + 4} ok k="시연" v="무인 상태로 공중 회전·점프 성공" />
        <Row d={L[1] + 2} ok={false} k="도로 합법성" v="머스크도 확신하기 어렵다고 밝힘" />
        <Row d={at(L, E, 1, 0.55)} ok={false} k="양산·가격" v="2028년 목표 · 판매가 미공개" />
      </div>
      <Pop delay={at(L, E, 1, 0.8)}><div style={{fontFamily: FONT, fontSize: 28, fontWeight: 600, color: '#A9B3C4', marginTop: 22}}>※ 성능 수치는 회사 발표치입니다.</div></Pop>
    </Stage>
  );
};

export const ShortRoadster: React.FC = () => <Short theme={roadTheme} label="ROADSTER" date="2026.10.19 (월)" data={data as unknown as VoiceData} scenes={[S0, S1, S2, S3, S4, S5, S6]} />;
