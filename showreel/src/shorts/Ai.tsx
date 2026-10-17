import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {FONT, clamp, prog, useT} from '../news/kit';
import {aiTheme} from '../news/Ai';
import data from './data/ai.json';
import {Big, Label, Pop, SceneProps, Short, SignedBars, Source, Stage, Tile, VoiceData} from './kit';

const at = (L: number[], E: number[], i: number, frac: number) => Math.round(L[i] + (E[i] - L[i]) * frac);

// 0: Nasdaq
const A0: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  return (
    <Stage>
      <Label delay={4}>뉴욕증시 · 10.14(수) 나스닥</Label>
      <div style={{height: 8}} />
      <Big to={-1.88} decimals={2} suffix="%" start={L[1] + 8} dur={24} color={t.warn} size={250} shake />
      <div style={{height: 26}} />
      <SignedBars delay={at(L, E, 1, 0.5)} step={14} max={16} rows={[
        {label: '오라클', value: -8.8, hi: true},
        {label: '코어위브', value: -15, hi: true},
        {label: 'AMD', value: -5.73},
        {label: '엔비디아', value: -3.16},
      ]} />
      <Source>ABC뉴스(10.15, 뉴욕 현지 10.14 마감 기준)</Source>
    </Stage>
  );
};

// 1: CPI
const A1: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  return (
    <Stage>
      <Label delay={4}>미국 9월 소비자물가(CPI) · 전년 대비</Label>
      <div style={{height: 30}} />
      <SignedBars delay={L[0] + 6} step={16} max={4} pos={t.accent2} rows={[
        {label: '8월', value: 3.4},
        {label: '시장 예상', value: 3.6},
        {label: '9월', value: 3.7, hi: true},
      ]} />
      <Pop delay={at(L, E, 0, 0.55)} style={{marginTop: 40}}>
        <Tile k="전월 대비" v="+0.6%" sub="5개월 만에 최고 · 금리 인상 우려 확대" hot={t.warn} vs={80} />
      </Pop>
      <Source>ABC뉴스(10.15)</Source>
    </Stage>
  );
};

// 2: RTX Spark
const A2: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  const f = useCurrentFrame();
  const p = prog(f, L[1] - 6, L[1] + 18);
  const lines = [0.8, 0.55, 0.7, 0.4];
  return (
    <Stage>
      <Label delay={4}>NVIDIA × Microsoft · RTX Spark</Label>
      <Pop delay={L[1] - 2} style={{marginTop: 22, alignSelf: 'center'}}>
        <div style={{width: 640, height: 370, borderRadius: 26, background: t.panel, border: `4px solid ${t.accent}`, boxShadow: `0 0 ${50 + 30 * Math.sin(f / 8)}px ${t.accent}55`, padding: 34, position: 'relative'}}>
          <div style={{fontFamily: FONT, fontSize: 26, fontWeight: 800, color: t.accent, letterSpacing: 3}}>LOCAL AI AGENT</div>
          {lines.map((w, i) => (
            <div key={i} style={{height: 22, borderRadius: 11, background: i % 2 ? t.line : t.accent2, width: `${w * 100 * prog(f, L[1] + 10 + i * 14, L[1] + 34 + i * 14)}%`, marginTop: 24, opacity: 0.9}} />
          ))}
          <div style={{position: 'absolute', right: 34, bottom: 30, fontFamily: FONT, fontSize: 24, fontWeight: 700, color: t.dim}}>내 PC에서 실행</div>
        </div>
        <div style={{width: 760, height: 24, borderRadius: '0 0 30px 30px', background: t.line, margin: '0 auto', transform: 'translateX(-60px)'}} />
      </Pop>
      <div style={{display: 'flex', gap: 16, marginTop: 36}}>
        <Tile k="AI 성능" v="최대 1PF" sub="1 petaflop" delay={at(L, E, 2, 0.1)} hot={t.accent} vs={46} />
        <Tile k="통합 메모리" v="최대 128GB" delay={at(L, E, 2, 0.3)} vs={46} />
        <Tile k="예약 주문" v="10.16" sub="소형 데스크톱은 11월" delay={at(L, E, 2, 0.55)} hot={t.accent2} vs={46} />
      </div>
      <Source>NVIDIA 블로그 · 포커스: Windows PC용 로컬 AI 에이전트</Source>
    </Stage>
  );
};

