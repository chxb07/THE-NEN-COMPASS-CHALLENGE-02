/**
 * CardGrid component — renders the 8×5 grid of cards.
 * Pure rendering logic; state managed by app.js.
 */

export class CardGrid {
  constructor(container, onCardClick) {
    this.container = container;
    this.onCardClick = onCardClick;
    this.cols = 8;
    this.rows = 5;
  }

  render(cards, probabilities, selectedIndex, hintIndex, nenDistorted) {
    this.container.innerHTML = '';

    cards.forEach((card, i) => {
      const el = document.createElement('div');
      el.className = 'card';
      el.dataset.index = i;

      if (card.matched) {
        el.classList.add('matched');
        el.innerHTML = `<div class="card-inner">
          <div class="card-front">${card.symbol}</div>
        </div>`;
      } else if (card.revealed) {
        el.classList.add('revealed');
        if (i === selectedIndex) el.classList.add('selected');
        el.innerHTML = `<div class="card-inner">
          <div class="card-front">${card.symbol}</div>
        </div>`;
      } else {
        // Face down — show probability overlay
        const prob = probabilities[i] ?? null;
        const probClass = prob === null ? '' : prob >= 70 ? 'prob-high' : prob >= 40 ? 'prob-mid' : 'prob-low';
        const isHint = i === hintIndex;
        const isDistorted = nenDistorted && nenDistorted.includes(i);

        if (isHint) el.classList.add('hint');
        if (isDistorted) el.classList.add('nen-distorted');

        el.innerHTML = `<div class="card-inner">
          <div class="card-back">
            <div class="card-back-pattern"></div>
            ${prob !== null ? `<div class="prob-overlay ${probClass}">${prob}<span>%</span></div>` : ''}
            ${isHint ? '<div class="hint-glow">★</div>' : ''}
          </div>
        </div>`;

        el.addEventListener('click', () => this.onCardClick(i));
      }

      this.container.appendChild(el);
    });
  }

  flashInterference(index) {
    const el = this.container.querySelector(`[data-index="${index}"]`);
    if (el) {
      el.classList.add('interference-flash');
      setTimeout(() => el.classList.remove('interference-flash'), 800);
    }
  }
}
