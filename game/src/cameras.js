// The wall cameras: fixed mounts whose cones sweep back and forth. A camera
// never moves, never chases, and never sees through cover. An EMP burst
// blinds every camera for a few seconds; the HUD shows the countdown.
import { CAMERA } from './config.js';
import { hasLineOfSight, inCone } from './vision.js';

export function createCameras(level) {
  return level.cameras.map((spec) => ({
    x: spec.x,
    y: spec.y,
    baseAngle: spec.baseAngle,
    angle: spec.baseAngle,
    disabledUntil: 0,
  }));
}

export function updateCameras(cameras, now, dt) {
  for (let i = 0; i < cameras.length; i += 1) {
    const camera = cameras[i];
    camera.angle = camera.baseAngle + Math.sin(now * CAMERA.sweepSpeed + i * 2.1) * CAMERA.sweepRange;
  }
}

export function cameraSeesThief(camera, thief, blockers, now) {
  if (now < camera.disabledUntil) return { seen: false, distance: Infinity };
  const cone = inCone(camera.x, camera.y, camera.angle, CAMERA.coneHalfAngle, CAMERA.coneLength, thief.x, thief.y);
  if (!cone.seen) return { seen: false, distance: cone.distance };
  if (!hasLineOfSight(camera.x, camera.y, thief.x, thief.y, blockers)) return { seen: false, distance: cone.distance };
  return { seen: true, distance: cone.distance };
}

export function disableCameras(cameras, now, seconds) {
  for (let i = 0; i < cameras.length; i += 1) {
    cameras[i].disabledUntil = now + seconds;
  }
}
