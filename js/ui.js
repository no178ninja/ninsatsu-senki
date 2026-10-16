import { CARDS } from "./cards.js";
import { ENEMIES, intent } from "./enemies.js";
import { newGame, play, endTurn, chooseReward } from "./engine.js";
import { load, save } from "./storage.js";
const app = document.querySelector("#app");
let state = null;
let saved = load();
let saveOk = true;
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function card(id, index, reward = false) {
  const c = CARDS[id];
  return `<button class="card ${c.type === "攻撃" ? "attack" : ""}" ${!reward && c.cost > state.energy ? "disabled" : ""} data-${reward ? "reward" : "card"}="${reward ? id : index}" aria-label="${c.name}、コスト${c.cost}、${c.text}"><span class="card-top"><span>${c.type}</span><b>${c.cost}</b></span><span class="card-mark" aria-hidden="true">${c.name.slice(0, 1)}</span><strong>${c.name}</strong><span class="card-text">${c.text}</span><i>${c.flavor}</i>${reward ? '<span class="pick">この札を選ぶ ＋</span>' : ""}</button>`;
}
function title() {
  saved = load();
  app.innerHTML = `<section class="title-screen"><div class="seal">一人用 忍術札合戦</div><p class="eyebrow">月下の五番勝負 / VER. 1.0</p><h1>闇を裂け。<br>その<span>一札</span>で。</h1><p class="intro">刀を抜く前に、札を引け。<br>五人の忍びが待つ夜を、あなただけの戦術で越える。</p><div class="title-actions">${saved ? '<button class="primary" data-action="resume">続きから忍ぶ →</button>' : ""}<button class="${saved ? "secondary" : "primary"}" data-action="new">${saved ? "新しく始める" : "いざ、出陣"} →</button></div><p class="fine">5 STAGES <span>／</span> 5–10 MIN <span>／</span> AUTO SAVE</p><div class="moon-art" aria-hidden="true"><div class="moon"></div><span>忍</span><div class="ridge"></div></div></section><section class="principles"><div><b>壱</b><p>敵の先を読む<small>次の一手は、すでに見えている。</small></p></div><div><b>弐</b><p>札を組み上げる<small>勝利のたび、戦術が育つ。</small></p></div><div><b>参</b><p>五つの夜を越える<small>最後に待つは、忍頭・黒月。</small></p></div></section>`;
}
function status(p, isEnemy = false) {
  return `${p.block ? `<span>防御 ${p.block}</span>` : ""}${p.poison ? `<span class="poison">毒 ${p.poison}</span>` : ""}${p.strength ? `<span>筋力 +${p.strength}</span>` : ""}${isEnemy && p.weak ? `<span>弱体 ${p.weak}</span>` : ""}`;
}
function render() {
  const s = state,
    e = ENEMIES[s.stage];
  saveOk = save(s);
  document.querySelector("#announce").textContent = s.log.at(-1) || "";
  if (s.phase === "clear" || s.phase === "over") {
    app.innerHTML = `<section class="ending"><p class="eyebrow">${s.phase === "clear" ? "ALL STAGES CLEARED" : "THE NIGHT CONTINUES"}</p><div class="ending-mark">${s.phase === "clear" ? "暁" : "影"}</div><h1>${s.phase === "clear" ? "夜明けは、あなたのもの。" : "忍びの夜は、まだ続く。"}</h1><p>${s.phase === "clear" ? "五人の忍びを倒し、里の平穏を取り戻した。黒月は棚卸しに戻った。" : `${s.stage + 1}戦目で力尽きた。次は敵の予告を見て、防御と回復を。`}</p><p>残りHP ${s.player.hp} ／ デッキ ${s.deck.length}枚</p><button class="primary" data-action="new">もう一度、出陣 →</button><button class="secondary" data-action="title">タイトルへ</button>${!saveOk ? '<p role="alert">保存できません。この画面を閉じると進行が失われます。</p>' : ""}</section>`;
    return;
  }
  if (s.phase === "reward") {
    app.innerHTML = `<section class="reward"><p class="eyebrow">VICTORY / 第${s.stage + 1}戦 突破</p><h1>次の一手を、選べ。</h1><p>HPを8回復しました。現在 ${s.player.hp} / 40<br>一枚をデッキに加え、次の戦いへ。</p><div class="reward-cards">${s.reward.map((id) => card(id, 0, true)).join("")}</div>${!saveOk ? '<p role="alert">保存できません。この画面を閉じないでください。</p>' : ""}<p class="fine">次の相手：${ENEMIES[s.stage + 1].name}</p></section>`;
    return;
  }
  const m = intent(s);
  const atk = s.enemy.weak ? Math.floor((m.attack || 0) * 0.75) : m.attack;
  app.innerHTML = `<section class="battle"><nav class="stage-nav" aria-label="進行状況">${ENEMIES.map((x, i) => `<span class="${i === s.stage ? "current" : i < s.stage ? "done" : ""}">${i < s.stage ? "✓" : String(i + 1).padStart(2, "0")}<small>${i === 4 ? "忍頭" : "第" + (i + 1) + "戦"}</small></span>`).join("")}</nav><div class="battle-caption"><span>第${s.stage + 1}戦 <b>／ ${e.name}</b></span><span>TURN ${s.turn}</span></div><div class="arena"><div class="enemy-portrait" aria-hidden="true"><span>${e.symbol}</span></div><div class="enemy-info"><p class="eyebrow">${s.stage === 4 ? "FINAL BOSS" : "ENEMY"}</p><h1>${e.name}</h1><p class="quote">「${e.quote}」</p><div class="hp-label"><span>体力</span><b>${s.enemy.hp} <small>/ ${e.hp}</small></b></div><meter min="0" max="${e.hp}" value="${s.enemy.hp}" aria-label="敵のHP">${s.enemy.hp}</meter><div class="statuses">${status(s.enemy, true)}</div><div class="intent"><span>次の行動</span><strong>${m.name}</strong><p>${m.attack ? `攻撃 ${atk}${m.hits ? " × " + m.hits : ""}` : ""}${m.block ? `防御 +${m.block}` : ""}${m.poison ? ` ／ 毒 +${m.poison}` : ""}</p></div></div></div><div class="player-panel"><div><span class="eyebrow">あなたの体力</span><strong>${s.player.hp}<small> / 40</small></strong><meter min="0" max="40" value="${s.player.hp}" aria-label="自分のHP"></meter></div><div class="energy"><span class="eyebrow">行動力</span><strong>${s.energy}<small> / 3</small></strong><span class="pips" aria-hidden="true">${"◆".repeat(Math.min(s.energy, 10))}</span></div><div class="statuses">${status(s.player)}</div><button class="primary end-turn" data-action="end">ターン終了 <span>→</span></button></div><div class="hand-heading"><h2>手札 <small>札をタップして使用</small></h2><span>山札 ${s.draw.length} ／ 捨て札 ${s.discard.length}</span></div><div class="hand">${s.hand.length ? s.hand.map((id, i) => card(id, i)).join("") : '<p class="empty-hand">手札はありません。ターンを終了してください。</p>'}</div><p class="save-status">${saveOk ? "● 自動保存済み" : "保存できません。この画面を閉じないでください。"} <button class="text-button" data-action="title">中断してタイトルへ</button></p><details class="battle-log" open><summary>戦況記録</summary><ol>${s.log
    .slice(-6)
    .map((x) => `<li>${escape(x)}</li>`)
    .join("")}</ol></details></section>`;
}
app.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "new") {
    if (
      saved &&
      state === null &&
      !confirm("保存中の冒険を上書きして始めますか？")
    )
      return;
    state = newGame();
    render();
  } else if (action === "resume") {
    state = load();
    if (state) render();
    else title();
  } else if (action === "title") {
    state = null;
    title();
  } else if (action === "end") {
    endTurn(state);
    render();
  } else if (button.dataset.card !== undefined) {
    if (play(state, Number(button.dataset.card))) render();
  } else if (button.dataset.reward) {
    chooseReward(state, button.dataset.reward);
    render();
  }
});
const rules = document.querySelector("#rules");
document.querySelector("#help").onclick = () => rules.showModal();
document.querySelector("#close-help").onclick = () => rules.close();
title();
