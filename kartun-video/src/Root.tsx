import { Composition, Still } from "remotion";
import { MyComposition } from "./Composition";
import { MonsterShort } from "./MonsterShort";
import { VutuVutiSheet, VutuVutiShowcase } from "./vutuvuti/Showcase";
import { VutuVuti3DTest } from "./vutuvuti/Test3D";
import { VutuVutiStreet } from "./human/StreetTest";
import { EpisodePenalti } from "./vutuvuti/EpisodePenalti";
import { CharacterAsset } from "./vutuvuti/assets/CharacterAsset";
import { PENALTI_CINEMATIC_FRAMES, PenaltiCinematic } from "./vutuvuti/cinematic/PenaltiCinematic";
import { EpisodeAfcon, afconFrames } from "./vutuvuti/afcon/EpisodeAfcon";

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
      <Composition
        id="EpisodePenalti"
        component={EpisodePenalti}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="EpisodeAfconSilent"
        component={EpisodeAfcon}
        durationInFrames={afconFrames(30, true)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ silent: true }}
      />
      <Composition
        id="EpisodeAfcon"
        component={EpisodeAfcon}
        durationInFrames={afconFrames(30)}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PenaltiCinematic"
        component={PenaltiCinematic}
        durationInFrames={PENALTI_CINEMATIC_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="CharacterAsset"
        component={CharacterAsset}
        durationInFrames={60}
        fps={30}
        width={1000}
        height={1300}
        defaultProps={{ who: "vutu", pose: "idle", view: "front" }}
      />
      <Still id="VutuVutiSheet" component={VutuVutiSheet} width={1920} height={1080} />
    </>
  );
};
