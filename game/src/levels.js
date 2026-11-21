// The three rooms of the Meridian Vault, each one a fixed layout: where the
// thief starts, where the diamond sits, where the exit opens, what blocks
// sight and movement, and where the guards walk and the cameras watch.
// Nothing here moves; guards.js, cameras.js and thief.js read these rooms.
import { ROOM } from './config.js';

function roomWalls() {
  // The room's own border, as four thin rects, so sight and movement share it.
  return [
    { x: ROOM.x - 8, y: ROOM.y - 8, width: ROOM.width + 16, height: 8 },
    { x: ROOM.x - 8, y: ROOM.y + ROOM.height, width: ROOM.width + 16, height: 8 },
    { x: ROOM.x - 8, y: ROOM.y, width: 8, height: ROOM.height },
    { x: ROOM.x + ROOM.width, y: ROOM.y, width: 8, height: ROOM.height },
  ];
}

// Push a circle out of every rect it overlaps, one axis at a time, so the
// thief and the guards slide along cover instead of sticking to it.
export function slideCircle(rects, x, y, radius) {
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i];
    const nearestX = Math.max(r.x, Math.min(x, r.x + r.width));
    const nearestY = Math.max(r.y, Math.min(y, r.y + r.height));
    const dx = x - nearestX;
    const dy = y - nearestY;
    const dist = Math.hypot(dx, dy);
    if (dist < radius) {
      if (dist === 0) {
        y = r.y - radius;
      } else {
        x = nearestX + (dx / dist) * radius;
        y = nearestY + (dy / dist) * radius;
      }
    }
  }
  return { x, y };
}

export function blockingRects(level) {
  return roomWalls().concat(level.cover);
}

export function sightBlockers(level) {
  // Sight is blocked by the same cover that blocks movement.
  return blockingRects(level);
}

const LEVEL_1 = {
  name: 'Room 1 — The Meridian Hall',
  blurb: 'Cross the hall, lift the Meridian Diamond, reach the east door.',
  thiefStart: { x: 90, y: 620 },
  diamond: { x: 640, y: 232 },
  exit: { x: 1180, y: 92, width: 64, height: 44 },
  guardSpeed: 1,
  cover: [
    { x: 300, y: 180, width: 90, height: 60, kind: 'pedestal' },
    { x: 850, y: 180, width: 90, height: 60, kind: 'pedestal' },
    { x: 300, y: 480, width: 90, height: 60, kind: 'crate' },
    { x: 850, y: 480, width: 90, height: 60, kind: 'crate' },
    { x: 560, y: 250, width: 160, height: 110, kind: 'island' },
    { x: 120, y: 300, width: 70, height: 120, kind: 'planter' },
    { x: 1050, y: 300, width: 70, height: 120, kind: 'planter' },
  ],
  ropes: [
    { x: 560, y: 240, width: 160 },
    { x: 560, y: 380, width: 160 },
  ],
  lamps: [
    { x: 200, y: 150 }, { x: 1080, y: 150 }, { x: 200, y: 600 }, { x: 1080, y: 600 },
  ],
  guards: [
    { waypoints: [{ x: 250, y: 150 }, { x: 1010, y: 150 }, { x: 1010, y: 420 }, { x: 250, y: 420 }], name: 'Bram' },
    { waypoints: [{ x: 1010, y: 560 }, { x: 250, y: 560 }, { x: 250, y: 300 }, { x: 1010, y: 300 }], name: 'Sable' },
    { waypoints: [{ x: 640, y: 120 }, { x: 640, y: 200 }], name: 'Odo' },
  ],
  cameras: [
    { x: 60, y: 110, baseAngle: 0.7 },
    { x: 1220, y: 640, baseAngle: Math.PI + 0.7 },
  ],
  coins: [
    { x: 180, y: 220 }, { x: 180, y: 480 }, { x: 1100, y: 220 }, { x: 1100, y: 480 },
    { x: 480, y: 620 }, { x: 800, y: 620 },
  ],
};

