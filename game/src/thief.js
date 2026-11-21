// The thief: one circle the player steers with WASD or arrows, Shift to
// sneak, and three tools on keys 1-3, spent with a mouse click. Tools cost
// coins; gold coins lying around the room pay for them. The thief lifts the
// diamond, then the exit opens and the getaway begins.
import { ROOM, SCORES, THIEF, TOOLS } from './config.js';
import { slideCircle } from './levels.js';

export function createThief(level) {
  return {
    x: level.thiefStart.x,
    y: level.thiefStart.y,
    coins: 4,
    gold: 0,
    hasDiamond: false,
    smokeUntil: 0,
    sneaking: false,
    moving: false,
  };
}

export function moveThief(thief, input, blockers, dt) {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  thief.moving = dx !== 0 || dy !== 0;
  thief.sneaking = Boolean(input.sneak);
  if (!thief.moving) return;
  const length = Math.hypot(dx, dy);
  const speed = thief.sneaking ? THIEF.sneakSpeed : THIEF.speed;
  const next = slideCircle(
    blockers,
    thief.x + (dx / length) * speed * dt,
    thief.y + (dy / length) * speed * dt,
    THIEF.radius,
  );
  thief.x = Math.max(ROOM.x + THIEF.radius, Math.min(ROOM.x + ROOM.width - THIEF.radius, next.x));
  thief.y = Math.max(ROOM.y + THIEF.radius, Math.min(ROOM.y + ROOM.height - THIEF.radius, next.y));
}

// Spend a tool at a clicked floor point. Returns what happened, so the
// caller can play the right sound and message; null when nothing was spent.
export function useTool(thief, toolKey, x, y, now, guards, cameras, distractGuards, disableCameras) {
  if (toolKey === TOOLS.coin.key) {
    if (thief.coins < TOOLS.coin.cost) return { ok: false, reason: 'Not enough coins — grab gold first.' };
    thief.coins -= TOOLS.coin.cost;
    distractGuards(guards, x, y);
    return { ok: true, tool: 'coin', x, y };
  }
  if (toolKey === TOOLS.smoke.key) {
    if (thief.coins < TOOLS.smoke.cost) return { ok: false, reason: 'Not enough coins — grab gold first.' };
    thief.coins -= TOOLS.smoke.cost;
    thief.smokeUntil = now + 4;
    return { ok: true, tool: 'smoke', x: thief.x, y: thief.y };
  }
  if (toolKey === TOOLS.emp.key) {
    if (thief.coins < TOOLS.emp.cost) return { ok: false, reason: 'Not enough coins — grab gold first.' };
    thief.coins -= TOOLS.emp.cost;
    disableCameras(cameras, now, 6);
    return { ok: true, tool: 'emp' };
  }
  return null;
}

export function thiefCaught(thief, guards) {
  for (let i = 0; i < guards.length; i += 1) {
    if (Math.hypot(guards[i].x - thief.x, guards[i].y - thief.y) < THIEF.catchDistance) return guards[i];
  }
  return null;
}

export function scoreOf(state) {
  return state.score;
}

export function goldValue() {
  return SCORES.goldCoin;
}

export function diamondValue() {
  return SCORES.diamond;
}
