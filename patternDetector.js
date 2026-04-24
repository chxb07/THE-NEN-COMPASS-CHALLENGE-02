/**
 * GREED ISLAND — Pattern Detector
 * "The symbols aren't random. There's a hidden pattern in their arrangement.
 *  Find it, and probability becomes certainty." — Anonymous
 *
 * The hidden pattern: symbols are placed with a mirrored diagonal bias.
 * Cards in the same diagonal quadrant are more likely to share symbols.
 * Adjacent cards (Manhattan distance ≤ 1) get the 20% adjacency bonus.
 */

export class PatternDetector {
  constructor(cols = 8, rows = 5) {
    this.cols = cols;
    this.rows = rows;
    this.total = cols * rows; // 40
  }

  /**
   * Returns {row, col} for a flat index.
   */
  indexToPos(index) {
    return {
      row: Math.floor(index / this.cols),
      col: index % this.cols,
    };
  }

  /**
   * Manhattan distance between two card indices.
   */
  manhattanDistance(a, b) {
    const pa = this.indexToPos(a);
    const pb = this.indexToPos(b);
    return Math.abs(pa.row - pb.row) + Math.abs(pa.col - pb.col);
  }

  /**
   * Build adjacency bonus map.
   * adjacencyBonus[target][selected] = 0 or 1 (multiplied by 0.2 in engine)
   */
  buildAdjacencyBonus() {
    const bonus = {};
    for (let i = 0; i < this.total; i++) {
      bonus[i] = {};
      for (let j = 0; j < this.total; j++) {
        bonus[i][j] = this.manhattanDistance(i, j) === 1 ? 1 : 0;
      }
    }
    return bonus;
  }

  /**
   * Assign each card to a sector (quadrant-based).
   * Sector 0: top-left, 1: top-right, 2: bottom-left, 3: bottom-right
   */
  buildSectorMap() {
    const sectors = {};
    const midCol = this.cols / 2;
    const midRow = this.rows / 2;
    for (let i = 0; i < this.total; i++) {
      const { row, col } = this.indexToPos(i);
      const colHalf = col < midCol ? 0 : 1;
      const rowHalf = row < midRow ? 0 : 1;
      sectors[i] = rowHalf * 2 + colHalf;
    }
    return sectors;
  }

  /**
   * Generate the "hidden pattern" board layout.
   *
   * The hidden rule: each symbol pair is placed so that one card is in sector S
   * and its pair is in the MIRROR sector (0↔3, 1↔2).
   * This means diagonal-opposite cards are always pairs.
   *
   * Returns an array of 40 symbols (indices = card positions).
   */
  generatePatternedBoard(symbols) {
    // symbols: array of 20 unique symbol names
    const board = new Array(this.total).fill(null);
    const mirrorSector = { 0: 3, 1: 2, 2: 1, 3: 0 };
    const sectorMap = this.buildSectorMap();

    // Group indices by sector
    const sectorIndices = { 0: [], 1: [], 2: [], 3: [] };
    for (let i = 0; i < this.total; i++) {
      sectorIndices[sectorMap[i]].push(i);
    }

    // Shuffle within each sector
    for (const s of [0, 1, 2, 3]) {
      sectorIndices[s] = shuffle([...sectorIndices[s]]);
    }

    // Place pairs: symbol[k] → one slot in sector 0, mirror in sector 3
    //              symbol[k+10] → one slot in sector 1, mirror in sector 2
    const shuffledSymbols = shuffle([...symbols]);

    for (let k = 0; k < 10; k++) {
      const sym = shuffledSymbols[k];
      const idxA = sectorIndices[0].pop();
      const idxB = sectorIndices[3].pop();
      board[idxA] = sym;
      board[idxB] = sym;
    }
    for (let k = 10; k < 20; k++) {
      const sym = shuffledSymbols[k];
      const idxA = sectorIndices[1].pop();
      const idxB = sectorIndices[2].pop();
      board[idxA] = sym;
      board[idxB] = sym;
    }

    return board;
  }

  /**
   * Full pattern data object used by the probability engine.
   */
  buildPatternData() {
    return {
      adjacencyBonus: this.buildAdjacencyBonus(),
      sectorMatch: this.buildSectorMap(),
    };
  }

  /**
   * Detect if user has discovered the hidden pattern.
   * Returns true if the last N matches all followed the mirror-sector rule.
   */
  detectPatternDiscovery(matchHistory, sectorMap, threshold = 5) {
    if (matchHistory.length < threshold) return false;
    const recent = matchHistory.slice(-threshold);
    const mirrorSector = { 0: 3, 1: 2, 2: 1, 3: 0 };
    return recent.every(([a, b]) => sectorMap[a] === mirrorSector[sectorMap[b]]);
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
