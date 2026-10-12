import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame} from 'remotion';
import {CountUp, Donut, Episode, FadeUp, FONT, HBars, Headline, Kicker, Pad, SceneDef, Theme, clamp, prog, useT} from './kit';

export const semiTheme: Theme = {bg: '#06090F', panel: '#0E1522', ink: '#F2F5FA', dim: '#7C8799', accent: '#3DF5C8', accent2: '#5B8CFF', warn: '#FF5A5F', line: '#1C2636'};
const SRC = '관세청 10월 1~10일 수출입 현황 (통관 기준 잠정치, 2026.10.12)';

// wafer die grid that lights up
const Wafer: React.FC<{size?: number; delay?: number; opacity?: number}> = ({size = 900, delay = 0, opacity = 1}) => {
  const f = useCurrentFrame();
  const t = useT();
  const n = 15, cell = size / n;
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = x - (n - 1) / 2, dy = y - (n - 1) / 2;
    const d = Math.hypot(dx, dy);
    if (d > n / 2 - 0.3) continue;
    const on = prog(f, delay + d * 3, delay + d * 3 + 14);
    const pulse = 0.5 + 0.5 * Math.sin(f * 0.12 - d * 0.7);
    cells.push(
      <div key={`${x}-${y}`} style={{position: 'absolute', left: x * cell + 3, top: y * cell + 3, width: cell - 6, height: cell - 6, borderRadius: 4,
        background: pulse > 0.82 ? t.accent : t.panel, border: `1px solid ${t.line}`, opacity: on, transform: `scale(${0.4 + 0.6 * on})`}} />,
    );
  }
  return (
    <div style={{position: 'relative', width: size, height: size, opacity, borderRadius: '50%', boxShadow: `0 0 0 3px ${t.line}`}}>
      {cells}
    </div>
  );
};

const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const out = prog(f, 110, 146, Easing.bezier(0.7, 0, 0.84, 0));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'flex-end', justifyContent: 'center', paddingRight: 60}}>
        <div style={{transform: `rotate(${f * 0.15}deg) scale(${1 + out * 0.5})`}}><Wafer size={860} delay={4} opacity={0.9} /></div>
      </AbsoluteFill>
      <Pad>
        <Kicker delay={10}>2026년 10월 12일 · 반도체 브리핑</Kicker>
        <div style={{height: 36}} />
        <Headline text={'반도체가\n수출을 두 배로'} size={150} delay={20} weight={900} />
      </Pad>
    </AbsoluteFill>
  );
};

const Export: React.FC = () => {
  const t = useT();
  return (
    <Pad center>
      <Kicker delay={4}>10월 1~10일 전체 수출</Kicker>
      <div style={{height: 30}} />
      <div style={{display: 'flex', alignItems: 'baseline', gap: 24}}>
        <CountUp to={261} start={8} dur={44} size={300} />
        <FadeUp delay={30}><span style={{fontFamily: FONT, fontWeight: 800, fontSize: 90, color: t.ink}}>억 달러</span></FadeUp>
      </div>
      <FadeUp delay={52}>
        <div style={{fontFamily: FONT, fontSize: 56, fontWeight: 700, color: t.dim, marginTop: 20, textAlign: 'center'}}>
          작년보다 <span style={{color: t.accent}}>+102%</span> · 같은 기간 <span style={{color: t.ink}}>역대 최대</span>
        </div>
      </FadeUp>
    </Pad>
  );
};

const Chip: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const lastYear = 45, now = 122, H = 560;
  const p1 = prog(f, 10, 40), p2 = prog(f, 24, 70, Easing.bezier(0.22, 1, 0.36, 1));
  const Bar = ({v, p, hi, label}: {v: number; p: number; hi?: boolean; label: string}) => (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, fontFamily: FONT}}>
      <div style={{fontSize: 52, fontWeight: 800, color: hi ? t.accent : t.dim, opacity: p}}>{Math.round(v * p)}억$</div>
      <div style={{width: 200, height: (v / now) * H * p, background: hi ? t.accent : t.line, borderRadius: '6px 6px 0 0'}} />
      <div style={{fontSize: 34, fontWeight: 700, color: hi ? t.ink : t.dim}}>{label}</div>
    </div>
  );
  return (
    <Pad>
      <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between'}}>
        <div style={{marginBottom: 60}}>
          <Kicker delay={4}>반도체 수출</Kicker>
          <div style={{height: 26}} />
          <Headline text={'122억 달러\n+170.9%'} size={140} delay={10} weight={900} />
          <FadeUp delay={40}><div style={{fontFamily: FONT, fontSize: 40, fontWeight: 600, color: t.dim, marginTop: 24}}>같은 기간 기준 역대 최대</div></FadeUp>
        </div>
        <div style={{display: 'flex', gap: 60, alignItems: 'flex-end'}}>
          <Bar v={lastYear} p={p1} label="2025.10 상순" />
          <Bar v={now} p={p2} hi label="2026.10 상순" />
        </div>
      </div>
    </Pad>
  );
};

