/* Procedural preview artwork for each project panel, drawn on a canvas (replaces nothing: p.image still wins when set). */
const TONES = [['#1B4DB8', '#0B2A63'], ['#0F6BB5', '#0A2F5E'], ['#2F7BFF', '#12306E']]
const PAPER = '#EAF2FF', PAPER_INK = '#0B1B3A', SOFT = '#C9DBFF', BLUE = '#2F7BFF'

function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }

export function drawProjectArt(canvas, p, i) {
  const W = canvas.width, H = canvas.height, g = canvas.getContext('2d')
  const [a, b] = TONES[i % 3]
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, a); bg.addColorStop(1, b)
  g.fillStyle = bg; g.fillRect(0, 0, W, H)
  // faux window bar
  g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, W, 34)
  ;[BLUE, 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.3)'].forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.arc(20 + k * 20, 17, 6, 0, 7); g.fill() })
  g.fillStyle = 'rgba(214,226,255,0.7)'; g.font = '600 15px system-ui, sans-serif'
  g.fillText(p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.app', 90, 22)

  g.save(); g.translate(0, 34)
  const h = H - 34
  if (p.visual === 'review') {
    g.fillStyle = PAPER; rr(g, W * 0.12, h * 0.12, W * 0.52, h * 0.76, 14); g.fill()
    ;[62, 80, 48, 90, 70, 56, 74].forEach((w, k) => {
      g.fillStyle = k === 1 ? BLUE : k === 3 ? PAPER_INK : SOFT
      rr(g, W * 0.17, h * 0.2 + k * (h * 0.095), (W * 0.42 * w) / 100, 9, 5); g.fill()
    })
    ;['🐞 possible bug', '🔒 security', '⚡ optimise'].forEach((t, k) => {
      g.fillStyle = k === 1 ? BLUE : PAPER; rr(g, W * 0.68, h * 0.2 + k * (h * 0.24), W * 0.26, 38, 12); g.fill()
      g.fillStyle = k === 1 ? '#fff' : PAPER_INK; g.font = '600 15px system-ui, sans-serif'; g.fillText(t, W * 0.7, h * 0.2 + k * (h * 0.24) + 25)
    })
  } else if (p.visual === 'market') {
    g.fillStyle = PAPER; rr(g, W * 0.1, h * 0.1, W * 0.52, h * 0.8, 14); g.fill()
    g.strokeStyle = SOFT; g.lineWidth = 2
    for (let k = 1; k < 7; k++) { g.beginPath(); g.moveTo(W * 0.1 + k * (W * 0.52 / 7), h * 0.1); g.lineTo(W * 0.1 + k * (W * 0.52 / 7), h * 0.9); g.stroke() }
    for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(W * 0.1, h * 0.1 + k * (h * 0.8 / 5)); g.lineTo(W * 0.62, h * 0.1 + k * (h * 0.8 / 5)); g.stroke() }
    ;[[0.22, 0.34], [0.4, 0.58], [0.52, 0.28]].forEach(([x, y], k) => { g.fillStyle = k === 2 ? PAPER_INK : BLUE; g.beginPath(); g.arc(W * x, h * y, 11, 0, 7); g.fill() })
    g.fillStyle = PAPER; rr(g, W * 0.67, h * 0.22, W * 0.27, 40, 14); g.fill()
    g.fillStyle = BLUE; rr(g, W * 0.7, h * 0.52, W * 0.24, 40, 14); g.fill()
    g.fillStyle = PAPER_INK; g.font = '600 14px system-ui'; g.fillText('5pm okay?', W * 0.69, h * 0.22 + 25)
    g.fillStyle = '#fff'; g.fillText('✦ confirmed', W * 0.72, h * 0.52 + 25)
  } else {
    g.fillStyle = PAPER; rr(g, W * 0.15, h * 0.1, W * 0.7, h * 0.8, 14); g.fill()
    g.fillStyle = PAPER_INK; g.font = '700 30px system-ui, sans-serif'; g.fillText(p.title.split(' ')[0], W * 0.2, h * 0.3)
    g.fillStyle = BLUE; g.beginPath(); g.arc(W * 0.78, h * 0.25, 14, 0, 7); g.fill()
    ;[88, 64, 76].forEach((w, k) => { g.fillStyle = SOFT; rr(g, W * 0.2, h * 0.42 + k * 24, (W * 0.58 * w) / 100, 10, 5); g.fill() })
    g.fillStyle = BLUE; rr(g, W * 0.2, h * 0.76, 120, 32, 10); g.fill()
    g.fillStyle = '#fff'; g.font = '700 15px system-ui'; g.fillText('Visit site', W * 0.2 + 26, h * 0.76 + 21)
  }
  g.restore()
}
