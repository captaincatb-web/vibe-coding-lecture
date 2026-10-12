import {Composition} from 'remotion';
import {Reel} from './Reel';
export const Root = () => (
  <Composition id="Reel" component={Reel} durationInFrames={450} fps={30} width={1920} height={1080} />
);
