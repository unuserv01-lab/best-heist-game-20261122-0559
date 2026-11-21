// The world: one room's whole state and the one step that moves it. Input
// comes in, the thief moves, guards and cameras watch, the alarm climbs or
// falls, loot is lifted, and the room ends caught or cleared. Rendering and
// input never touch these numbers except through here.
import { ALARM, ROOM, SCORES, STEP } from './config.js';
import { createRandom } from './random.js';
import { blockingRects, LEVELS } from './levels.js';
import { createGuards, guardSeesThief, updateGuards } from './guards.js';
import { cameraSeesThief, createCameras, updateCameras } from './cameras.js';
import { createThief, moveThief, thiefCaught } from './thief.js';

export const WORLD_PLAYING = 'playing';
export const WORLD_CAUGHT = 'caught';
export const WORLD_CLEARED = 'cleared';

export function createWorld(levelIndex, seed) {
  const level = LEVELS[levelIndex];
  const random = createRandom(seed);
  return {
    levelIndex,
    level,
    random,
    thief: createThief(level),
    guards: createGuards(level, random),
    cameras: createCameras(level),
    coins: level.coins.map((coin) => ({ ...coin, taken: false })),
    diamondTaken: false,
    exitOpen: false,
    alarm: 0,
    score: 0,
    time: 0,
    now: 0,
    status: WORLD_PLAYING,
    caughtBy: null,
    clearBonus: 0,
    message: '',
    messageUntil: 0,
    pings: [],
    lastTickSecond: -1,
  };
}

function say(world, message, seconds = 2.5) {
  world.message = message;
  world.messageUntil = world.now + seconds;
}

export function stepWorld(world, input, dt, events) {
  if (world.status !== WORLD_PLAYING) return;
  world.now += dt;
  world.time += dt;
  const blockers = blockingRects(world.level);
  const thief = world.thief;

  moveThief(thief, input, blockers, dt);
  updateGuards(world.guards, thief, blockers, dt, world.now, world.alarm, events);
  updateCameras(world.cameras, world.now, dt);

  // Who sees the thief, and how fast does the alarm climb? Sneaking halves
  // the gain: slow and low is the fair trade for speed.
  const sneakFactor = thief.sneaking ? 0.5 : 1;
  let seenByGuard = null;
  let seenByCamera = null;
  for (let i = 0; i < world.guards.length; i += 1) {
    const sight = guardSeesThief(world.guards[i], thief, blockers, thief.smokeUntil, world.now);
    if (sight.seen) {
      seenByGuard = world.guards[i];
      world.alarm += (ALARM.guardPerSecond + (sight.distance < 110 ? ALARM.closeBonus : 0)) * sneakFactor * dt;
      break;
    }
  }
  if (seenByGuard === null) {
    for (let i = 0; i < world.cameras.length; i += 1) {
      const sight = cameraSeesThief(world.cameras[i], thief, blockers, world.now);
      if (sight.seen) {
        seenByCamera = world.cameras[i];
        world.alarm += (ALARM.cameraPerSecond + (sight.distance < 110 ? ALARM.closeBonus : 0)) * sneakFactor * dt;
        break;
      }
    }
  }
  if (seenByGuard === null && seenByCamera === null) {
    world.alarm = Math.max(0, world.alarm - ALARM.decayPerSecond * dt);
  }
  if (seenByGuard !== null && world.alarm > 0) {
    const second = Math.floor(world.alarm / 10);
    if (second !== world.lastTickSecond) {
      world.lastTickSecond = second;
      events.push({ type: 'alarm-tick' });
    }
  }

  // Gold coins pay for tools.
  for (let i = 0; i < world.coins.length; i += 1) {
    const coin = world.coins[i];
    if (!coin.taken && Math.hypot(coin.x - thief.x, coin.y - thief.y) < 26) {
      coin.taken = true;
      thief.coins += 1;
      thief.gold += 1;
      world.score += SCORES.goldCoin;
      events.push({ type: 'coin', x: coin.x, y: coin.y });
    }
  }

  // The diamond: lift it and the exit door opens.
  if (!world.diamondTaken && Math.hypot(world.level.diamond.x - thief.x, world.level.diamond.y - thief.y) < 34) {
    world.diamondTaken = true;
    world.exitOpen = true;
    world.score += SCORES.diamond;
    say(world, 'Diamond lifted! Reach the east door — the getaway is open.');
    events.push({ type: 'diamond' });
  }

  // The exit, once open, clears the room.
  if (world.exitOpen) {
    const exit = world.level.exit;
    if (thief.x > exit.x - 10 && thief.x < exit.x + exit.width + 10 && thief.y > exit.y - 10 && thief.y < exit.y + exit.height + 10) {
      world.status = WORLD_CLEARED;
      const timeBonus = Math.max(0, Math.round(120 - world.time) * SCORES.timeBonusPerSecond);
      world.clearBonus = SCORES.roomClear + timeBonus;
      world.score += world.clearBonus;
      events.push({ type: 'cleared', bonus: world.clearBonus });
      return;
    }
  }

  // Caught: a guard reaches the thief, or the alarm tops out while a guard
  // is close enough to grab. Both are shown, never sprung from nowhere.
  const catcher = thiefCaught(thief, world.guards);
  if (catcher !== null) {
    world.status = WORLD_CAUGHT;
    world.caughtBy = catcher.name;
    events.push({ type: 'caught', name: catcher.name });
    return;
  }
  if (world.alarm >= ALARM.lockdownAt) {
    let nearest = null;
    let nearestDist = Infinity;
    for (let i = 0; i < world.guards.length; i += 1) {
      const dist = Math.hypot(world.guards[i].x - thief.x, world.guards[i].y - thief.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = world.guards[i];
      }
    }
    if (nearest !== null && nearestDist < 200) {
      world.status = WORLD_CAUGHT;
      world.caughtBy = nearest.name;
      events.push({ type: 'caught', name: nearest.name });
    } else {
      world.alarm = ALARM.lockdownAt;
      say(world, 'LOCKDOWN — every guard is converging. Break line of sight!', 1.5);
    }
  }
}

export function stepSeconds() {
  return STEP;
}

export function roomRect() {
  return ROOM;
}
