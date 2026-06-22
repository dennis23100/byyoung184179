const STORAGE_PREFIX = 'portfolio-lottery-demo';

export const DEMO_GROUPS = {
  demo_a: {
    label: 'Demo Group A',
    description: 'Sanitized participant list for public portfolio review.',
    participants: [
      { zone: 'A 區', name: '林安妮' },
      { zone: 'A 區', name: '王小明' },
      { zone: 'A 區', name: '陳佳蓉' },
      { zone: 'B 區', name: '張志豪' },
      { zone: 'B 區', name: '黃雅婷' },
      { zone: 'C 區', name: '劉家銘' },
      { zone: 'C 區', name: '吳品妤' },
      { zone: 'D 區', name: '蔡承恩' }
    ]
  },
  demo_b: {
    label: 'Demo Group B',
    description: 'Second fake pool used to demonstrate list switching.',
    participants: [
      { zone: '1F', name: 'Demo Alice' },
      { zone: '1F', name: 'Demo Brian' },
      { zone: '2F', name: 'Demo Cindy' },
      { zone: '2F', name: 'Demo David' },
      { zone: '3F', name: 'Demo Emma' },
      { zone: '3F', name: 'Demo Frank' },
      { zone: '4F', name: 'Demo Grace' },
      { zone: '4F', name: 'Demo Henry' }
    ]
  },
  demo_c: {
    label: 'Demo Group C',
    description: 'Small fake group for edge-case testing.',
    participants: [
      { zone: 'VIP', name: 'Sample Iris' },
      { zone: 'VIP', name: 'Sample Jack' },
      { zone: 'Guest', name: 'Sample Kelly' },
      { zone: 'Guest', name: 'Sample Leo' },
      { zone: 'Staff', name: 'Sample Mia' },
      { zone: 'Staff', name: 'Sample Noah' }
    ]
  }
};

const DEFAULT_WINNERS = [
  { id: 'seed-1', zone: 'A 區', name: '林安妮', prize: 'Demo 幸運獎', timestamp: 1782061200000, isClaimed: false },
  { id: 'seed-2', zone: 'B 區', name: '黃雅婷', prize: 'Demo 幸運獎', timestamp: 1782061201200, isClaimed: true },
  { id: 'seed-3', zone: 'C 區', name: '劉家銘', prize: 'Demo 加碼獎', timestamp: 1782061500000, isClaimed: false }
];

export function getRoomID() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('room') || 'demo';
}

export function getStorageKey(roomID = getRoomID()) {
  return `${STORAGE_PREFIX}:${roomID}:winners`;
}

export function getParticipants(groupKey = 'demo_a') {
  const group = DEMO_GROUPS[groupKey] || DEMO_GROUPS.demo_a;
  return group.participants.map((person, index) => ({ id: index, ...person }));
}

export function getWinners(roomID = getRoomID()) {
  const key = getStorageKey(roomID);
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    const seeded = DEFAULT_WINNERS.map((winner) => ({ ...winner }));
    window.localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Invalid demo winners state. Resetting local demo data.', error);
    window.localStorage.removeItem(key);
    return [];
  }
}

export function setWinners(roomID, winners) {
  const key = getStorageKey(roomID);
  window.localStorage.setItem(key, JSON.stringify(winners));
  window.dispatchEvent(new CustomEvent('demo-winners-updated', { detail: { roomID } }));
}

export function addWinners(roomID, winners) {
  const timestamp = Date.now();
  const current = getWinners(roomID);
  const nextWinners = winners.map((winner, index) => ({
    id: `${timestamp}-${index}-${Math.random().toString(16).slice(2)}`,
    zone: winner.zone,
    name: winner.name,
    prize: winner.prize,
    timestamp,
    isClaimed: false
  }));
  setWinners(roomID, [...current, ...nextWinners]);
  return nextWinners;
}

export function resetDemoWinners(roomID = getRoomID()) {
  setWinners(roomID, []);
}

export function listenWinners(roomID, callback) {
  callback(getWinners(roomID));

  const onStorage = (event) => {
    if (event.key === getStorageKey(roomID)) callback(getWinners(roomID));
  };
  const onCustom = (event) => {
    if (!event.detail || event.detail.roomID === roomID) callback(getWinners(roomID));
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener('demo-winners-updated', onCustom);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('demo-winners-updated', onCustom);
  };
}

export function groupWinnersByBatch(winners, newestFirst = false) {
  const sorted = [...winners].sort((a, b) => newestFirst ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);
  const batches = [];

  sorted.forEach((winner) => {
    const latestBatch = batches[batches.length - 1];
    if (!latestBatch || Math.abs(winner.timestamp - latestBatch[latestBatch.length - 1].timestamp) > 3000) {
      batches.push([winner]);
    } else {
      latestBatch.push(winner);
    }
  });

  return batches;
}

export function getPublicCheckUrl(roomID = getRoomID()) {
  const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
  return `${baseUrl}check.html?room=${encodeURIComponent(roomID)}`;
}
