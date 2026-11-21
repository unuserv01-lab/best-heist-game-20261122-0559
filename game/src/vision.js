// Sight math, shared by guards and cameras: is a point inside a watcher's
// cone, and is the straight line to it blocked by a wall or a piece of
// cover? Cover blocks sight; velvet ropes and lamps do not.
function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Liang-Barsky clipping: walk the segment's parameter t from 0 to 1 and
  // keep the interval that stays inside the rect. Empty interval = miss.
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  const edges = [
    [-dx, x1 - rect.x],
    [dx, rect.x + rect.width - x1],
    [-dy, y1 - rect.y],
    [dy, rect.y + rect.height - y1],
  ];
  for (let i = 0; i < edges.length; i += 1) {
    const [p, q] = edges[i];
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > tMax) return false;
        if (t > tMin) tMin = t;
      } else {
        if (t < tMin) return false;
        if (t < tMax) tMax = t;
      }
    }
  }
  return true;
}

export function hasLineOfSight(x1, y1, x2, y2, blockers) {
  for (let i = 0; i < blockers.length; i += 1) {
    if (segmentHitsRect(x1, y1, x2, y2, blockers[i])) return false;
  }
  return true;
}

export function inCone(watcherX, watcherY, facing, halfAngle, length, x, y) {
  const dx = x - watcherX;
  const dy = y - watcherY;
  const distance = Math.hypot(dx, dy);
  if (distance > length) return { seen: false, distance };
  const angle = Math.atan2(dy, dx);
  let diff = angle - facing;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return { seen: Math.abs(diff) <= halfAngle, distance };
}
