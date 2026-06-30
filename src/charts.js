import { escapeHtml, formatCompactNumber, formatNumber, truncateLabel } from "./utils.js";

export function renderXpLineChart(points) {
  if (points.length === 0) return renderEmptySvg("No XP timeline data");

  const width = 720;
  const height = 280;
  const padding = { top: 24, right: 28, bottom: 42, left: 72 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxY = Math.max(...points.map((point) => point.total), 1);
  const lastIndex = Math.max(points.length - 1, 1);
  const coordinates = points.map((point, index) => {
    const x = padding.left + (index / lastIndex) * plotWidth;
    const y = padding.top + plotHeight - (point.total / maxY) * plotHeight;
    return { ...point, x, y };
  });
  const path = coordinates.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  const markers = coordinates.filter((_, index) => index === 0 || index === coordinates.length - 1 || index % Math.ceil(coordinates.length / 12) === 0);
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return `
    <svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="XP accumulated over time">
      <rect class="chart-bg" x="0" y="0" width="${width}" height="${height}" rx="8"></rect>
      ${ticks
        .map((tick) => {
          const y = padding.top + plotHeight - tick * plotHeight;
          return `
            <line class="grid-line" x1="${padding.left}" x2="${width - padding.right}" y1="${y}" y2="${y}"></line>
            <text class="axis-label" x="${padding.left - 12}" y="${y + 4}" text-anchor="end">${formatCompactNumber(maxY * tick)}</text>
          `;
        })
        .join("")}
      <line class="axis-line" x1="${padding.left}" x2="${width - padding.right}" y1="${padding.top + plotHeight}" y2="${padding.top + plotHeight}"></line>
      <line class="axis-line" x1="${padding.left}" x2="${padding.left}" y1="${padding.top}" y2="${padding.top + plotHeight}"></line>
      <path class="line-fill" d="${path} L ${coordinates.at(-1).x.toFixed(2)} ${padding.top + plotHeight} L ${padding.left} ${padding.top + plotHeight} Z"></path>
      <path class="line-path" d="${path}"></path>
      ${markers
        .map(
          (point) => `
            <circle class="line-point" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="4">
              <title>${escapeHtml(`${point.date}: ${formatNumber(point.total)} XP`)}</title>
            </circle>
          `,
        )
        .join("")}
      <text class="axis-label" x="${padding.left}" y="${height - 12}">${escapeHtml(points[0].date)}</text>
      <text class="axis-label" x="${width - padding.right}" y="${height - 12}" text-anchor="end">${escapeHtml(points.at(-1).date)}</text>
    </svg>
  `;
}

export function renderXpBarChart(items) {
  if (items.length === 0) return renderEmptySvg("No project XP data");

  const width = 720;
  const height = 320;
  const padding = { top: 22, right: 34, bottom: 30, left: 180 };
  const rowGap = 10;
  const rowHeight = Math.max(18, (height - padding.top - padding.bottom - rowGap * (items.length - 1)) / items.length);
  const maxAmount = Math.max(...items.map((item) => item.amount), 1);
  const plotWidth = width - padding.left - padding.right;

  return `
    <svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Top projects by XP">
      <rect class="chart-bg" x="0" y="0" width="${width}" height="${height}" rx="8"></rect>
      ${items
        .map((item, index) => {
          const y = padding.top + index * (rowHeight + rowGap);
          const barWidth = Math.max(3, (item.amount / maxAmount) * plotWidth);
          return `
            <text class="bar-label" x="${padding.left - 12}" y="${y + rowHeight * 0.68}" text-anchor="end">${escapeHtml(truncateLabel(item.label, 22))}</text>
            <rect class="bar-track" x="${padding.left}" y="${y}" width="${plotWidth}" height="${rowHeight}" rx="5"></rect>
            <rect class="bar-value" x="${padding.left}" y="${y}" width="${barWidth}" height="${rowHeight}" rx="5">
              <title>${escapeHtml(`${item.label}: ${formatNumber(item.amount)} XP`)}</title>
            </rect>
            <text class="bar-value-label" x="${padding.left + barWidth + 8}" y="${y + rowHeight * 0.68}">${formatCompactNumber(item.amount)}</text>
          `;
        })
        .join("")}
    </svg>
  `;
}

export function renderPassFailDonut(passed, failed) {
  const total = passed + failed;
  if (total === 0) return renderEmptySvg("No pass/fail data");

  const width = 420;
  const height = 280;
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const passLength = (passed / total) * circumference;
  const failLength = circumference - passLength;
  const passPercent = Math.round((passed / total) * 100);

  return `
    <svg class="chart donut-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Pass and fail ratio">
      <rect class="chart-bg" x="0" y="0" width="${width}" height="${height}" rx="8"></rect>
      <g transform="translate(136 136) rotate(-90)">
        <circle class="donut-track" cx="0" cy="0" r="${radius}"></circle>
        <circle
          class="donut-pass"
          cx="0"
          cy="0"
          r="${radius}"
          stroke-dasharray="${passLength} ${circumference - passLength}"
        >
          <title>${formatNumber(passed)} passed</title>
        </circle>
        <circle
          class="donut-fail"
          cx="0"
          cy="0"
          r="${radius}"
          stroke-dasharray="${failLength} ${circumference - failLength}"
          stroke-dashoffset="${-passLength}"
        >
          <title>${formatNumber(failed)} failed</title>
        </circle>
      </g>
      <text class="donut-value" x="136" y="128" text-anchor="middle">${passPercent}%</text>
      <text class="donut-caption" x="136" y="154" text-anchor="middle">passed</text>
      <g class="legend" transform="translate(260 92)">
        <rect class="legend-pass" x="0" y="0" width="12" height="12" rx="3"></rect>
        <text x="22" y="11">Passed ${formatNumber(passed)}</text>
        <rect class="legend-fail" x="0" y="34" width="12" height="12" rx="3"></rect>
        <text x="22" y="45">Failed ${formatNumber(failed)}</text>
      </g>
    </svg>
  `;
}

function renderEmptySvg(message) {
  return `
    <svg class="chart" viewBox="0 0 720 220" role="img" aria-label="${escapeHtml(message)}">
      <rect class="chart-bg" x="0" y="0" width="720" height="220" rx="8"></rect>
      <text class="empty-chart-text" x="360" y="112" text-anchor="middle">${escapeHtml(message)}</text>
    </svg>
  `;
}
