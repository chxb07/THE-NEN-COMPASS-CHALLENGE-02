/**
 * GREED ISLAND — Card Matcher
 * Main game controller — orchestrates all modules.
 */

import { ProbabilityEngine } from './probabilityEngine.js';
import { PatternDetector }   from './patternDetector.js';
import { InterferenceManager } from './interferenceManager.js';
import { CardGrid }           from './CardGrid.js';
import { ProbabilityOverlay } from './ProbabilityOverlay.js';
import { ScorePanel }         from './ScorePanel.js';

// ─── Symbols (20 unique HxH-themed icons) ────────────────────────────────────
const SYMBOLS = [
  '🃏','⚔️','💎','🦋','🔮','🌸','⚡','🐉','🗡️','🌙',
  '🔥','💀','🏹','🌀','👁️','🦅','⚗️','🌊','🏔️','🎭'
];

const COLS = 8, ROWS = 5, TOTAL = 40, TOTAL_PAIRS = 20, TIME_LIMIT = 60;

// ─── Game State ───────────────────────────────────────────────────────────────
let state = {};

function initState() {
  const detector = new PatternDetector(COLS, ROWS);
  const board = detector.generatePatternedBoard(SYMBOLS);
  const patternData = detector.buildPatternData();

  const cards = board.map((symbol, index) => ({
    index, symbol, matched: false, revealed: false,
  }));

  const engine = new ProbabilityEngine(TOTAL, SYMBOLS);
  const interference = new InterferenceManager();

  state = {
    cards,
    board,
    patternData,
    detector,
    engine,
    interference,
    selected: null,          // index of first-flipped card (or null)
    locked: false,           // prevent clicks during animation
    score: 0,
    moves: 0,
    pairsFound: 0,
    streak: 0,
    timeLeft: TIME_LIMIT,
    timerInterval: null,
    probabilities: {},       // index → %
    hintIndex: null,
    hintActive: false,
    nenDistorted: [],        // indices currently distortion-flagged
    matchHistory: [],        // [[a,b], ...]
    message: null,
    gameOver: false,
    won: false,
    patternDiscovered: false,
  };
}

// ─── DOM refs ─────────────────────────────────────────────────────────────────
let gridComponent, overlayComponent, scoreComponent;

function boot() {
  const gridEl    = document.getElementById('card-grid');
  const overlayEl = document.getElementById('prob-overlay');
  const scoreEl   = document.getElementById('score-panel');
  const hintBtn   = document.getElementById('hint-btn');
  const startBtn  = document.getElementById('start-btn');
  const restartBtn= document.getElementById('restart-btn');

  gridComponent    = new CardGrid(gridEl, handleCardClick);
  overlayComponent = new ProbabilityOverlay(overlayEl);
  scoreComponent   = new ScorePanel(scoreEl);

  hintBtn?.addEventListener('click', activateHint);
  startBtn?.addEventListener('click', startGame);
  restartBtn?.addEventListener('click', restartGame);

  showSplash();
}

function showSplash() {
  document.getElementById('splash').style.display = 'flex';
  document.getElementById('game-area').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'none';
}

function startGame() {
  document.getElementById('splash').style.display = 'none';
  document.getElementById('game-area').style.display = 'flex';
  document.getElementById('gameover-screen').style.display = 'none';

  initState();
  startTimer();
  render();
}

function restartGame() {
  clearInterval(state.timerInterval);
  startGame();
}

// ─── Timer ────────────────────────────────────────────────────────────────────
function startTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      endGame(false, 'Time expired. How disappointing.');
    }
    render();
  }, 1000);
}

// ─── Card Click ───────────────────────────────────────────────────────────────
function handleCardClick(index) {
  if (state.locked || state.gameOver) return;
  const card = state.cards[index];
  if (card.matched || card.revealed) return;

  state.moves++;
  card.revealed = true;
  state.engine.revealCard(index, card.symbol);

  if (state.selected === null) {
    // First flip
    state.selected = index;
    updateProbabilities();
    render();
  } else {
    // Second flip
    const firstIndex = state.selected;
    const firstCard  = state.cards[firstIndex];
    state.selected = null;
    state.locked = true;

    render();

    setTimeout(() => {
      if (firstCard.symbol === card.symbol) {
        handleMatch(firstIndex, index);
      } else {
        handleMismatch(firstIndex, index);
      }
    }, 700);
  }
}

function handleMatch(a, b) {
  state.cards[a].matched = true;
  state.cards[b].matched = true;
  state.cards[a].revealed = false;
  state.cards[b].revealed = false;
  state.engine.markMatched(state.cards[a].symbol);

  state.score += 10;
  state.pairsFound++;
  state.streak++;
  if (state.streak > 1) state.score += (state.streak - 1) * 2; // streak bonus

  state.matchHistory.push([a, b]);

  const interference = state.interference.recordFlipResult(true, []);
  state.probabilities = {};
  state.hintIndex = null;

  // Check pattern discovery
  if (!state.patternDiscovered) {
    const discovered = state.detector.detectPatternDiscovery(
      state.matchHistory,
      state.patternData.sectorMatch,
      5
    );
    if (discovered) {
      state.patternDiscovered = true;
      state.score += 50;
      showFloatingMessage('🔍 PATTERN DISCOVERED! +50 Bonus!', 'gold');
    }
  }

  state.locked = false;

  if (state.pairsFound === TOTAL_PAIRS) {
    clearInterval(state.timerInterval);
    const perfectBonus = state.moves === TOTAL_PAIRS * 2 ? 100 : 0;
    state.score += perfectBonus + state.timeLeft * 2;
    endGame(true);
    return;
  }

  render();
}

