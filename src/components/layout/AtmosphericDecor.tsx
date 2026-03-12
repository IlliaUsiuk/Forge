'use client'

const PS = 4 // one "pixel" = 4 SVG units

const C: Record<string, string> = {
  W: '#ffffcc', // bright white-yellow tip
  Y: '#ffdd00', // yellow flame
  O: '#ff8800', // orange flame
  R: '#cc2200', // red flame
  D: '#661100', // dark ember / coal
  L: '#885522', // wood log
  K: '#442211', // dark wood grain
}

// Rows 0–7: flame only — these pixels will animate
const FLAME: (string | null)[][] = [
  [null,null,null,null,null,'W', 'W', null,null,null,null,null], // 0 tip
  [null,null,null,null,'Y', 'Y', 'Y', 'Y', null,null,null,null], // 1
  [null,null,null,'Y', 'Y', 'O', 'O', 'Y', 'Y', null,null,null], // 2
  [null,null,null,'Y', 'O', 'O', 'R', 'O', 'Y', null,null,null], // 3
  [null,null,'Y', 'O', 'O', 'R', 'R', 'O', 'O', 'Y', null,null], // 4
  [null,null,'O', 'O', 'R', 'R', 'D', 'R', 'O', 'O', null,null], // 5
  [null,null,'R', 'R', 'R', 'D', 'D', 'D', 'R', 'R', null,null], // 6
  [null,'R', 'R', 'D', 'D', 'D', 'D', 'D', 'D', 'R', 'R', null], // 7
]

// Rows 8–12: embers + logs — STATIC, no animation
const BASE: (string | null)[][] = [
  [null,null,'D', 'D', 'D', 'D', 'D', 'D', 'D', null,null,null], // 8  embers
  ['L', 'L', null,'D', 'D', 'D', 'D', 'D', null,null,'L', 'L'], // 9  logs meet
  ['L', 'K', 'L', null,null,null,null,null,null,'L', 'K', 'L'], // 10 log bodies
  [null,'L', 'K', 'L', null,null,null,null,'L', 'K', 'L', null], // 11 logs cross
  [null,null,'L', 'L', null,null,null,null,'L', 'L', null,null], // 12 log ends
]

const COLS = 12
const ROWS = FLAME.length + BASE.length // 13
const SVG_W = COLS * PS // 48
const SVG_H = ROWS * PS // 52

function renderPixels(rows: (string | null)[][], rowOffset = 0) {
  return rows.flatMap((row, ri) =>
    row.map((color, ci) =>
      color ? (
        <rect
          key={`${ri}-${ci}`}
          x={ci * PS}
          y={(ri + rowOffset) * PS}
          width={PS}
          height={PS}
          fill={C[color]}
          shapeRendering="crispEdges"
        />
      ) : null
    )
  )
}

export function AtmosphericDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden" aria-hidden>

      {/* ── Background atmospheric glows ── */}
      <div
        className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.09) 0%, rgba(109,40,217,0.04) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute -bottom-20 -right-20 h-[420px] w-[420px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(234,88,12,0.11) 0%, rgba(251,146,60,0.05) 50%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* ── Pixel art campfire — bottom right ── */}
      <div className="absolute bottom-8 right-10 flex flex-col items-center">

        {/* Warm ground glow — smooth ambient light under the fire */}
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-10 w-28 rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(251,146,60,0.6) 0%, rgba(234,88,12,0.2) 55%, transparent 100%)',
            filter: 'blur(10px)',
          }}
        />

        {/* Pixel sprite at 2× — chunky retro pixels */}
        <div style={{ imageRendering: 'pixelated' }}>
          <svg
            width={SVG_W * 2}
            height={SVG_H * 2}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            xmlns="http://www.w3.org/2000/svg"
            style={{
              imageRendering: 'pixelated',
              shapeRendering: 'crispEdges',
              filter:
                'drop-shadow(0 0 7px rgba(251,146,60,0.8)) drop-shadow(0 0 18px rgba(234,88,12,0.45))',
            }}
          >
            {/* Flame — gently burns with .flame-animate */}
            <g className="flame-animate">
              {renderPixels(FLAME, 0)}
            </g>

            {/* Base (embers + logs) — completely static */}
            <g>
              {renderPixels(BASE, FLAME.length)}
            </g>
          </svg>
        </div>
      </div>

      {/* ── River strip — flows left to right below the fire ── */}
      <div className="absolute bottom-5 right-0 w-52 overflow-hidden" style={{ height: 3 }}>
        <div
          className="animate-river-flow h-full"
          style={{
            width: '200%',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.35) 15%, rgba(96,165,250,0.65) 30%, rgba(147,197,253,0.45) 45%, transparent 50%, transparent 50%, rgba(59,130,246,0.35) 65%, rgba(96,165,250,0.65) 80%, rgba(147,197,253,0.45) 90%, transparent 100%)',
          }}
        />
      </div>
      {/* Second river layer — offset for depth */}
      <div className="absolute bottom-3.5 right-4 w-40 overflow-hidden" style={{ height: 2 }}>
        <div
          className="animate-river-flow h-full"
          style={{
            width: '200%',
            animationDelay: '-2s',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.2) 20%, rgba(96,165,250,0.4) 35%, transparent 50%, transparent 50%, rgba(59,130,246,0.2) 70%, rgba(96,165,250,0.4) 85%, transparent 100%)',
          }}
        />
      </div>

    </div>
  )
}
