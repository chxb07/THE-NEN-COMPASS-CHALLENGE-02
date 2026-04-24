/**
 * ScorePanel — top HUD with score, timer, moves, pairs.
 */

export class ScorePanel {
  constructor(container) {
    this.container = container;
  }

  render({ score, timeLeft, moves, pairsFound, totalPairs, streak }) {
    const pct = (timeLeft / 60) * 100;
    const timerClass = timeLeft <= 10 ? 'timer-critical' : timeLeft <= 20 ? 'timer-warning' : '';
    const efficiency = moves > 0 ? Math.round((pairsFound / moves) * 100) : 0;

    this.container.innerHTML = `
      <div class="hud-row">
        <div class="hud-block">
          <div class="hud-label">SCORE</div>
          <div class="hud-value gold">${score}</div>
        </div>
        <div class="hud-block hud-center">
          <div class="hud-label ${timerClass}">TIME</div>
          <div class="hud-value ${timerClass}">${timeLeft}s</div>
          <div class="timer-bar">
            <div class="timer-fill ${timerClass}" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="hud-block">
          <div class="hud-label">PAIRS</div>
          <div class="hud-value">${pairsFound}<span class="hud-sub">/${totalPairs}</span></div>
        </div>
      </div>
      <div class="hud-row hud-row-2">
        <div class="hud-stat">MOVES: <b>${moves}</b></div>
        <div class="hud-stat">EFFICIENCY: <b>${efficiency}%</b></div>
        ${streak > 1 ? `<div class="hud-streak">🔥 ${streak}x STREAK</div>` : ''}
      </div>
    `;
  }

  showMessage(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `hud-message hud-message-${type}`;
    el.textContent = msg;
    this.container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}
