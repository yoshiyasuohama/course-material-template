import { meta } from './meta';

const KEY = meta.storageKey;

type Listener = () => void;

function load(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

let state = load();
const listeners = new Set<Listener>();

function commit(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 保存できない環境でも、開いている間は進捗を使える
  }
  listeners.forEach((listener) => listener());
}

export const store = {
  has(id: string): boolean {
    return Boolean(state[id]);
  },
  set(id: string, on: boolean): void {
    if (Boolean(state[id]) === on) return;
    if (on) state[id] = true;
    else delete state[id];
    commit();
  },
  clear(): void {
    state = {};
    commit();
  },
  subscribe(listener: Listener): void {
    listeners.add(listener);
  },
};

// 別のタブで進めた分も反映する
window.addEventListener('storage', (event) => {
  if (event.key !== KEY) return;
  state = load();
  listeners.forEach((listener) => listener());
});
