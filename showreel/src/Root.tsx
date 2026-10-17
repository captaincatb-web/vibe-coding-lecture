import {Composition} from 'remotion';
import {Reel} from './Reel';
import {Semis, semiScenes} from './news/Semis';
import {Ai, aiScenes} from './news/Ai';
import {totalFrames} from './news/kit';
import {ShortSemis} from './shorts/Semis';
import {ShortAi} from './shorts/Ai';
import {ShortSemisEn} from './shorts/SemisEn';
import {ShortAiEn} from './shorts/AiEn';
import semisEnData from './shorts/data/semis_en.json';
import aiEnData from './shorts/data/ai_en.json';
import semisData from './shorts/data/semis.json';
import aiData from './shorts/data/ai.json';
export const Root = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={450} fps={30} width={1920} height={1080} />
    <Composition id="NewsSemis" component={Semis} durationInFrames={totalFrames(semiScenes)} fps={30} width={1920} height={1080} />
    <Composition id="NewsAi" component={Ai} durationInFrames={totalFrames(aiScenes)} fps={30} width={1920} height={1080} />
    <Composition id="ShortSemis" component={ShortSemis} durationInFrames={semisData.total} fps={30} width={1080} height={1920} />
    <Composition id="ShortAi" component={ShortAi} durationInFrames={aiData.total} fps={30} width={1080} height={1920} />
    <Composition id="ShortSemisEn" component={ShortSemisEn} durationInFrames={semisEnData.total} fps={30} width={1080} height={1920} />
    <Composition id="ShortAiEn" component={ShortAiEn} durationInFrames={aiEnData.total} fps={30} width={1080} height={1920} />
  </>
);