// 3: ChatGPT Slides
const A3: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  const f = useCurrentFrame();
  const t0 = L[1];
  const title = '분기 전략 발표';
  const n = Math.floor(interpolate(f, [t0 + 4, t0 + 40], [0, title.length], clamp));
  const cur1 = {x: interpolate(f, [at(L, E, 2, 0.28), at(L, E, 2, 0.5)], [140, 520], clamp), y: interpolate(f, [at(L, E, 2, 0.28), at(L, E, 2, 0.5)], [330, 180], clamp)};
  const showCur = prog(f, at(L, E, 2, 0.28), at(L, E, 2, 0.36));
  const chips = ['PowerPoint', 'PDF', 'Google Slides'];
  return (
    <Stage>
      <Label delay={4}>OpenAI · ChatGPT Slides (10.16)</Label>
      <Pop delay={L[1] - 2} style={{marginTop: 22}}>
        <div style={{width: '100%', height: 470, borderRadius: 24, background: '#FFFFFF', position: 'relative', padding: 44, overflow: 'hidden'}}>
          <div style={{fontFamily: FONT, fontSize: 70, fontWeight: 900, color: '#16111f', letterSpacing: -2}}>{title.slice(0, n)}<span style={{opacity: f % 16 < 8 ? 1 : 0, color: t.accent}}>|</span></div>
          {[0.75, 0.55, 0.65].map((w, i) => (
            <div key={i} style={{height: 20, borderRadius: 10, background: i === 0 ? t.accent : '#d9d4e6', width: `${w * 100 * prog(f, t0 + 30 + i * 10, t0 + 55 + i * 10)}%`, marginTop: 28}} />
          ))}
          <div style={{display: 'flex', gap: 14, alignItems: 'flex-end', height: 120, marginTop: 30}}>
            {[0.4, 0.7, 0.5, 0.9].map((h, i) => <div key={i} style={{width: 70, height: 120 * h * prog(f, t0 + 50 + i * 8, t0 + 76 + i * 8), background: t.accent2, borderRadius: 8}} />)}
          </div>
          <div style={{position: 'absolute', left: cur1.x, top: cur1.y, opacity: showCur, transform: 'rotate(-20deg)'}}>
            <div style={{width: 0, height: 0, borderLeft: '16px solid transparent', borderRight: '16px solid transparent', borderBottom: `34px solid ${t.accent2}`}} />
            <div style={{background: t.accent2, color: '#fff', fontFamily: FONT, fontSize: 22, fontWeight: 800, padding: '4px 12px', borderRadius: 10, marginLeft: 18}}>팀원</div>
          </div>
          <div style={{position: 'absolute', right: 26, top: 22, fontFamily: FONT, fontSize: 22, fontWeight: 700, color: '#8a8399'}}>※ 예시 화면</div>
        </div>
      </Pop>
      <div style={{display: 'flex', gap: 14, marginTop: 28}}>
        {chips.map((c, i) => (
          <Pop key={c} delay={at(L, E, 2, 0.55 + i * 0.1)}>
            <div style={{padding: '16px 26px', borderRadius: 40, border: `3px solid ${t.accent}`, fontFamily: FONT, fontSize: 32, fontWeight: 800, color: t.ink}}>{c}</div>
          </Pop>
        ))}
      </div>
      <Pop delay={at(L, E, 2, 0.85)}><div style={{fontFamily: FONT, fontSize: 24, fontWeight: 600, color: t.dim, marginTop: 16}}>Pro·Business·Enterprise 이용자부터 순차 적용</div></Pop>
      <Source>OpenAI ChatGPT 릴리스 노트 2026.10.16</Source>
    </Stage>
  );
};

// 4: wrap-up
const A4: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  const Row = ({d, a, b, hot}: {d: number; a: string; b: string; hot?: string}) => (
    <Pop delay={d}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '30px 34px', borderRadius: 26, background: t.panel, border: `2px solid ${hot ?? t.line}`, fontFamily: FONT, fontSize: 46, fontWeight: 900, color: t.ink}}>
        <span style={{color: t.dim}}>{a}</span><span style={{color: hot ?? t.accent, fontSize: 52}}>→</span><span>{b}</span>
      </div>
    </Pop>
  );
  return (
    <Stage>
      <Label delay={4}>오늘의 흐름</Label>
      <div style={{height: 22}} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
        <Row d={L[0] + 4} a="주가" b="나스닥 -1.88%" hot={t.warn} />
        <Row d={at(L, E, 1, 0.2)} a="클라우드" b="내 PC (RTX Spark)" />
        <Row d={at(L, E, 1, 0.5)} a="대화" b="업무 도구 (Slides)" hot={t.accent2} />
      </div>
      <Pop delay={at(L, E, 1, 0.8)}><div style={{fontFamily: FONT, fontSize: 26, fontWeight: 600, color: t.dim, marginTop: 24}}>※ 투자 권유가 아닌 뉴스 요약입니다.</div></Pop>
    </Stage>
  );
};

export const ShortAi: React.FC = () => <Short theme={aiTheme} label="AI" date="2026.10.17 (토)" data={data as unknown as VoiceData} scenes={[A0, A1, A2, A3, A4]} />;
