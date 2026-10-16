import { CARDS, STARTER, REWARDS } from "./cards.js";
import { ENEMIES, intent } from "./enemies.js";
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
export function shuffle(a, rng = Math.random) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    let j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function log(s, msg) {
  s.log.push(msg);
  s.log = s.log.slice(-40);
}
export function damage(target, amount) {
  amount = Math.max(0, amount);
  const absorbed = Math.min(target.block, amount);
  target.block -= absorbed;
  const lost = Math.min(target.hp, amount - absorbed);
  target.hp -= lost;
  return lost;
}
export function draw(s, n, rng = Math.random) {
  for (let i = 0; i < n; i++) {
    if (!s.draw.length) {
      if (!s.discard.length) break;
      s.draw = shuffle(s.discard, rng);
      s.discard = [];
    }
    s.hand.push(s.draw.pop());
  }
}
export function poisonTick(target) {
  const lost = Math.min(target.hp, target.poison);
  target.hp -= lost;
  target.poison = Math.max(0, target.poison - 1);
  return lost;
}
export function outcome(s, rng = Math.random) {
  if (s.player.hp <= 0) {
    s.phase = "over";
    log(s, "力尽きた。また次の夜に。");
    return true;
  }
  if (s.enemy.hp <= 0) {
    if (s.stage === 4) {
      s.phase = "clear";
      log(s, "黒月を撃破。里に朝が来た。");
    } else {
      s.phase = "reward";
      s.player.hp = clamp(s.player.hp + 8, 0, 40);
      s.reward = shuffle(REWARDS, rng).slice(0, 3);
      log(s, "勝利！ HPを8回復。札を一枚選ぼう。");
    }
    return true;
  }
  return false;
}
export function startBattle(s, rng = Math.random) {
  const e = ENEMIES[s.stage];
  s.phase = "battle";
  s.player.block = 0;
  s.player.poison = 0;
  s.player.strength = 0;
  s.enemy = { hp: e.hp, maxHp: e.hp, block: 0, poison: 0, weak: 0, move: 0 };
  s.draw = shuffle(s.deck, rng);
  s.discard = [];
  s.hand = [];
  s.energy = 3;
  s.turn = 1;
  s.reward = [];
  log(s, `${e.name}「${e.quote}」`);
  draw(s, 5, rng);
  return s;
}
export function newGame(rng = Math.random) {
  return startBattle(
    {
      version: 1,
      phase: "battle",
      stage: 0,
      player: { hp: 40, block: 0, poison: 0, strength: 0 },
      deck: [...STARTER],
      log: [],
    },
    rng,
  );
}
export function play(s, index, rng = Math.random) {
  if (
    s.phase !== "battle" ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= s.hand.length
  )
    return false;
  const id = s.hand[index],
    c = CARDS[id];
  if (c.cost > s.energy) return false;
  s.energy -= c.cost;
  s.hand.splice(index, 1);
  log(s, `${c.name}を使用。`);
  for (const [effect, n] of c.effects) {
    if (effect === "attack") {
      const lost = damage(s.enemy, n + s.player.strength);
      log(s, `${lost}ダメージ。`);
    }
    if (effect === "block") s.player.block += n;
    if (effect === "heal") s.player.hp = clamp(s.player.hp + n, 0, 40);
    if (effect === "draw") draw(s, n, rng);
    if (effect === "energy") s.energy = clamp(s.energy + n, 0, 10);
    if (effect === "strength") s.player.strength += n;
    if (effect === "poison") s.enemy.poison += n;
    if (effect === "weak") s.enemy.weak += n;
    if (effect === "cleanse") s.player.poison = 0;
  }
  s.discard.push(id);
  outcome(s, rng);
  return true;
}
export function endTurn(s, rng = Math.random) {
  if (s.phase !== "battle") return;
  s.discard.push(...s.hand);
  s.hand = [];
  s.enemy.block = 0;
  let tick = poisonTick(s.enemy);
  if (tick) log(s, `敵に毒${tick}ダメージ。`);
  if (outcome(s, rng)) return;
  const m = intent(s);
  for (let i = 0; i < (m.hits || 1); i++) {
    if (m.attack) {
      let amount = s.enemy.weak ? Math.floor(m.attack * 0.75) : m.attack;
      log(s, `${m.name}：${damage(s.player, amount)}ダメージ。`);
    }
  }
  if (m.poison) {
    s.player.poison += m.poison;
    log(s, `自分に毒${m.poison}。`);
  }
  if (m.block) s.enemy.block += m.block;
  s.enemy.weak = Math.max(0, s.enemy.weak - 1);
  s.enemy.move++;
  if (outcome(s, rng)) return;
  s.player.block = 0;
  tick = poisonTick(s.player);
  if (tick) log(s, `自分に毒${tick}ダメージ。`);
  if (outcome(s, rng)) return;
  s.energy = 3;
  s.turn++;
  draw(s, 5, rng);
  log(s, `第${s.turn}ターン。`);
}
export function chooseReward(s, id, rng = Math.random) {
  if (s.phase !== "reward" || !s.reward.includes(id)) return false;
  s.deck.push(id);
  s.stage++;
  startBattle(s, rng);
  return true;
}
