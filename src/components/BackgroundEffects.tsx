import React, { useEffect, useState } from 'react';

const BackgroundEffects: React.FC = () => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    emoji: string;
    duration: number;
    delay: number;
  }>>([]);

  const emojis = ['🎉', '⭐', '✨', '🎊', '🎈', '🍀', '🌟', '💫', '🎯', '🏆'];

  useEffect(() => {
    // Create floating background particles
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      duration: 6 + Math.random() * 8, // 6-14 seconds
      delay: Math.random() * 5, // 0-5 second delay
    }));

    setParticles(newParticles);

    // Periodically add new random particles
    const interval = setInterval(() => {
      setParticles(current => {
        const randomParticle = {
          id: Date.now(),
          x: Math.random() * 100,
          y: Math.random() * 100,
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
          duration: 6 + Math.random() * 8,
          delay: 0,
        };

        // Keep only the last 12 particles
        const updated = [...current, randomParticle].slice(-12);
        return updated;
      });
    }, 8000); // Add new particle every 8 seconds

    return () => clearInterval(interval);
  }, []);

  // Random surprise effects
  const [surpriseEffect, setSurpriseEffect] = useState<string | null>(null);

  useEffect(() => {
    const surpriseInterval = setInterval(() => {
      // 5% chance every 10 seconds for a surprise effect
      if (Math.random() < 0.05) {
        const effects = ['rainbow-flash', 'sparkle-burst', 'emoji-rain'];
        const effect = effects[Math.floor(Math.random() * effects.length)];
        setSurpriseEffect(effect);

        // Clear effect after 3 seconds
        setTimeout(() => setSurpriseEffect(null), 3000);
      }
    }, 10000);

    return () => clearInterval(surpriseInterval);
  }, []);

  return (
    <>
      {/* Floating background particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="floating-bg-element"
          style={{
            top: `${particle.y}%`,
            left: `${particle.x}%`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            fontSize: '1.5rem',
          }}
        >
          {particle.emoji}
        </div>
      ))}

      {/* Surprise effects */}
      {surpriseEffect === 'rainbow-flash' && (
        <div
          className="surprise-effect rainbow-flash"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,0,0,0.1), rgba(255,165,0,0.1), rgba(255,255,0,0.1), rgba(0,128,0,0.1), rgba(0,0,255,0.1), rgba(75,0,130,0.1), rgba(238,130,238,0.1))',
            animation: 'rainbow 2s linear',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        />
      )}

      {surpriseEffect === 'sparkle-burst' && (
        <div className="sparkle-burst">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="sparkle"
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 18}deg) translateY(-${50 + Math.random() * 100}px)`,
                animation: 'sparkle 1.5s ease-out',
                animationDelay: `${i * 0.1}s`,
                zIndex: 1000,
              }}
            />
          ))}
        </div>
      )}

      {surpriseEffect === 'emoji-rain' && (
        <div className="emoji-rain">
          {Array.from({ length: 15 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'fixed',
                top: '-50px',
                left: `${Math.random() * 100}%`,
                fontSize: '2rem',
                animation: `drift ${3 + Math.random() * 2}s linear`,
                animationDelay: `${i * 0.2}s`,
                zIndex: 1000,
                pointerEvents: 'none',
              }}
            >
              {emojis[Math.floor(Math.random() * emojis.length)]}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default BackgroundEffects; 