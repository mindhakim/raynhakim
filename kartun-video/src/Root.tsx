import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { MonsterShort } from "./MonsterShort";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Composition
        id="MonsterShort"
        component={MonsterShort}
        durationInFrames={720}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
