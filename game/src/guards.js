// The guards: patrols that walk their waypoints, turn suspicious when they
// glimpse the thief, and chase once the alarm is high. A guard never sees
// through cover, and a guard that loses the thief walks back to its patrol.
import { GUARD } from './config.js';
import { hasLineOfSight, inCone } from './vision.js';
import { slideCircle } from './levels.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_CHASE = 'chase';
export const GUARD_INVESTIGATE = 'investigate';

export function createGuards(level, random) {
  return level.guards.map((spec, index) => {
    const start = spec.waypoints[0];
    return {
      name: spec.name,
      x: start.x,
      y: start.y,
      facing: random.range(0, Math.PI * 2),
      waypointIndex: 1 % spec.waypoints.length,
      waypoints: spec.waypoints,
      state: GUARD_PATROL,
      seenTime: 0,
      investigate: null,
      investigateTime: 0,
      speedScale: level.guardSpeed,
      wobble: index * 1.7,
    };
  });
}

function moveToward(guard, targetX, targetY, speed, dt, blockers) {
  const dx = targetX - guard.x;
  const dy = targetY - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  const next = slideCircle(blockers, guard.x + (dx / dist) * step, guard.y + (dy / dist) * step, GUARD.radius);
  guard.x = next.x;
  guard.y = next.y;
  guard.facing = Math.atan2(dy, dx);
  return dist - step < 2;
}

// Does this guard see the thief right now? Smoke and darkness (sneak in
// cover) do not hide the thief; only the smoke cloud and line of sight do.
export function guardSeesThief(guard, thief, blockers, smokeUntil, now) {
  if (now < smokeUntil) return { seen: false, distance: Infinity };
  const cone = inCone(guard.x, guard.y, guard.facing, GUARD.coneHalfAngle, GUARD.coneLength, thief.x, thief.y);
  if (!cone.seen) return { seen: false, distance: cone.distance };
  if (!hasLineOfSight(guard.x, guard.y, thief.x, thief.y, blockers)) return { seen: false, distance: cone.distance };
  return { seen: true, distance: cone.distance };
}

export function updateGuards(guards, thief, blockers, dt, now, alarm, events) {
  for (let i = 0; i < guards.length; i += 1) {
    const guard = guards[i];
    const sight = guardSeesThief(guard, thief, blockers, thief.smokeUntil, now);
    if (sight.seen) {
      guard.seenTime += dt;
      if (guard.state === GUARD_PATROL && guard.seenTime > GUARD.suspectSeconds) {
        guard.state = GUARD_SUSPICIOUS;
        events.push({ type: 'spotted', name: guard.name });
      }
    } else {
      guard.seenTime = Math.max(0, guard.seenTime - dt * 2);
      if (guard.state === GUARD_SUSPICIOUS && guard.seenTime <= 0) guard.state = GUARD_PATROL;
    }

    if (alarm >= GUARD.chaseAlarm && sight.seen) guard.state = GUARD_CHASE;
    if (guard.state === GUARD_CHASE && !sight.seen && alarm < GUARD.chaseAlarm) guard.state = GUARD_PATROL;

    if (guard.state === GUARD_CHASE) {
      moveToward(guard, thief.x, thief.y, GUARD.chaseSpeed * guard.speedScale, dt, blockers);
    } else if (guard.state === GUARD_INVESTIGATE && guard.investigate) {
      const arrived = moveToward(guard, guard.investigate.x, guard.investigate.y, GUARD.patrolSpeed * 1.4 * guard.speedScale, dt, blockers);
      guard.investigateTime -= dt;
      if (arrived || guard.investigateTime <= 0) {
        guard.state = GUARD_PATROL;
        guard.investigate = null;
      }
    } else if (guard.state === GUARD_SUSPICIOUS) {
      // Stand and stare at the last seen spot: the cone sweeps, the thief
      // gets a fair second to break line of sight.
      guard.facing += Math.sin(now * 2 + guard.wobble) * dt * 0.8;
    } else {
      const target = guard.waypoints[guard.waypointIndex];
      const arrived = moveToward(guard, target.x, target.y, GUARD.patrolSpeed * guard.speedScale, dt, blockers);
      if (arrived) guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    }
  }
}

// A coin toss sends every guard near the ping to go and look at it.
export function distractGuards(guards, x, y) {
  for (let i = 0; i < guards.length; i += 1) {
    const guard = guards[i];
    if (guard.state === GUARD_CHASE) continue;
    if (Math.hypot(guard.x - x, guard.y - y) < 260) {
      guard.state = GUARD_INVESTIGATE;
      guard.investigate = { x, y };
      guard.investigateTime = 3;
    }
  }
}
