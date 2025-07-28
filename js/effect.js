// Efecto de partículas de loot (gemas/cofres)
document.addEventListener("DOMContentLoaded", () => {
  // Configuración de partículas
  const particleCount = 30;
  const lootIcons = ["💰", "💎", "🔶", "🏆", "👑", "💍"];
  const coins = ["💎", "🪙", "💰", "🔋"]; // Símbolos temáticos

  for (let i = 0; i < particleCount; i++) {
    createParticle();
  }

  function createEmeraldParticle() {
    const coin = document.createElement("div");
    coin.textContent = coins[Math.floor(Math.random() * coins.length)];
    coin.style.color = `hsl(${Math.random() * 60 + 120}, 100%, 50%)`; // Tonos verdes
    // ... resto de la configuración ...
  }

  function createParticle() {
    const particle = document.createElement("div");
    particle.innerHTML =
      lootIcons[Math.floor(Math.random() * lootIcons.length)];
    particle.style.position = "fixed";
    particle.style.fontSize = `${Math.random() * 20 + 10}px`;
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.top = `${Math.random() * 100}vh`;
    particle.style.opacity = Math.random() * 0.5 + 0.1;
    particle.style.animation = `float ${
      Math.random() * 15 + 5
    }s infinite linear`;
    particle.style.zIndex = "2";

    document.getElementById("loot-particles").appendChild(particle);

    // Animación personalizada para cada partícula
    const keyframes = `
      @keyframes float {
        0% { transform: translate(0, 0) rotate(0deg); opacity: ${
          Math.random() * 0.5 + 0.1
        }; }
        50% { transform: translate(${Math.random() * 100 - 50}px, ${
      Math.random() * 100 - 50
    }px) rotate(180deg); opacity: ${Math.random() * 0.3 + 0.2}; }
        100% { transform: translate(0, 0) rotate(360deg); opacity: ${
          Math.random() * 0.5 + 0.1
        }; }
      }
    `;

    const style = document.createElement("style");
    style.innerHTML = keyframes;
    document.head.appendChild(style);
  }

  // Humo psicodélico con Canvas
  const canvas = document.getElementById("smoke-canvas");
  const ctx = canvas.getContext("2d");
  let particles = [];
  const colors = ["#39ff14", "#9d00ff", "#00f2fe", "#ff00f7"];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = canvas.height + Math.random() * 100;
      this.size = Math.random() * 15 + 5;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.speed = Math.random() * 2 + 0.5;
      this.angle = Math.random() * Math.PI * 2;
    }

    update() {
      this.y -= this.speed;
      this.x += Math.cos(this.angle) * 0.5;
      this.angle += Math.random() * 0.2 - 0.1;

      if (this.y < -this.size) this.reset();
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Crear partículas de humo
  for (let i = 0; i < 50; i++) {
    particles.push(new Particle());
  }

  function animateSmoke() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animateSmoke);
  }

  animateSmoke();
});
