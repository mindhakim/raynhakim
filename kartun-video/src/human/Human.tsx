import React, { useMemo } from "react";
import { Look, Pose } from "../vutuvuti/types";
import { buildHuman } from "./buildHuman";

const PX = 0.0042; // pose pixels → meters
const d2r = (d: number) => (d * Math.PI) / 180;

// A realistic-proportion, skinned Vutu / Vuti. Driven by the same Pose data as the cartoon rigs.
export const Human: React.FC<{
  look: Look;
  pose: Pose;
  position: [number, number, number];
  yaw: number;
}> = ({ look, pose, position, yaw }) => {
  const rig = useMemo(() => buildHuman(look), [look]);
  const b = rig.bones;

  // Apply the pose to the skeleton (deterministic per frame)
  b.hips.position.set(pose.x * PX, 0.95 - pose.y * PX, 0);
  b.spine.rotation.set(d2r(pose.lean) * 0.5, 0, -d2r(pose.tilt) * 0.5);
  b.chest.rotation.set(d2r(pose.lean) * 0.5, 0, -d2r(pose.tilt) * 0.5);
  b.neck.rotation.set(0, 0, -d2r(pose.head) * 0.4);
  b.head.rotation.set(0, 0, -d2r(pose.head) * 0.6);

  const sides: ["A" | "B", number][] = [
    ["A", -1],
    ["B", 1],
  ];
  for (const [S, s] of sides) {
    const arm = S === "A" ? pose.armA : pose.armB;
    const leg = S === "A" ? pose.legA : pose.legB;
    b[`ua${S}`].rotation.set(-d2r(arm.sh), 0, s * d2r(arm.ab - 6));
    b[`fa${S}`].rotation.set(-d2r(arm.el), 0, s * d2r(arm.elAb));
    b[`h${S}`].rotation.set(0, 0, 0);
    b[`th${S}`].rotation.set(-d2r(leg.hip), 0, s * d2r(leg.ab - 3));
    b[`sh${S}`].rotation.set(d2r(leg.knee), 0, 0);
    b[`ft${S}`].rotation.set(d2r(leg.foot), 0, 0);
  }

  // Face: blink + mouth openness
  const mouthLevel = Math.max(0, Math.min(3, Math.round(pose.mouth * 3)));
  const face = rig.faces.get(`${pose.blink > 0.5 ? 1 : 0}-${mouthLevel}`)!;
  if (rig.faceMat.map !== face) {
    rig.faceMat.map = face;
    rig.faceMat.needsUpdate = true;
  }

  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <primitive object={rig.root} />
    </group>
  );
};
