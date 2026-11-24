import { Composition, Still } from "remotion";
import { MyComposition } from "./Composition";
import { MonsterShort } from "./MonsterShort";
import { VutuVutiSheet, VutuVutiShowcase } from "./vutuvuti/Showcase";
import { VutuVuti3DTest } from "./vutuvuti/Test3D";
import { VutuVutiStreet } from "./human/StreetTest";

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
      <Composition
        id="VutuVutiShowcase"
        component={VutuVutiShowcase}
        durationInFrames={1110}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="VutuVuti3DTest"
        component={VutuVuti3DTest}
        durationInFrames={315}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="VutuVutiStreet"
        component={VutuVutiStreet}
        durationInFrames={390}
        fps={30}
        width={1920}
        height={1080}
      />
      <Still id="VutuVutiSheet" component={VutuVutiSheet} width={1920} height={1080} />
    </>
  );
};