const LEVEL_2 = {
  name: 'Room 2 — The Gilded Gallery',
  blurb: 'Paintings watch the walls. Two patrols cross; the cameras never blink together.',
  thiefStart: { x: 90, y: 620 },
  diamond: { x: 640, y: 252 },
  exit: { x: 1180, y: 92, width: 64, height: 44 },
  guardSpeed: 1.15,
  cover: [
    { x: 220, y: 160, width: 80, height: 140, kind: 'pedestal' },
    { x: 980, y: 160, width: 80, height: 140, kind: 'pedestal' },
    { x: 220, y: 480, width: 80, height: 140, kind: 'crate' },
    { x: 980, y: 480, width: 80, height: 140, kind: 'crate' },
    { x: 560, y: 270, width: 160, height: 100, kind: 'island' },
    { x: 420, y: 120, width: 120, height: 50, kind: 'planter' },
    { x: 720, y: 560, width: 120, height: 50, kind: 'planter' },
    { x: 640, y: 120, width: 60, height: 60, kind: 'pedestal' },
  ],
  ropes: [
    { x: 560, y: 260, width: 160 },
    { x: 560, y: 380, width: 160 },
  ],
  lamps: [
    { x: 340, y: 140 }, { x: 940, y: 140 }, { x: 340, y: 620 }, { x: 940, y: 620 },
  ],
  guards: [
    { waypoints: [{ x: 200, y: 130 }, { x: 1080, y: 130 }, { x: 1080, y: 380 }, { x: 200, y: 380 }], name: 'Bram' },
    { waypoints: [{ x: 1080, y: 600 }, { x: 200, y: 600 }, { x: 200, y: 420 }, { x: 1080, y: 420 }], name: 'Sable' },
    { waypoints: [{ x: 470, y: 120 }, { x: 810, y: 120 }, { x: 810, y: 620 }, { x: 470, y: 620 }], name: 'Odo' },
    { waypoints: [{ x: 640, y: 460 }, { x: 640, y: 560 }], name: 'Wren' },
  ],
  cameras: [
    { x: 60, y: 110, baseAngle: 0.7 },
    { x: 1220, y: 110, baseAngle: Math.PI - 0.7 },
    { x: 640, y: 660, baseAngle: -Math.PI / 2 },
  ],
  coins: [
    { x: 150, y: 340 }, { x: 1130, y: 340 }, { x: 480, y: 200 }, { x: 800, y: 200 },
    { x: 480, y: 560 }, { x: 800, y: 560 }, { x: 640, y: 450 },
  ],
};

const LEVEL_3 = {
  name: 'Room 3 — The Safe Room',
  blurb: 'The last vault. Three cameras, four guards, one diamond. Then the getaway.',
  thiefStart: { x: 90, y: 620 },
  diamond: { x: 640, y: 232 },
  exit: { x: 1180, y: 92, width: 64, height: 44 },
  guardSpeed: 1.3,
  cover: [
    { x: 260, y: 200, width: 70, height: 70, kind: 'pedestal' },
    { x: 950, y: 200, width: 70, height: 70, kind: 'pedestal' },
    { x: 260, y: 470, width: 70, height: 70, kind: 'crate' },
    { x: 950, y: 470, width: 70, height: 70, kind: 'crate' },
    { x: 560, y: 250, width: 160, height: 110, kind: 'island' },
    { x: 480, y: 120, width: 90, height: 50, kind: 'planter' },
    { x: 710, y: 560, width: 90, height: 50, kind: 'planter' },
  ],
  ropes: [
    { x: 560, y: 240, width: 160 },
    { x: 560, y: 380, width: 160 },
  ],
  lamps: [
    { x: 200, y: 150 }, { x: 1080, y: 150 }, { x: 200, y: 600 }, { x: 1080, y: 600 },
  ],
  guards: [
    { waypoints: [{ x: 220, y: 140 }, { x: 1040, y: 140 }, { x: 1040, y: 420 }, { x: 220, y: 420 }], name: 'Bram' },
    { waypoints: [{ x: 1040, y: 580 }, { x: 220, y: 580 }, { x: 220, y: 330 }, { x: 1040, y: 330 }], name: 'Sable' },
    { waypoints: [{ x: 500, y: 110 }, { x: 780, y: 110 }, { x: 780, y: 640 }, { x: 500, y: 640 }], name: 'Odo' },
    { waypoints: [{ x: 640, y: 430 }, { x: 900, y: 430 }, { x: 900, y: 560 }, { x: 640, y: 560 }], name: 'Wren' },
  ],
  cameras: [
    { x: 60, y: 110, baseAngle: 0.7 },
    { x: 1220, y: 110, baseAngle: Math.PI - 0.7 },
    { x: 1220, y: 640, baseAngle: Math.PI + 0.7 },
  ],
  coins: [
    { x: 160, y: 300 }, { x: 1120, y: 300 }, { x: 480, y: 620 }, { x: 800, y: 620 },
    { x: 640, y: 160 }, { x: 640, y: 500 },
  ],
};

export const LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3];
