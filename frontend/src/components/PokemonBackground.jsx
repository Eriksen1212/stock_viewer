import React, { useMemo } from 'react';

const POKEMON_IDS = [25, 6, 1, 7, 150, 133, 143, 94, 39, 131, 149, 130, 196, 197, 700, 175, 35, 37, 54, 58, 52, 79, 116, 147, 81];

const POSITIONS = [
  { left: '3%',  top: '8%'  }, { left: '88%', top: '5%'  }, { left: '15%', top: '72%' },
  { left: '78%', top: '80%' }, { left: '45%', top: '10%' }, { left: '60%', top: '65%' },
  { left: '92%', top: '42%' }, { left: '5%',  top: '45%' }, { left: '35%', top: '88%' },
  { left: '70%', top: '25%' }, { left: '22%', top: '30%' }, { left: '52%', top: '50%' },
  { left: '82%', top: '60%' }, { left: '10%', top: '90%' }, { left: '65%', top: '85%' },
  { left: '40%', top: '20%' }, { left: '95%', top: '70%' }, { left: '28%', top: '55%' },
  { left: '73%', top: '48%' }, { left: '48%', top: '75%' },
];

const SIZES   = [52, 64, 56, 72, 60, 52, 80, 64, 56, 68, 60, 72, 56, 64, 52, 80, 60, 64, 56, 72];
const DELAYS  = [0, 1.2, 2.5, 0.7, 3.1, 1.8, 0.3, 2.9, 1.5, 0.9, 3.4, 2.1, 0.5, 1.7, 2.8, 0.2, 3.6, 1.1, 2.3, 0.8];
const SPEEDS  = [4, 5, 3.5, 6, 4.5, 5.5, 3, 6.5, 4, 5, 3.8, 4.8, 5.2, 3.3, 6, 4.2, 5.8, 3.7, 4.6, 5.4];

export default function PokemonBackground() {
  const sprites = useMemo(() =>
    POSITIONS.map((pos, i) => ({
      id: POKEMON_IDS[i % POKEMON_IDS.length],
      ...pos,
      size: SIZES[i],
      delay: DELAYS[i],
      duration: SPEEDS[i],
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {sprites.map((s, i) => (
        <img
          key={i}
          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${s.id}.gif`}
          onError={e => { e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${s.id}.png`; }}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            left: s.left,
            top: s.top,
            width: s.size,
            imageRendering: 'pixelated',
            opacity: 0.22,
            animation: `pokefloat ${s.duration}s ease-in-out ${s.delay}s infinite`,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
          }}
        />
      ))}
    </div>
  );
}
