import { CARDS } from "./cards.js";
const KEY = "ninsatsu-senki-v1";
const finite = (n) => Number.isFinite(n) && n >= 0;
export function valid(s) {
  if (
    !s ||
    s.version !== 1 ||
    !["battle", "reward", "clear", "over"].includes(s.phase) ||
    !Number.isInteger(s.stage) ||
    s.stage < 0 ||
    s.stage > 4
  )
    return false;
  for (const key of ["deck", "hand", "draw", "discard", "reward"])
    if (
      !Array.isArray(s[key]) ||
      s[key].length > 200 ||
      !s[key].every((id) => Object.hasOwn(CARDS, id))
    )
      return false;
  if (
    s.deck.length < 10 ||
    s.deck.length > 14 ||
    !Array.isArray(s.log) ||
    !s.log.every((x) => typeof x === "string") ||
    !Number.isInteger(s.turn) ||
    s.turn < 1 ||
    !finite(s.energy) ||
    s.energy > 10
  )
    return false;
  for (const [who, keys] of [
    ["player", ["hp", "block", "poison", "strength"]],
    ["enemy", ["hp", "maxHp", "block", "poison", "weak", "move"]],
  ]) {
    if (!s[who] || !keys.every((k) => finite(s[who][k]))) return false;
  }
  return s.player.hp <= 40 && s.enemy.hp <= s.enemy.maxHp;
}
export function save(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
export function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return valid(s) ? s : null;
  } catch {
    return null;
  }
}
