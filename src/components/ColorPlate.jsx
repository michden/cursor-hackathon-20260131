import { useMemo } from 'react'

// Seeded random number generator for reproducible plates
function seededRandom(seed) {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

// Color palettes for Ishihara-style plates
const PALETTES = {
  // Red-green deficiency test (protan/deutan)
  redGreen: {
    background: ['#E8B87D', '#D4A76A', '#C9A066', '#DEB578', '#E5C090'],
    foreground: ['#8B9D6B', '#7A8E5C', '#6B7F4D', '#9CAD7C', '#A5B585'],
  },
  // Blue-yellow deficiency test (tritan) 
  blueYellow: {
    background: ['#8B7355', '#9C8465', '#A58D6E', '#7A6448', '#8F7D5F'],
    foreground: ['#6B8E9C', '#5A7D8B', '#7A9EAC', '#4A6D7B', '#8AAEBC'],
  },
  // Control plate (everyone should see)
  control: {
    background: ['#E8B87D', '#D4A76A', '#C9A066', '#DEB578', '#E5C090'],
    foreground: ['#6B4423', '#7A5533', '#5C3515', '#8A6543', '#4D2810'],
  },
}

// Define digit patterns on a 5x7 grid
const DIGIT_PATTERNS = {
  '2': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,1,0],
    [0,0,1,0,0],
    [0,1,0,0,0],
    [1,1,1,1,1],
  ],
  '3': [
    [1,1,1,1,0],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,1,1,1,0],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [1,1,1,1,0],
  ],
  '5': [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  '6': [
    [0,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  '7': [
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,1,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
  ],
  '8': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  '9': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,1,1,1,0],
  ],
  '12': [
    [0,1,0,0,1,1,0],
    [1,1,0,1,0,0,1],
    [0,1,0,0,0,0,1],
    [0,1,0,0,0,1,0],
    [0,1,0,0,1,0,0],
    [0,1,0,1,0,0,0],
    [1,1,1,1,1,1,1],
  ],
  '16': [
    [0,1,0,0,1,1,0],
    [1,1,0,1,0,0,0],
    [0,1,0,1,0,0,0],
    [0,1,0,1,1,1,0],
    [0,1,0,1,0,0,1],
    [0,1,0,1,0,0,1],
    [1,1,1,0,1,1,0],
  ],
  '29': [
    [0,1,1,0,0,1,1,0],
    [1,0,0,1,1,0,0,1],
    [0,0,0,1,1,0,0,1],
    [0,0,1,0,0,1,1,1],
    [0,1,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1],
    [1,1,1,1,0,1,1,0],
  ],
  '45': [
    [1,0,0,1,1,1,1,1],
    [1,0,0,1,1,0,0,0],
    [1,0,0,1,1,1,1,0],
    [1,1,1,1,0,0,0,1],
    [0,0,0,1,0,0,0,1],
    [0,0,0,1,1,0,0,1],
    [0,0,0,1,0,1,1,0],
  ],
  '74': [
    [1,1,1,1,1,0,0,1],
    [0,0,0,0,1,0,0,1],
    [0,0,0,1,0,1,0,1],
    [0,0,1,0,0,1,1,1],
    [0,0,1,0,0,0,0,1],
    [0,0,1,0,0,0,0,1],
    [0,0,1,0,0,0,0,1],
  ],
}

function isInDigit(x, y, digit, plateSize) {
  const pattern = DIGIT_PATTERNS[digit]
  if (!pattern) return false
  
  const patternHeight = pattern.length
  const patternWidth = pattern[0].length
  
  // Center the pattern
  const cellSize = plateSize / (Math.max(patternWidth, patternHeight) + 4)
  const offsetX = (plateSize - patternWidth * cellSize) / 2
  const offsetY = (plateSize - patternHeight * cellSize) / 2
  
  const gridX = Math.floor((x - offsetX) / cellSize)
  const gridY = Math.floor((y - offsetY) / cellSize)
  
  if (gridY >= 0 && gridY < patternHeight && gridX >= 0 && gridX < patternWidth) {
    return pattern[gridY][gridX] === 1
  }
  return false
}

export default function ColorPlate({ digit, paletteType = 'redGreen', size = 280, seed = 42 }) {
  const circles = useMemo(() => {
    const palette = PALETTES[paletteType]
    const random = seededRandom(seed + digit.charCodeAt(0))
    const result = []
    const plateRadius = size / 2
    const centerX = plateRadius
    const centerY = plateRadius
    
    // Generate random circles
    const attempts = 2000
    const minRadius = size / 50
    const maxRadius = size / 20
    
    for (let i = 0; i < attempts; i++) {
      const angle = random() * Math.PI * 2
      const distance = random() * (plateRadius - maxRadius)
      const x = centerX + Math.cos(angle) * distance
      const y = centerY + Math.sin(angle) * distance
      const r = minRadius + random() * (maxRadius - minRadius)
      
      // Check if point is within the plate circle
      const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
      if (distFromCenter + r > plateRadius - 2) continue
      
      // Check overlap with existing circles
      let overlaps = false
      for (const existing of result) {
        const dist = Math.sqrt((x - existing.x) ** 2 + (y - existing.y) ** 2)
        if (dist < r + existing.r + 1) {
          overlaps = true
          break
        }
      }
      if (overlaps) continue
      
      // Determine color based on whether point is in digit
      const inDigit = isInDigit(x, y, digit, size)
      const colors = inDigit ? palette.foreground : palette.background
      const color = colors[Math.floor(random() * colors.length)]
      
      result.push({ x, y, r, color })
    }
    
    return result
  }, [digit, paletteType, size, seed])

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-full"
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      {/* Background circle */}
      <circle 
        cx={size/2} 
        cy={size/2} 
        r={size/2 - 1} 
        fill="#f5f5f5" 
        stroke="#ddd" 
        strokeWidth="2"
      />
      
      {/* Colored dots */}
      {circles.map((circle, i) => (
        <circle
          key={i}
          cx={circle.x}
          cy={circle.y}
          r={circle.r}
          fill={circle.color}
        />
      ))}
    </svg>
  )
}
