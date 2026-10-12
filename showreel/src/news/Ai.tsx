import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame} from 'remotion';
import {Episode, FadeUp, FONT, Headline, Kicker, Pad, SceneDef, Theme, clamp, prog, useT} from './kit';

export const aiTheme: Theme = {bg: '#0A0812', panel: '#15111F', ink: '#F5F2FA', dim: '#8A8399', accent: '#B794FF', accent2: '#FF8A5B', warn: '#FF4D5E', line: '#241E33'};

// drifting neural graph
const Net: React.FC<{opacity?: number; n?: number}> = ({opacity = 1, n = 28}) => {
  const f = useCurrentFrame();
  const t = useT();
  const pts = Array.from({length: n}, (_, i) => {
    const a = i * 2.39996, r = 120 + (i * 37) % 420;
    return {x: 960 + Math.cos(a + f * 0.004 * (i % 2 ? 1 : -1)) * r * 1.6, y: 540 + Math.sin(a + f * 0.004) * r};
  });
  const lines: React.ReactNode[] = [];
  pts.forEach((p, i) => pts.slice(i + 1).forEach((q, j) => {
    const d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d < 260) {
      const on = prog(f, (i + j) % 30, ((i + j) % 30) + 20);
      lines.push(<line key={`${i}-${j}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={t.accent} strokeOpacity={(1 - d / 260) * 0.6 * on} strokeWidth={2} />);
    }
  }));
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', opacity}}>
      {lines}
      {pts.map((p, i) => {
        const pulse = 0.5 + 0.5 * Math.sin(f * 0.15 + i);
        return <circle key={i} cx={p.x} cy={p.y} r={5 + pulse * 5} fill={i % 5 === 0 ? t.accent2 : t.accent} opacity={prog(f, i, i + 12)} />;
      })}
    </svg>
  );
};

const Intro: React.FC = () => (
  <AbsoluteFill>
    <Net opacity={0.8} />
    <Pad>
      <Kicker delay={10}>2026년 10월 12일 · AI 브리핑</Kicker>
      <div style={{height: 36}} />
      <Headline text={'더 열리는 모델,\n더 가까운 위험'} size={140} delay={20} weight={900} />
    </Pad>
  </AbsoluteFill>
);

// mock chat that turns into generated UI cards
const Gpt: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const q = '다음 주 제주 2박 3일 일정 짜줘';
  const typed = q.slice(0, Math.floor(interpolate(f, [70, 110], [0, q.length], clamp)));
  const win = spring({frame: f - 56, fps: 30, config: {damping: 16}});
  const Card = ({d, w, h, children}: {d: number; w: number; h: number; children: React.ReactNode}) => {
    const p = spring({frame: f - d, fps: 30, config: {damping: 15}});
    return <div style={{width: w, height: h, borderRadius: 18, background: '#1F1830', border: `2px solid ${t.line}`, padding: 22, transform: `translateY(${(1 - p) * 60}px) scale(${0.9 + 0.1 * p})`, opacity: p, fontFamily: FONT, color: t.ink, overflow: 'hidden'}}>{children}</div>;
  };
  return (
    <Pad>
      <div style={{display: 'flex', alignItems: 'center', gap: 90}}>
        <div style={{width: 700}}>
          <Kicker delay={4}>OpenAI · ChatGPT</Kicker>
          <div style={{height: 26}} />
          <Headline text={'무료 이용자도\nGPT-6'} size={110} delay={10} weight={900} />
          <FadeUp delay={34}><div style={{fontFamily: FONT, fontSize: 40, fontWeight: 600, color: t.dim, marginTop: 26, lineHeight: 1.4}}>
            질문에 맞춰 <span style={{color: t.accent}}>화면을 직접 만드는</span><br />‘인텔리전트 UI’ 도입
          </div></FadeUp>
        </div>
        <div style={{width: 820, height: 640, borderRadius: 28, background: t.panel, border: `2px solid ${t.line}`, padding: 34, transform: `scale(${win})`, opacity: win, display: 'flex', flexDirection: 'column', gap: 22}}>
          <div style={{alignSelf: 'flex-end', background: t.accent, color: '#120C1E', fontFamily: FONT, fontWeight: 700, fontSize: 30, padding: '16px 26px', borderRadius: '22px 22px 6px 22px', minHeight: 36}}>{typed}<span style={{opacity: f % 20 < 10 && f < 118 ? 1 : 0}}>|</span></div>
          <div style={{display: 'flex', gap: 18}}>
            <Card d={122} w={360} h={220}>
              <div style={{fontSize: 22, color: t.dim, fontWeight: 600}}>DAY 1</div>
              {['성산일출봉', '섭지코지', '흑돼지 저녁'].map((s, i) => (
                <div key={s} style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, fontSize: 26, fontWeight: 700}}>
                  <div style={{width: 12, height: 12, borderRadius: 6, background: i === 0 ? t.accent2 : t.accent}} />{s}
                </div>
              ))}
            </Card>
            <Card d={130} w={360} h={220}>
              <div style={{fontSize: 22, color: t.dim, fontWeight: 600}}>날씨</div>
              <div style={{display: 'flex', gap: 14, marginTop: 22}}>
                {[22, 20, 23].map((v, i) => (
                  <div key={i} style={{flex: 1, textAlign: 'center'}}>
                    <div style={{width: 46, height: 46, borderRadius: 23, background: i === 1 ? t.dim : t.accent2, margin: '0 auto'}} />
                    <div style={{fontSize: 28, fontWeight: 800, marginTop: 10}}>{v}°</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <Card d={138} w={738} h={190}>
            <div style={{fontSize: 22, color: t.dim, fontWeight: 600}}>동선</div>
            <svg width={690} height={120}>
              <path d="M20 90 C 160 10, 300 110, 420 50 S 620 20, 670 70" fill="none" stroke={t.accent} strokeWidth={5} strokeDasharray={900} strokeDashoffset={900 * (1 - prog(f, 140, 175))} />
              {[[20, 90], [420, 50], [670, 70]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={11} fill={t.accent2} opacity={prog(f, 140 + i * 10, 150 + i * 10)} />)}
            </svg>
          </Card>
          <div style={{fontFamily: FONT, fontSize: 20, color: t.dim, alignSelf: 'flex-end', opacity: prog(f, 150, 165)}}>* 이해를 돕기 위한 예시 화면</div>
        </div>
      </div>
    </Pad>
  );
};

const Haiku: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  return (
    <AbsoluteFill>
      {Array.from({length: 16}, (_, i) => {
        const y = 140 + ((i * 53) % 820);
        const x = ((f * (18 + (i % 4) * 8) + i * 300) % 2600) - 600;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 300 + (i % 3) * 140, height: 4, borderRadius: 2, background: i % 3 === 0 ? t.accent : t.line, opacity: 0.8}} />;
      })}
      <Pad center>
        <Kicker delay={4}>Anthropic</Kicker>
        <div style={{height: 30}} />
        <Headline text="Claude Haiku 5.5 출시" size={140} delay={8} weight={900} align="center" />
        <FadeUp delay={34}><div style={{fontFamily: FONT, fontSize: 42, fontWeight: 600, color: t.dim, marginTop: 30, textAlign: 'center'}}>클로드 라인업의 가장 가볍고 빠른 모델</div></FadeUp>
      </Pad>
    </AbsoluteFill>
  );
};

const Mistral: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const groups = ['1', '000', '000', '000', '000'];
  return (
    <Pad>
      <Kicker delay={4}>Mistral AI · 오픈웨이트</Kicker>
      <div style={{height: 30}} />
      <div style={{display: 'flex', alignItems: 'baseline', fontFamily: FONT, fontWeight: 900, fontSize: 168, color: t.ink, fontVariantNumeric: 'tabular-nums'}}>
        {groups.map((g, i) => {
          const p = spring({frame: f - 8 - i * 5, fps: 30, config: {damping: 13}});
          return (
            <span key={i} style={{display: 'inline-block', overflow: 'hidden', paddingRight: 4}}>
              <span style={{display: 'inline-block', transform: `translateY(${(1 - p) * 100}%)`, color: i === 0 ? t.accent : t.ink}}>{i ? ',' : ''}{g}</span>
            </span>
          );
        })}
      </div>
      <div style={{height: 20}} />
      <Headline text="1조 매개변수 모델 ‘르총크’ 공개" size={80} delay={34} />
      <FadeUp delay={56}><div style={{fontFamily: FONT, fontSize: 40, fontWeight: 600, color: t.dim, marginTop: 24}}>가중치를 내려받아 직접 돌릴 수 있는 <span style={{color: t.accent}}>오픈웨이트</span> 방식</div></FadeUp>
    </Pad>
  );
};

const Artex: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const steps = [
    {d: 60, k: '정체', v: '중국산 AI 침투테스트 도구', s: '한국 금융권 연쇄 해킹에 쓰인 것으로 알려짐'},
    {d: 110, k: '10월 8일', v: '개발자, 공개 개발 중단', s: '업데이트 중단·추가 버전 미공개, 깃허브 페이지 삭제'},
    {d: 160, k: '남은 문제', v: '이미 퍼진 사본은 회수 불가', s: '개발 중단만으로 악용을 막기 어렵다는 지적'},
  ];
  const flash = f > 20 && f < 60 && Math.floor(f / 5) % 2 === 0 ? 0.08 : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: t.warn, opacity: flash}} />
      <Pad>
        <Kicker delay={4} color={t.warn}>보안 경보 · AI 해킹 도구</Kicker>
        <div style={{height: 26}} />
        <Headline text="‘아르텍스’ 공개 중단" size={130} delay={10} weight={900} />
        <div style={{display: 'flex', gap: 28, marginTop: 60}}>
          {steps.map((s, i) => {
            const p = spring({frame: f - s.d, fps: 30, config: {damping: 16}});
            const last = i === steps.length - 1;
            return (
              <div key={i} style={{flex: 1, padding: 34, borderRadius: 22, background: t.panel, border: `2px solid ${last ? t.warn : t.line}`, opacity: p, transform: `translateY(${(1 - p) * 50}px)`, fontFamily: FONT}}>
                <div style={{fontSize: 26, fontWeight: 700, color: last ? t.warn : t.accent}}>{String(i + 1).padStart(2, '0')} · {s.k}</div>
                <div style={{fontSize: 42, fontWeight: 800, color: t.ink, marginTop: 16, lineHeight: 1.25}}>{s.v}</div>
                <div style={{fontSize: 28, fontWeight: 500, color: t.dim, marginTop: 14, lineHeight: 1.4}}>{s.s}</div>
              </div>
            );
          })}
        </div>
      </Pad>
    </AbsoluteFill>
  );
};

const Gov: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const Track = ({y, label, color, d}: {y: number; label: string; color: string; d: number}) => {
    const p = prog(f, d, d + 50);
    return (
      <div style={{position: 'relative', height: 120, marginTop: y}}>
        <div style={{position: 'absolute', top: 56, left: 0, width: `${p * 100}%`, height: 8, borderRadius: 4, background: color}} />
        <div style={{position: 'absolute', top: 36, left: `calc(${p * 100}% - 24px)`, width: 48, height: 48, borderRadius: 24, background: color, boxShadow: `0 0 40px ${color}`}} />
        <div style={{position: 'absolute', top: -14, left: 0, fontFamily: FONT, fontSize: 44, fontWeight: 800, color: t.ink, opacity: prog(f, d, d + 16)}}>{label}</div>
      </div>
    );
  };
  return (
    <Pad>
      <Kicker delay={4}>정부 AI 전략</Kicker>
      <div style={{height: 20}} />
      <Headline text="두 트랙으로 간다" size={110} delay={8} weight={900} />
      <div style={{height: 50}} />
      <Track y={0} label="독자 AI 파운데이션 모델(독파모) 유지" color={t.accent} d={26} />
      <Track y={40} label="프론티어 AI 병행 추진" color={t.accent2} d={40} />
    </Pad>
  );
};

const Kes: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const p = spring({frame: f - 6, fps: 30, config: {damping: 14}});
  return (
    <Pad>
      <div style={{display: 'flex', alignItems: 'center', gap: 100}}>
        <div style={{width: 380, height: 470, borderRadius: 30, background: t.panel, border: `2px solid ${t.line}`, overflow: 'hidden', transform: `scale(${p})`, fontFamily: FONT, textAlign: 'center'}}>
          <div style={{background: t.accent, color: '#120C1E', fontSize: 44, fontWeight: 800, padding: 22}}>10월</div>
          <div style={{fontSize: 230, fontWeight: 900, color: t.ink, lineHeight: 1.25}}>13</div>
          <div style={{fontSize: 34, fontWeight: 700, color: t.dim}}>화요일 · 내일</div>
        </div>
        <div>
          <Kicker delay={10}>한국전자전 KES 2026 · 서울 코엑스</Kicker>
          <div style={{height: 26}} />
          <Headline text={'KAIST·ETRI\n자율주행·AI 기술 공개'} size={96} delay={16} />
        </div>
      </div>
    </Pad>
  );
};

const Outro: React.FC = () => {
  const t = useT();
  const items = ['GPT-6 무료 개방', 'Claude Haiku 5.5', '미스트랄 1조 오픈웨이트', '아르텍스 공개 중단', '독파모 + 프론티어 AI'];
  return (
    <AbsoluteFill>
      <Net opacity={0.3} n={20} />
      <Pad>
        <Headline text="오늘의 AI 5줄" size={110} weight={900} delay={4} />
        <div style={{display: 'flex', flexDirection: 'column', gap: 18, marginTop: 40}}>
          {items.map((s, i) => (
            <FadeUp key={s} delay={16 + i * 6} dist={24}>
              <div style={{fontFamily: FONT, fontSize: 46, fontWeight: 700, color: i === 3 ? t.warn : t.ink, display: 'flex', gap: 24}}>
                <span style={{color: t.accent, width: 60}}>{String(i + 1).padStart(2, '0')}</span>{s}
              </div>
            </FadeUp>
          ))}
        </div>
      </Pad>
    </AbsoluteFill>
  );
};

export const aiScenes: SceneDef[] = [
  {dur: 130, el: <Intro />},
  {dur: 230, el: <Gpt />, source: 'OpenAI (2026.10.07) · YTN 사이언스 (2026.10.12)'},
  {dur: 160, el: <Haiku />, source: '바이라인네트워크 주간 리포트 (2026.10.12)'},
  {dur: 180, el: <Mistral />, source: '바이라인네트워크 주간 리포트 (2026.10.12)'},
  {dur: 320, el: <Artex />, source: '연합뉴스 · 파이낸셜뉴스 · YTN (2026.10.10)'},
  {dur: 170, el: <Gov />, source: '바이라인네트워크 주간 리포트 (2026.10.12)'},
  {dur: 160, el: <Kes />, source: '연합뉴스 (2026.10.12)'},
  {dur: 150, el: <Outro />},
];

export const Ai: React.FC = () => <Episode theme={aiTheme} label="AI" date="2026.10.12" scenes={aiScenes} />;
