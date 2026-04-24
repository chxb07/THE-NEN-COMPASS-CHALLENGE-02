/**
 * ProbabilityOverlay — renders the Nen charge bar and probability legend.
 */

export class ProbabilityOverlay {
  constructor(container) {
    this.container = container;
  }

  render(nenCharge, consecutiveMismatches, distortionActive) {
    const bars = Math.round(nenCharge / 10);
    const barHTML = Array.from({ length: 10 }, (_, i) =>
      `<div class="nen-bar ${i < bars ? 'filled' : ''} ${nenCharge >= 90 ? 'danger' : nenCharge >= 60 ? 'warning' : ''}"></div>`
    ).join('');

    this.container.innerHTML = `
      <div class="nen-panel">
        <div class="nen-label">
          <span class="nen-title">BUNGEE GUM</span>
          <span class="nen-charge-val">${Math.round(nenCharge)}%</span>
        </div>
        <div class="nen-bars">${barHTML}</div>
        <div class="mismatch-pips">
          ${[0,1,2].map(i =>
            `<div class="pip ${i < consecutiveMismatches ? 'active' : ''} ${consecutiveMismatches === 2 && i === 2 ? 'warning-pip' : ''}"></div>`
          ).join('')}
          <span class="pip-label">mismatches</span>
        </div>
        ${distortionActive ? '<div class="distortion-active">⚠ NEN DISTORTION ACTIVE</div>' : ''}
      </div>
      <div class="prob-legend">
        <span class="legend-item prob-high">■ High (70%+)</span>
        <span class="legend-item prob-mid">■ Med (40-69%)</span>
        <span class="legend-item prob-low">■ Low (&lt;40%)</span>
      </div>
    `;
  }
}
