import test from "node:test";
import assert from "node:assert/strict";
import { CARDS } from "../js/cards.js";
import {
  newGame,
  damage,
  draw,
  poisonTick,
  play,
  endTurn,
  outcome,
  chooseReward,
} from "../js/engine.js";
import { valid } from "../js/storage.js";
const rng = () => 0.42;
test("15 cards and starter deck", () => {
  const s = newGame(rng);
  assert.equal(Object.keys(CARDS).length, 15);
  assert.equal(s.deck.length, 10);
  assert.equal(s.hand.length, 5);
  assert.equal(s.energy, 3);
  assert.equal(s.player.hp, 40);
  assert.ok(valid(s));
});
test("damage consumes block, clamps HP and ignores negative damage", () => {
  let p = { hp: 10, block: 4 };
  assert.equal(damage(p, 7), 3);
  assert.deepEqual(p, { hp: 7, block: 0 });
  damage(p, -3);
  assert.equal(p.hp, 7);
  assert.equal(damage(p, 30), 7);
  assert.equal(p.hp, 0);
});
test("draw reshuffles discard and stops when empty", () => {
  const s = { draw: ["smoke"], discard: ["shuriken", "ration"], hand: [] };
  draw(s, 5, rng);
  assert.equal(s.hand.length, 3);
  assert.deepEqual(s.discard, []);
  assert.deepEqual(s.draw, []);
  assert.deepEqual([...s.hand].sort(), ["ration", "shuriken", "smoke"]);
});
test("poison bypasses block, decays and cannot make HP negative", () => {
  const p = { hp: 3, block: 20, poison: 5 };
  assert.equal(poisonTick(p), 3);
  assert.equal(p.hp, 0);
  assert.equal(p.block, 20);
  assert.equal(p.poison, 4);
});
test("cost, strength, multi-hit and exhausted energy", () => {
  const s = newGame(rng);
  s.hand = ["focus", "kunai", "slash"];
  play(s, 0, rng);
  assert.equal(s.player.strength, 2);
  play(s, 0, rng);
  assert.equal(s.enemy.hp, 16);
  assert.equal(s.energy, 1);
  assert.equal(play(s, 0, rng), false);
  assert.equal(s.hand.length, 1);
});
test("healing and energy caps, cleanse", () => {
  const s = newGame(rng);
  s.hand = ["ration", "spirit", "cleanse"];
  s.player.poison = 4;
  play(s, 0);
  assert.equal(s.player.hp, 40);
  s.energy = 10;
  play(s, 0);
  assert.equal(s.energy, 10);
  play(s, 0);
  assert.equal(s.player.poison, 0);
});
test("turn ordering: enemy poison kill prevents attack", () => {
  const s = newGame(rng);
  s.enemy.hp = 2;
  s.enemy.poison = 2;
  endTurn(s, rng);
  assert.equal(s.phase, "reward");
  assert.equal(s.player.hp, 40);
  assert.equal(s.enemy.move, 0);
});
test("block protects then resets; weak reduces enemy attack and decays", () => {
  const s = newGame(rng);
  s.player.block = 2;
  s.enemy.weak = 2;
  endTurn(s, rng);
  assert.equal(s.player.hp, 39);
  assert.equal(s.player.block, 0);
  assert.equal(s.enemy.weak, 1);
  assert.equal(s.hand.length, 5);
  assert.equal(s.energy, 3);
});
test("enemy poison applies before player turn and kills", () => {
  const s = newGame(rng);
  s.stage = 2;
  s.player.hp = 5;
  s.player.poison = 2;
  endTurn(s, rng);
  assert.equal(s.phase, "over");
  assert.equal(s.player.hp, 0);
});
test("victory heals, offers 3 unique cards, chosen card persists", () => {
  const s = newGame(rng);
  s.player.hp = 29;
  s.enemy.hp = 0;
  outcome(s);
  assert.equal(s.player.hp, 37);
  assert.equal(new Set(s.reward).size, 3);
  assert.equal(chooseReward(s, "invalid"), false);
  const id = s.reward[0];
  chooseReward(s, id, rng);
  assert.equal(s.stage, 1);
  assert.equal(s.deck.length, 11);
  assert.ok(s.deck.includes(id));
  assert.equal(s.player.poison, 0);
  assert.equal(s.player.strength, 0);
});
test("boss clear, death priority, and terminal input guard", () => {
  const s = newGame(rng);
  s.stage = 4;
  s.enemy.hp = 0;
  outcome(s);
  assert.equal(s.phase, "clear");
  const n = s.hand.length;
  assert.equal(play(s, 0), false);
  endTurn(s);
  assert.equal(s.hand.length, n);
  s.player.hp = 0;
  outcome(s);
  assert.equal(s.phase, "over");
});
test("save validation rejects bad versions and malformed cards", () => {
  assert.equal(valid(null), false);
  const s = newGame(rng);
  s.hand.push("unknown");
  assert.equal(valid(s), false);
});
test("card conservation across a long battle", () => {
  const s = newGame(rng);
  s.enemy.hp = 999;
  s.enemy.maxHp = 999;
  s.player.hp = 40;
  for (let t = 0; t < 8; t++) {
    s.player.hp = 40;
    s.player.block = 100;
    while (s.hand.some((id) => CARDS[id].cost <= s.energy)) {
      const i = s.hand.findIndex((id) => CARDS[id].cost <= s.energy);
      play(s, i, rng);
    }
    endTurn(s, rng);
    assert.equal(
      s.hand.length + s.draw.length + s.discard.length,
      s.deck.length,
    );
  }
});
test("five-stage functional run using normal actions", () => {
  const s = newGame(rng);
  let turns = 0;
  while (s.phase !== "clear" && s.phase !== "over" && turns < 150) {
    if (s.phase === "reward") {
      chooseReward(
        s,
        s.reward.find((id) => id === "storm" || id === "slash") || s.reward[0],
        rng,
      );
      continue;
    }
    let i;
    while (
      (i = s.hand.findIndex((id) => CARDS[id].cost <= s.energy)) >= 0 &&
      s.phase === "battle"
    )
      play(s, i, rng);
    if (s.phase === "battle") {
      endTurn(s, rng);
      turns++;
    }
  }
  assert.equal(s.phase, "clear");
  assert.equal(s.stage, 4);
  assert.ok(turns < 150);
});

