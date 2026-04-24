/**
 * GREED ISLAND — Interference Manager
 * "Hisoka's interference triggers after 3 mismatches. Plan your flips in batches of 2." — Kurapika
 */

export class InterferenceManager {
  constructor(onInterference) {
    this.consecutiveMismatches = 0;
    this.TRIGGER_THRESHOLD = 3;
    this.onInterference = onInterference; // callback(cardIndex)
    this.interferenceHistory = [];
    this.totalInterferences = 0;
    this.nenCharge = 0; // 0–100 visual charge indicator
  }

  /**
   * Call after each flip result.
   * @param {boolean} wasMatch
   * @param {Array} revealedCards — currently revealed (matched) card indices
   * @returns {{ triggered: boolean, targetIndex: number|null, message: string }}
   */
  recordFlipResult(wasMatch, revealedCards) {
    if (wasMatch) {
      this.consecutiveMismatches = 0;
      this.nenCharge = Math.max(0, this.nenCharge - 20);
      return { triggered: false, targetIndex: null, message: null };
    }

    this.consecutiveMismatches++;
    this.nenCharge = Math.min(100, this.nenCharge + 35);

    if (this.consecutiveMismatches >= this.TRIGGER_THRESHOLD) {
      this.consecutiveMismatches = 0;
      this.nenCharge = 100;

      // Pick a random revealed (matched) card to flip back
      if (revealedCards.length === 0) {
        return {
          triggered: true,
          targetIndex: null,
          message: "Bungee Gum trembles... but finds nothing to distort.",
        };
      }

      const targetIndex = revealedCards[Math.floor(Math.random() * revealedCards.length)];
      this.interferenceHistory.push(targetIndex);
      this.totalInterferences++;

      setTimeout(() => {
        this.nenCharge = 60; // settle after trigger
      }, 1500);

      return {
        triggered: true,
        targetIndex,
        message: this._randomHisokaQuip(),
      };
    }

    return {
      triggered: false,
      targetIndex: null,
      message: this.consecutiveMismatches === 2
        ? "⚠ One more mismatch and Bungee Gum activates..."
        : null,
    };
  }

  /**
   * Reset after a successful match resets the streak.
   */
  reset() {
    this.consecutiveMismatches = 0;
  }

  getNenCharge() {
    return this.nenCharge;
  }

  getConsecutiveMismatches() {
    return this.consecutiveMismatches;
  }

  _randomHisokaQuip() {
    const quips = [
      "♦ Bungee Gum... has the properties of both rubber and gum. ♦",
      "♠ Did you forget? Memory is just a card that flips back. ♠",
      "♣ How delightful. You've given me reason to play. ♣",
      "♥ Forgetting is the most human of weaknesses. ♥",
      "♦ Your Nen is leaking. Let me help you lose it. ♦",
      "♠ The harder you try to remember, the more I enjoy erasing it. ♠",
    ];
    return quips[Math.floor(Math.random() * quips.length)];
  }
}
