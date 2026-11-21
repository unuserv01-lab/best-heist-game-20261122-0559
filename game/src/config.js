// One place for every number the game tunes by: field size, speeds, sight
// ranges, tool costs and the colours of the vault at night. Nothing here
// knows about drawing or input; the other modules read these values.
export const FIELD = { width: 1280, height: 720 };
export const BEST_KEY = 'meridian-vault-best';
export const HUD_HEIGHT = 64;
export const ROOM = { x: 20, y: HUD_HEIGHT + 12, width: 1240, height: 600 };
export const STEP = 1 / 60;

export const THIEF = {
  radius: 13,
  speed: 215,
  sneakSpeed: 110,
  catchDistance: 26,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 72,
  chaseSpeed: 150,
  coneLength: 235,
  coneHalfAngle: 0.66, // radians, about 38 degrees each side
  suspectSeconds: 1.1, // seen this long before the guard turns suspicious
  chaseAlarm: 62, // alarm at which guards start to chase
};

export const CAMERA = {
  coneLength: 265,
  coneHalfAngle: 0.5,
  sweepSpeed: 0.55, // radians per second
  sweepRange: 0.9, // radians each side of its facing
};

export const ALARM = {
  guardPerSecond: 34, // alarm gained while a guard sees the thief
  cameraPerSecond: 26,
  closeBonus: 14, // extra per second when the watcher is very close
  decayPerSecond: 17, // alarm lost while nobody sees the thief
  lockdownAt: 100,
};

export const TOOLS = {
  coin: { cost: 1, key: '1', name: 'Coin toss', blurb: 'Ping a spot: guards walk over to look' },
  smoke: { cost: 2, key: '2', name: 'Smoke puff', blurb: '4 s unseen inside the cloud' },
  emp: { cost: 3, key: '3', name: 'EMP burst', blurb: 'Cameras blind for 6 s' },
};

export const SCORES = { goldCoin: 50, diamond: 500, roomClear: 200, timeBonusPerSecond: 5 };

export const COLOURS = {
  floorA: '#20264a',
  floorB: '#1a1f3e',
  wall: '#0d1026',
  brass: '#c9a227',
  brassDim: '#8a6d1f',
  velvet: '#7f1d2d',
  carpet: '#3d1530',
  cone: 'rgba(255, 190, 60, 0.20)',
  coneHot: 'rgba(255, 70, 60, 0.30)',
  coneEdge: 'rgba(255, 190, 60, 0.55)',
  thief: '#0f766e',
  thiefTrim: '#f5d76e',
  guard: '#b91c1c',
  camera: '#64748b',
  diamond: '#a5f3fc',
  gold: '#fbbf24',
  alarmLow: '#22c55e',
  alarmMid: '#f59e0b',
  alarmHigh: '#ef4444',
  text: '#f1f5f9',
  textDim: '#94a3b8',
  panel: '#111631',
};
