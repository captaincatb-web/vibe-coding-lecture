import {Composition} from 'remotion';
import {Reel} from './Reel';
import {Semis, semiScenes} from './news/Semis';
import {Ai, aiScenes} from './news/Ai';
import {totalFrames} from './news/kit';
export const Root = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={450} fps={30} width={1920} height={1080} />
    <Composition id="NewsSemis" component={Semis} durationInFrames={totalFrames(semiScenes)} fps={30} width={1920} height={1080} />
    <Composition id="NewsAi" component={Ai} durationInFrames={totalFrames(aiScenes)} fps={30} width={1920} height={1080} />
  </>
);
