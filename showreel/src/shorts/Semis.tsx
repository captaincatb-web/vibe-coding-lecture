import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT, prog, useT} from '../news/kit';
import {semiTheme} from '../news/Semis';
import data from './data/semis.json';
import {Big, Label, LineChart, Pop, SceneProps, Short, Source, Stage, Tile, VoiceData} from './kit';

const at = (L: number[], E: number[], i: number, frac: number) => Math.round(L[i] + (E[i] - L[i]) * frac);

// 0: hook
const S0: React.FC<SceneProps> = ({L}) => {
  const t = useT();
  return (
    <Stage>
      <Label delay={4}>코스피 · 10.15(목) 종가</Label>
      <div style={{height: 14}} />
      <Big to={-7.57} decimals={2} suffix="%" start={L[0]} dur={28} color={t.warn} shake size={250} />
      <Pop delay={L[0] + 34}><div style={{fontFamily: FONT, fontSize: 44, fontWeight: 800, color: t.ink, margin: '10px 0 26px'}}>5,554.22 <span style={{color: t.dim, fontWeight: 600, fontSize: 32}}>마감</span></div></Pop>
      <LineChart delay={L[0] + 20} h={230} pts={[{x: '10.5', y: 7003.74, est: true}, {x: '10.12', y: 6384.24}, {x: '10.14', y: 6008.81, est: true}, {x: '10.15', y: 5554.22}]} />
      <Source>연합뉴스·뉴스핌 · * 보도된 등락폭으로 환산한 종가</Source>
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
      <Label delay={4}>외국인 순매도 속 대형 반도체주 동반 급락</Label>
      <div style={{height: 26}} />
      <div style={{display: 'flex', gap: 22}}>
        <Tile k="삼성전자" v="-9.48%" sub="210,000원 마감" hot={t.warn} delay={L[0] + 2} vs={84} />
        <Tile k="SK하이닉스" v="-11.06%" sub="1,262,000원 마감" hot={t.warn} delay={L[0] + 24} vs={84} />
      </div>
      <Pop delay={badge} style={{marginTop: 34}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 16, padding: '20px 30px', borderRadius: 18, background: t.warn, color: '#fff', fontFamily: FONT, fontSize: 40, fontWeight: 900, opacity: 0.8 + 0.2 * Math.sin(f / 4)}}>
          <div style={{width: 18, height: 18, borderRadius: 9, background: '#fff'}} />장중 서킷브레이커 발동
        </div>
        <div style={{fontFamily: FONT, fontSize: 28, fontWeight: 600, color: t.dim, marginTop: 14}}>코스피·코스닥 양 시장에서 발동</div>
      </Pop>
      <Source>뉴스핌(한국거래소 집계) 2026.10.15</Source>
    </Stage>
  );
};

// 2: reasons
const S2: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  const Card = ({d, k, v, s, hot}: {d: number; k: string; v: string; s: string; hot?: string}) => (
    <Tile k={k} v={v} sub={s} delay={d} hot={hot ?? t.warn} w={undefined} vs={76} />
  );
  return (
    <Stage>
      <Label delay={4}>급락 배경 3가지</Label>
      <div style={{height: 22}} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
        <Card d={at(L, E, 1, 0.02)} k="① 미국 9월 소비자물가(CPI)" v="+3.7%" s="시장 예상 3.6% · 금리 인상 우려 확대" />
        <Card d={at(L, E, 1, 0.38)} k="② 필라델피아 반도체지수 (10.14)" v="-4.3%" s="엔비디아·AMD도 하락, 6거래일 연속 하락" />
        <Card d={at(L, E, 1, 0.66)} k="③ 중국 CXMT 메모리 추격" v="공급 우려" s="삼성·SK 주가 부담 요인으로 거론" hot={t.accent2} />
      </div>
      <Source>ABC뉴스(10.15) · 뉴스핌(10.15)</Source>
    </Stage>
  );
};

