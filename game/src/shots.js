// The screenshot scenes behind ?shot=cover|stealth|alarm|clear. Each one
// plays the real rules forward from a fresh room, steered by a simple
// autopilot that scores eight possible steps — toward its target, away from
// any cone that can see it — so the frame is what a short game really looks
// like, and the same seed always gives the same frame.
import { STEP } from './config.js';
import { guardSeesThief } from './guards.js';
import { cameraSeesThief } from './cameras.js';
import { blockingRects } from './levels.js';
import { createWorld, stepWorld, WORLD_CLEARED } from './world.js';
import { useTool } from './thief.js';
import { distractGuards } from './guards.js';
import { disableCameras } from './cameras.js';
import { SCREEN_PLAY, SCREEN_ROOM_CLEAR } from './render.js';

const SAMPLE = STEP;
const DIRECTIONS = [
  [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

function dangerAt(world, x, y) {
  const blockers = blockingRects(world.level);
  const probe = { x, y };
  let danger = 0;
  for (const guard of world.guards) {
    const sight = guardSeesThief(guard, probe, blockers, 0, world.now);
    if (sight.seen) danger += 600;
    const dist = Math.hypot(guard.x - x, guard.y - y);
    if (dist < 90) danger += (90 - dist) * 3;
  }
  for (const camera of world.cameras) {
    const sight = cameraSeesThief(camera, probe, blockers, world.now);
    if (sight.seen) danger += 500;
  }
  return danger;
}

// One autopilot step: of the eight ways to move, take the one that gets
// closest to the target for the least danger. `brave` ignores danger, for
// the alarm scene, where the thief walks straight into a cone. `sneak`
// moves slow and halves how fast the alarm climbs while seen.
function autopilotStep(world, target, brave, sneak) {
  const thief = world.thief;
  let bestScore = -Infinity;
  let best = { up: false, down: false, left: false, right: false, sneak: Boolean(sneak) };
  for (const [dx, dy] of DIRECTIONS) {
    const x = thief.x + dx * 10;
    const y = thief.y + dy * 10;
    const dist = Math.hypot(target.x - x, target.y - y);
    const score = -dist - (brave ? 0 : dangerAt(world, x, y));
    if (score > bestScore) {
      bestScore = score;
      best = { up: dy < 0, down: dy > 0, left: dx < 0, right: dx > 0, sneak: Boolean(sneak) };
    }
  }
  return best;
}

function nearestCoin(world) {
  let best = null;
  let bestDist = Infinity;
  for (const coin of world.coins) {
    if (coin.taken) continue;
    const dist = Math.hypot(coin.x - world.thief.x, coin.y - world.thief.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = coin;
    }
  }
  return best;
}

function runFor(world, seconds, targetFn, brave, sneak = false) {
  const events = [];
  for (let i = 0; i < seconds / SAMPLE; i += 1) {
    if (world.status !== 'playing') break;
    const target = targetFn(world);
    if (target === null) break;
    stepWorld(world, autopilotStep(world, target, brave, sneak), SAMPLE, events);
  }
  return events;
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * cover: mid-heist, thief closing on the diamond, alarm already warm.
 * stealth: a coin toss has pulled a guard away; the thief waits behind cover.
 * alarm: the thief blundered into a cone and the room is hunting them.
 * clear: the room is cleared, the bonus counted, the door standing open.
 * The clear scene replays the room from a fresh start with a sneaking
 * autopilot, so the clear on screen is a clear the rules really produced;
 * it never paints a clear over a caught room.
 */
export function stageShot(name, world, seed = 7) {
  if (name === 'stealth') {
    runFor(world, 9, (w) => nearestCoin(w) || w.level.diamond, false);
    const guard = world.guards[0];
    const pingX = guard.x + 120;
    const pingY = guard.y + 40;
    const result = useTool(world.thief, '1', pingX, pingY, world.now, world.guards, world.cameras, distractGuards, disableCameras);
    if (result && result.ok) world.pings.push({ x: pingX, y: pingY, until: world.now + 2 });
    return { screen: SCREEN_PLAY };
  }
  if (name === 'alarm') {
    runFor(world, 16, (w) => w.level.diamond, true);
    if (world.alarm < 55) {
      // The brave walk never quite reached a cone: put the thief where the
      // nearest guard's cone already falls, and let one real step do the rest.
      const guard = world.guards[0];
      world.thief.x = guard.x + Math.cos(guard.facing) * 120;
      world.thief.y = guard.y + Math.sin(guard.facing) * 120;
      runFor(world, 4, () => ({ x: world.thief.x, y: world.thief.y }), true);
    }
    return { screen: SCREEN_PLAY };
  }
  if (name === 'clear') {
    const targetFor = (w) => (w.diamondTaken ? { x: w.level.exit.x + 32, y: w.level.exit.y + 22 } : w.level.diamond);
    for (let attempt = 0; attempt < 2 && world.status !== WORLD_CLEARED; attempt += 1) {
      if (attempt > 0 || world.status !== 'playing') {
        Object.assign(world, createWorld(world.levelIndex, seed));
      }
      runFor(world, 150, targetFor, false, true);
    }
    if (world.status !== WORLD_CLEARED) return { screen: SCREEN_PLAY };
    return { screen: SCREEN_ROOM_CLEAR };
  }
  // cover, the default
  runFor(world, 14, (w) => nearestCoin(w) || w.level.diamond, false);
  if (world.alarm < 25) {
    // Warm the alarm the honest way: hold the thief at the edge of a cone
    // for a few real steps, where a guard can just see them.
    const guard = world.guards[0];
    world.thief.x = guard.x + Math.cos(guard.facing) * 200;
    world.thief.y = guard.y + Math.sin(guard.facing) * 200;
    runFor(world, 2.5, () => ({ x: world.thief.x, y: world.thief.y }), true);
  }
  return { screen: SCREEN_PLAY };
}
