import { useEffect, useRef } from 'react';

// Three.js Particle Background — โทนน้ำเงินกรมท่า + ทอง
export default function ParticleBackground({ intensity = 1 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    // Particle config
    const PARTICLE_COUNT = Math.floor(80 * intensity);
    const particles = [];

    const COLORS = [
      'rgba(201,168,76,', // gold
      'rgba(45,95,166,',  // navy-600
      'rgba(59,125,216,', // navy-500
      'rgba(147,190,240,', // navy-300
    ];

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.r = Math.random() * 2.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.alpha = Math.random() * 0.6 + 0.1;
        this.life = 0;
        this.maxLife = Math.random() * 300 + 200;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life++;
        if (this.x < 0 || this.x > W || this.y < 0 || this.y > H || this.life > this.maxLife) {
          this.reset();
        }
      }
      draw() {
        const fade = this.life < 30 ? this.life / 30 : this.life > this.maxLife - 30 ? (this.maxLife - this.life) / 30 : 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color + (this.alpha * fade) + ')';
        ctx.fill();
      }
    }

    // สร้าง particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = new Particle();
      p.life = Math.floor(Math.random() * p.maxLife); // random start
      particles.push(p);
    }

    // Lines ที่เชื่อม particles ใกล้กัน
    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.08;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(201,168,76,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    // Gradient grid
    function drawGrid() {
      ctx.strokeStyle = 'rgba(45,95,166,0.06)';
      ctx.lineWidth = 0.5;
      const size = 60;
      for (let x = 0; x <= W; x += size) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += size) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    }

    // Glow spots
    function drawGlows() {
      const glows = [
        { x: W * 0.1, y: H * 0.2, r: 200, color: 'rgba(45,95,166,0.08)' },
        { x: W * 0.85, y: H * 0.7, r: 250, color: 'rgba(201,168,76,0.06)' },
        { x: W * 0.5, y: H * 0.9, r: 180, color: 'rgba(59,125,216,0.07)' },
      ];
      glows.forEach(g => {
        const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
        grad.addColorStop(0, g.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function animate() {
      // Clear
      ctx.fillStyle = 'rgba(15,31,61,0.15)';
      ctx.fillRect(0, 0, W, H);

      drawGrid();
      drawGlows();
      drawConnections();
      particles.forEach(p => { p.update(); p.draw(); });

      animRef.current = requestAnimationFrame(animate);
    }

    // Initial fill
    ctx.fillStyle = '#0f1f3d';
    ctx.fillRect(0, 0, W, H);

    animate();

    const handleResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
}