// 3: TSMC
const S3: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  return (
    <Stage>
      <Label delay={4}>TSMC 2026년 3분기 (10.15 발표)</Label>
      <div style={{height: 10}} />
      <Big to={41.2} decimals={1} sign suffix="%" start={at(L, E, 1, 0.3)} dur={26} color={t.accent} size={220} />
      <Pop delay={at(L, E, 1, 0.3)}><div style={{fontFamily: FONT, fontSize: 34, fontWeight: 700, color: t.dim, margin: '8px 0 30px'}}>매출 · 전년 동기 대비 (달러 기준)</div></Pop>
      <div style={{display: 'flex', gap: 18}}>
        <Tile k="분기 매출" v="$46.7B" sub="467억 달러" delay={at(L, E, 1, 0.3)} hot={t.accent} vs={54} />
        <Tile k="매출총이익률" v="66.4%" delay={at(L, E, 1, 0.74)} hot={t.accent} vs={54} />
        <Tile k="순이익(대만달러)" v="+68.7%" sub="NT$7,630억" delay={at(L, E, 1, 0.9)} vs={54} />
      </div>
      <Source>TSMC 실적 발표 자료 2026.10.15</Source>
    </Stage>
  );
};

// 4: Samsung OP + selling
const S4: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  return (
    <Stage>
      <Label delay={4}>삼성전자 3분기 영업이익 (10.8 발표)</Label>
      <div style={{height: 12}} />
      <div style={{display: 'flex', alignItems: 'baseline', gap: 16}}>
        <Big to={107.4} decimals={1} start={L[0] + 2} dur={36} size={250} color={t.accent} />
        <Pop delay={L[0] + 30}><span style={{fontFamily: FONT, fontWeight: 900, fontSize: 86, color: t.ink}}>조 원</span></Pop>
      </div>
      <div style={{height: 34}} />
      <Pop delay={at(L, E, 0, 0.62)}>
        <Tile k="그런데도 10.15 외국인은" v="약 4.8조 원 순매도" sub="코스피 기준 · 한국거래소 집계" hot={t.warn} vs={56} />
      </Pop>
      <Source>포커스온경제(10.12) · 뉴스핌(10.15)</Source>
    </Stage>
  );
};

// 5: Friday rebound
const S5: React.FC<SceneProps> = ({L, E}) => {
  const t = useT();
  return (
    <Stage>
      <Label delay={4}>코스피 · 10.16(금) · 8거래일 만에 반등</Label>
      <div style={{height: 8}} />
      <Big to={2.05} decimals={2} sign suffix="%" start={L[1]} dur={22} color={t.accent} size={230} />
      <div style={{height: 16}} />
      <LineChart delay={L[1] + 8} color={t.accent} h={200} pts={[{x: '10.5', y: 7003.74, est: true}, {x: '10.12', y: 6384.24}, {x: '10.14', y: 6008.81, est: true}, {x: '10.15', y: 5554.22}, {x: '10.16', y: 5668.05}]} />
      <div style={{display: 'flex', gap: 20, marginTop: 56}}>
        <Tile k="삼성전자" v="+2.62%" delay={at(L, E, 1, 0.62)} hot={t.accent} vs={64} />
        <Tile k="SK하이닉스" v="+0.79%" sub="회복 상대적으로 약함" delay={at(L, E, 1, 0.72)} vs={64} />
      </div>
      <Source>연합뉴스(10.16) · * 보도된 등락폭으로 환산한 종가</Source>
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
      <Label delay={4}>정리</Label>
      <div style={{height: 22}} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
        <Row d={L[0] + 4} ok k="실적" v="TSMC 매출 +41.2% · 삼성전자 영업이익 107조 원대" />
        <Row d={L[1] + 4} ok={false} k="수급" v="외국인 매도세가 잦아들지" />
        <Row d={at(L, E, 1, 0.55)} ok={false} k="변수" v="미국 물가·금리 경로" />
      </div>
      <Pop delay={at(L, E, 1, 0.8)}><div style={{fontFamily: FONT, fontSize: 26, fontWeight: 600, color: t.dim, marginTop: 24}}>※ 투자 권유가 아닌 뉴스 요약입니다.</div></Pop>
    </Stage>
  );
};

export const ShortSemis: React.FC = () => <Short theme={semiTheme} label="반도체" date="2026.10.17 (토)" data={data as unknown as VoiceData} scenes={[S0, S1, S2, S3, S4, S5, S6]} />;