function handleMismatch(a, b) {
  state.cards[a].revealed = false;
  state.cards[b].revealed = false;
  state.streak = 0;

  const matchedIndices = state.cards
    .filter(c => c.matched)
    .map(c => c.index);

  const result = state.interference.recordFlipResult(false, matchedIndices);

  if (result.triggered && result.targetIndex !== null) {
    // Hisoka interference: flip a matched card back!
    const victim = state.cards[result.targetIndex];
    victim.matched = false;
    victim.revealed = false;
    state.engine.matchedSymbols.delete(victim.symbol);
    state.engine.symbolCounts[victim.symbol] = 2;
    state.pairsFound--;
    state.score = Math.max(0, state.score - 5);

    // Apply Nen distortion to probabilities
    const faceDownIndices = state.cards
      .filter(c => !c.matched && !c.revealed)
      .map(c => c.index);
    state.engine.applyNenDistortion(faceDownIndices);
    state.nenDistorted = faceDownIndices.slice(0, Math.ceil(faceDownIndices.length * 0.3));

    showFloatingMessage(result.message || '♦ Bungee Gum activates! ♦', 'hisoka');
    gridComponent.flashInterference(result.targetIndex);

    setTimeout(() => {
      state.engine.clearNenDistortion();
      state.nenDistorted = [];
      render();
    }, 2500);
  } else if (result.message) {
    showFloatingMessage(result.message, 'warning');
  }

  state.probabilities = {};
  state.hintIndex = null;
  state.locked = false;
  render();
}

// ─── Probability update ───────────────────────────────────────────────────────
function updateProbabilities() {
  if (state.selected === null) {
    state.probabilities = {};
    return;
  }
  const selectedCard = state.cards[state.selected];
  const probs = {};
  for (const card of state.cards) {
    if (!card.matched && !card.revealed && card.index !== state.selected) {
      probs[card.index] = state.engine.calculateProbability(
        card.index,
        selectedCard.symbol,
        state.selected,
        state.cards,
        state.patternData
      );
    }
  }
  state.probabilities = probs;
}

// ─── Hint ─────────────────────────────────────────────────────────────────────
function activateHint() {
  if (state.selected === null || state.gameOver) return;
  const selectedCard = state.cards[state.selected];
  const best = state.engine.getBestHint(
    selectedCard.symbol,
    state.selected,
    state.cards,
    state.patternData
  );
  state.hintIndex = best;
  state.score = Math.max(0, state.score - 3); // hint costs 3 points
  render();
}

// ─── Game Over ────────────────────────────────────────────────────────────────
function endGame(won, reason = '') {
  clearInterval(state.timerInterval);
  state.gameOver = true;
  state.won = won;

  setTimeout(() => {
    document.getElementById('game-area').style.display = 'none';
    const go = document.getElementById('gameover-screen');
    go.style.display = 'flex';
    go.querySelector('#go-title').textContent = won
      ? '★ CHALLENGE COMPLETE ★'
      : '✕ CHALLENGE FAILED ✕';
    go.querySelector('#go-reason').textContent = reason || (won
      ? `All ${TOTAL_PAIRS} pairs matched. Hisoka is... impressed.`
      : 'You were too slow. How boring.');
    go.querySelector('#go-score').textContent = `Score: ${state.score}`;
    go.querySelector('#go-moves').textContent = `Moves: ${state.moves}`;
    go.querySelector('#go-pairs').textContent = `Pairs: ${state.pairsFound}/${TOTAL_PAIRS}`;
    go.querySelector('#go-efficiency').textContent =
      `Efficiency: ${state.moves > 0 ? Math.round((state.pairsFound / state.moves) * 100) : 0}%`;
    go.querySelector('#go-pattern').textContent = state.patternDiscovered
      ? '🔍 Hidden Pattern Discovered!' : '';
  }, 400);
}

// ─── Render ───────────────────────────────────────────────────────────────────
function render() {
  gridComponent.render(
    state.cards,
    state.probabilities,
    state.selected,
    state.hintIndex,
    state.nenDistorted
  );

  overlayComponent.render(
    state.interference.getNenCharge(),
    state.interference.getConsecutiveMismatches(),
    state.nenDistorted.length > 0
  );

  scoreComponent.render({
    score: state.score,
    timeLeft: state.timeLeft,
    moves: state.moves,
    pairsFound: state.pairsFound,
    totalPairs: TOTAL_PAIRS,
    streak: state.streak,
  });
}

// ─── Floating message ─────────────────────────────────────────────────────────
function showFloatingMessage(text, type = 'info') {
  const el = document.createElement('div');
  el.className = `floating-msg floating-msg-${type}`;
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', boot);