test("a resolving draw card cannot draw itself from discard", () => {
  const s = newGame(rng);
  s.hand = ["scroll"];
  s.draw = [];
  s.discard = ["smoke"];
  play(s, 0, rng);
  assert.deepEqual(s.hand, ["smoke"]);
  assert.deepEqual(s.discard, ["scroll"]);
});
test("enemy block persists through player actions and expires on its turn", () => {
  const s = newGame(rng);
  s.enemy.block = 8;
  s.hand = ["shuriken"];
  play(s, 0, rng);
  assert.equal(s.enemy.hp, 28);
  assert.equal(s.enemy.block, 2);
  endTurn(s, rng);
  assert.equal(s.enemy.block, 0);
});
test("save/load roundtrip and denied storage are handled", async () => {
  const { save, load } = await import("../js/storage.js");
  const previous = globalThis.localStorage;
  let value = null;
  try {
    globalThis.localStorage = {
      setItem: (key, v) => {
        value = v;
      },
      getItem: () => value,
    };
    const s = newGame(rng);
    play(s, 0, rng);
    assert.equal(save(s), true);
    assert.deepEqual(load(), s);
    value = "bad JSON";
    assert.equal(load(), null);
    globalThis.localStorage = {
      setItem: () => {
        throw Error("denied");
      },
      getItem: () => {
        throw Error("denied");
      },
    };
    assert.equal(save(s), false);
    assert.equal(load(), null);
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
});
