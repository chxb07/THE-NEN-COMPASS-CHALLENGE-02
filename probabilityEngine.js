/**
 * GREED ISLAND — Probability Engine
 * "Probability is not destiny. The 93% card still fails 7% of the time." — Hisoka
 */

export class ProbabilityEngine {
  constructor(totalCards, symbols) {
    this.totalCards = totalCards;    // 40
    this.symbols = symbols;          // array of 20 symbol names
    this.symbolCounts = {};          // remaining unmatched count per symbol
    this.knownCards = {};            // index → symbol (cards we've seen)
    this.matchedSymbols = new Set(); // symbols already fully matched
    this.hisokaNenActive = false;    // distortion flag
    this.distortionBias = {};        // card-level distortion overrides

    // Initialize symbol counts (each appears twice)
    for (const sym of symbols) {
      this.symbolCounts[sym] = 2;
    }
  }

  /**
   * Register a revealed card (we now know its symbol).
   */
  revealCard(index, symbol) {
    this.knownCards[index] = symbol;
  }

  /**
   * Mark a pair as matched — remove from probability pool.
   */
  markMatched(symbol) {
    this.matchedSymbols.add(symbol);
    this.symbolCounts[symbol] = 0;
  }

  /**
   * Apply Hisoka's Nen distortion: randomly scramble some probabilities.
   * "Watch for sudden drops — that's his Bungee Gum stretching the truth." — Gon
   */
  applyNenDistortion(faceDownIndices) {
    this.hisokaNenActive = true;
    this.distortionBias = {};
    // Distort ~30% of face-down cards
    const toDistort = faceDownIndices
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.ceil(faceDownIndices.length * 0.3));

    for (const idx of toDistort) {
      // Random dramatic drop or spike
      const bias = Math.random() < 0.5
        ? -(20 + Math.random() * 30)   // drop
        :  (15 + Math.random() * 25);  // spike
      this.distortionBias[idx] = bias;
    }
  }

  clearNenDistortion() {
    this.hisokaNenActive = false;
    this.distortionBias = {};
  }

  /**
   * Calculate probability that card at `targetIndex` matches `selectedSymbol`.
   * @param {number} targetIndex      — the face-down card we're evaluating
   * @param {string} selectedSymbol   — symbol of the currently flipped card
   * @param {number} selectedIndex    — grid index of the currently flipped card
   * @param {Array}  allCards         — full 40-card array with {index, symbol, matched, revealed}
   * @param {Object} patternData      — output from patternDetector
   * @returns {number} 0–100
   */
  calculateProbability(targetIndex, selectedSymbol, selectedIndex, allCards, patternData) {
    // If we KNOW this card's symbol (we've seen it before), return exact result
    if (this.knownCards[targetIndex] !== undefined) {
      const known = this.knownCards[targetIndex];
      if (this.matchedSymbols.has(known)) return 0; // already matched
      return known === selectedSymbol ? 99 : 1;
    }

    // If the selected symbol is already matched, no card can be its pair
    if (this.matchedSymbols.has(selectedSymbol)) return 0;

    // Count remaining unknowns
    const unknownFaceDown = allCards.filter(c =>
      !c.matched && !c.revealed && c.index !== targetIndex && c.index !== selectedIndex
      && this.knownCards[c.index] === undefined
    ).length;

    if (unknownFaceDown <= 0) return 50; // fallback

    // Base probability: how many unmatched copies of this symbol remain?
    // One copy is the selected card itself. The pair could be anywhere in unknowns.
    const remainingPairs = this.symbolCounts[selectedSymbol] - 1; // other copy
    let prob = remainingPairs > 0 ? (1 / unknownFaceDown) * 100 : 0;

    // ── Positional adjacency bonus (20%) ──────────────────────────────────
    const adjBonus = patternData?.adjacencyBonus?.[targetIndex]?.[selectedIndex] ?? 0;
    prob += adjBonus * 20;

    // ── Symbol frequency modifier ─────────────────────────────────────────
    // Rarer symbols (fewer remaining) have lower base probability weight
    const totalUnmatchedSymbols = Object.values(this.symbolCounts)
      .filter(c => c > 0).length;
    const frequencyFactor = totalUnmatchedSymbols > 0
      ? 1 / totalUnmatchedSymbols
      : 1;
    prob = prob * (0.7 + 0.6 * frequencyFactor);

    // ── Pattern bonus from patternDetector ───────────────────────────────
    if (patternData?.sectorMatch?.[targetIndex] === patternData?.sectorMatch?.[selectedIndex]) {
      prob += 8;
    }

    // ── Hisoka Nen distortion ─────────────────────────────────────────────
    if (this.hisokaNenActive && this.distortionBias[targetIndex] !== undefined) {
      prob += this.distortionBias[targetIndex];
    }

    return Math.min(99, Math.max(1, Math.round(prob)));
  }

  /**
   * Get best hint card: the face-down card with highest probability for selected symbol.
   */
  getBestHint(selectedSymbol, selectedIndex, allCards, patternData) {
    let best = null;
    let bestProb = -1;

    for (const card of allCards) {
      if (card.matched || card.revealed || card.index === selectedIndex) continue;
      const p = this.calculateProbability(
        card.index, selectedSymbol, selectedIndex, allCards, patternData
      );
      if (p > bestProb) {
        bestProb = p;
        best = card.index;
      }
    }
    return best;
  }
}