const Share: React.FC = () => {
  const t = useT();
  return (
    <Pad>
      <div style={{display: 'flex', alignItems: 'center', gap: 120}}>
        <div style={{position: 'relative', width: 560, height: 560}}>
          <Donut pct={46.7} size={560} delay={6} />
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <CountUp to={46.7} decimals={1} suffix="%" start={6} dur={45} size={120} />
          </div>
        </div>
        <div>
          <Kicker delay={8}>전체 수출 중 반도체 비중</Kicker>
          <div style={{height: 26}} />
          <Headline text={'수출 두 개 중\n하나는 반도체'} size={110} delay={14} />
          <FadeUp delay={44}><div style={{fontFamily: FONT, fontSize: 42, fontWeight: 600, color: t.dim, marginTop: 26}}>1년 전보다 <span style={{color: t.accent}}>+11.9%p</span></div></FadeUp>
        </div>
      </div>
    </Pad>
  );
};

const Daily: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const days = [1, 1, 1, 1, 1, 0.5];
  return (
    <Pad>
      <Kicker delay={4}>조업일 기준 하루 평균 수출</Kicker>
      <div style={{height: 26}} />
      <div style={{display: 'flex', alignItems: 'baseline', gap: 20}}>
        <CountUp to={47.5} decimals={1} start={8} dur={40} size={240} />
        <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 80, color: t.ink}}>억 달러</span>
        <FadeUp delay={40}><span style={{fontFamily: FONT, fontWeight: 800, fontSize: 64, color: t.accent, marginLeft: 30}}>+28.5%</span></FadeUp>
      </div>
      <div style={{display: 'flex', gap: 22, marginTop: 70, alignItems: 'center'}}>
        {days.map((d, i) => {
          const p = spring({frame: f - 30 - i * 5, fps: 30, config: {damping: 14}});
          return (
            <div key={i} style={{width: 150, height: 150, borderRadius: 18, border: `3px solid ${t.line}`, overflow: 'hidden', transform: `scale(${p})`, position: 'relative'}}>
              <div style={{position: 'absolute', left: 0, bottom: 0, width: `${d * 100}%`, height: '100%', background: t.accent, opacity: 0.9}} />
            </div>
          );
        })}
        <FadeUp delay={70}><div style={{fontFamily: FONT, fontSize: 44, fontWeight: 700, color: t.dim, marginLeft: 30}}>조업일수 5.5일 · 역대 최대</div></FadeUp>
      </div>
    </Pad>
  );
};

const Country: React.FC = () => (
  <Pad>
    <Kicker delay={4}>국가별 수출 증가율</Kicker>
    <div style={{height: 20}} />
    <Headline text="중국·미국이 끌었다" size={100} delay={8} />
    <div style={{height: 60}} />
    <HBars delay={20} max={170} width={1150} rows={[
      {label: '중국', value: 167.3, hi: true},
      {label: '미국', value: 159.9, hi: true},
      {label: 'EU', value: 127.3},
      {label: '베트남', value: 89.7},
      {label: '대만', value: 2.6},
    ]} />
  </Pad>
);

const Balance: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const pe = prog(f, 10, 50), pi = prog(f, 20, 60);
  const W = 1200;
  return (
    <Pad>
      <Kicker delay={4}>무역수지</Kicker>
      <div style={{height: 20}} />
      <div style={{display: 'flex', alignItems: 'baseline', gap: 20}}>
        <CountUp to={38} start={40} dur={30} size={200} prefix="+" color={t.accent} />
        <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 70, color: t.ink}}>억 달러 흑자</span>
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 24, marginTop: 50, fontFamily: FONT}}>
        {[{l: '수출', v: 261, p: pe, c: t.accent}, {l: '수입', v: 223, p: pi, c: t.accent2}].map((r) => (
          <div key={r.l} style={{display: 'flex', alignItems: 'center', gap: 28}}>
            <div style={{width: 90, fontSize: 40, fontWeight: 700, color: t.dim}}>{r.l}</div>
            <div style={{height: 64, width: (r.v / 261) * W * r.p, background: r.c, borderRadius: 4}} />
            <div style={{fontSize: 44, fontWeight: 800, color: t.ink, opacity: r.p}}>{r.v}억$</div>
          </div>
        ))}
      </div>
      <FadeUp delay={70}><div style={{fontFamily: FONT, fontSize: 38, fontWeight: 600, color: t.dim, marginTop: 40}}>
        수입도 +65.5% · 중동 상황에 에너지 수입 <span style={{color: t.warn}}>+64.8%</span>
      </div></FadeUp>
    </Pad>
  );
};

const Amd: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const line = prog(f, 20, 60);
  const Node = ({name, sub, d}: {name: string; sub: string; d: number}) => {
    const p = spring({frame: f - d, fps: 30, config: {damping: 14}});
    return (
      <div style={{width: 380, padding: '40px 30px', borderRadius: 24, background: t.panel, border: `2px solid ${t.line}`, textAlign: 'center', transform: `scale(${p})`, fontFamily: FONT}}>
        <div style={{fontSize: 58, fontWeight: 900, color: t.ink}}>{name}</div>
        <div style={{fontSize: 30, fontWeight: 600, color: t.dim, marginTop: 10}}>{sub}</div>
      </div>
    );
  };
  return (
    <Pad>
      <Kicker delay={4}>지난주 흐름 · 10월 7일</Kicker>
      <div style={{height: 20}} />
      <Headline text="AMD 리사 수, 한국 메모리 투톱과 회동" size={78} delay={8} />
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 70}}>
        <Node name="삼성전자" sub="전영현 부회장" d={16} />
        <div style={{width: 160, height: 4, background: t.line, position: 'relative'}}><div style={{width: `${line * 100}%`, height: '100%', background: t.accent}} /></div>
        <Node name="AMD" sub="리사 수 회장" d={10} />
        <div style={{width: 160, height: 4, background: t.line, position: 'relative'}}><div style={{width: `${line * 100}%`, height: '100%', background: t.accent, marginLeft: 'auto'}} /></div>
        <Node name="SK하이닉스" sub="곽노정 사장" d={22} />
      </div>
      <FadeUp delay={60}><div style={{fontFamily: FONT, fontSize: 40, fontWeight: 700, color: t.ink, marginTop: 60, textAlign: 'center'}}>
        삼성전자, AMD <span style={{color: t.accent}}>MI455X</span>용 <span style={{color: t.accent}}>HBM4</span> 우선 공급업체
      </div></FadeUp>
    </Pad>
  );
};

const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: 0.35}}>
        <div style={{transform: `rotate(${f * 0.2}deg)`, opacity: 0.6}}><Wafer size={1000} /></div>
      </AbsoluteFill>
      <Pad center>
        <Headline text={'AI 메모리 사이클,\n아직 진행 중'} size={130} weight={900} delay={6} align="center" />
        <FadeUp delay={30}><div style={{fontFamily: FONT, fontSize: 36, fontWeight: 600, color: t.dim, marginTop: 40, textAlign: 'center'}}>TODAY BRIEF · 2026.10.12</div></FadeUp>
      </Pad>
    </AbsoluteFill>
  );
};

export const semiScenes: SceneDef[] = [
  {dur: 130, el: <Intro />},
  {dur: 190, el: <Export />, source: SRC},
  {dur: 190, el: <Chip />, source: SRC},
  {dur: 180, el: <Share />, source: SRC},
  {dur: 170, el: <Daily />, source: SRC},
  {dur: 200, el: <Country />, source: SRC},
  {dur: 180, el: <Balance />, source: SRC},
  {dur: 160, el: <Amd />, source: '연합뉴스 (2026.10.07)'},
  {dur: 100, el: <Outro />},
];

export const Semis: React.FC = () => <Episode theme={semiTheme} label="반도체" date="2026.10.12" scenes={semiScenes} />;
