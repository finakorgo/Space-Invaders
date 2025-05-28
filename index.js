//Criated by José Aparecido Finamor - 17/07/2022


// ========== Configuração Inicial ==========
const scoreEl = document.querySelector('#scoreEl');
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 1024;
canvas.height = 576;

const backgroundAudio = new Audio("Audio/intro.mp3");
backgroundAudio.loop = true;
backgroundAudio.play();

// ========== Classes ==========

class Player {
    constructor() {
        this.velocity = { x: 0, y: 0 };
        this.rotation = 0;
        this.opacity = 1;

        const image = new Image();
        image.src = './img/spaceship.png';
        image.onload = () => {
            const scale = 0.15;
            this.image = image;
            this.width = image.width * scale;
            this.height = image.height * scale;
            this.position = {
                x: canvas.width / 2 - this.width / 2,
                y: canvas.height - this.height - 20
            };
        };
    }

    draw() {
        if (!this.image) return;

        c.save();
        c.globalAlpha = this.opacity;
        c.translate(this.position.x + this.width / 2, this.position.y + this.height / 2);
        c.rotate(this.rotation);
        c.translate(-this.position.x - this.width / 2, -this.position.y - this.height / 2);
        c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
        c.restore();
    }

    update() {
        if (this.image) {
            this.draw();
            this.position.x += this.velocity.x;
        }
    }
}

class Projectile {
    constructor({ position, velocity }) {
        this.position = position;
        this.velocity = velocity;
        this.radius = 4;
    }

    draw() {
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = 'red';
        c.fill();
        c.closePath();
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

class Particle {
    constructor({ position, velocity, radius, color, fades }) {
        this.position = position;
        this.velocity = velocity;
        this.radius = radius;
        this.color = color;
        this.opacity = 1;
        this.fades = fades;
    }

    draw() {
        c.save();
        c.globalAlpha = this.opacity;
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.fill();
        c.closePath();
        c.restore();
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        if (this.fades) this.opacity -= 0.01;
    }
}

class InvaderProjectile {
    constructor({ position, velocity }) {
        this.position = position;
        this.velocity = velocity;
        this.width = 3;
        this.height = 10;
    }

    draw() {
        c.fillStyle = 'white';
        c.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

class Invader {
    constructor({ position }) {
        this.velocity = { x: 0, y: 0 };

        const image = new Image();
        image.src = './img/invader.png';
        image.onload = () => {
            const scale = 1;
            this.image = image;
            this.width = image.width * scale;
            this.height = image.height * scale;
            this.position = {
                x: position.x,
                y: position.y
            };
        };
    }

    draw() {
        if (!this.image) return;
        c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
    }

    update({ velocity }) {
        if (this.image) {
            this.draw();
            this.position.x += velocity.x;
            this.position.y += velocity.y;
        }
    }

    shoot(invaderProjectiles) {
        invaderProjectiles.push(new InvaderProjectile({
            position: {
                x: this.position.x + this.width / 2,
                y: this.position.y + this.height
            },
            velocity: { x: 0, y: 5 }
        }));
    }
}

class Grid {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 3, y: 0 };
        this.invaders = [];

        const columns = Math.floor(Math.random() * 10 + 5);
        const rows = Math.floor(Math.random() * 5 + 2);
        this.width = columns * 30;

        for (let x = 0; x < columns; x++) {
            for (let y = 0; y < rows; y++) {
                this.invaders.push(new Invader({
                    position: { x: x * 30, y: y * 30 }
                }));
            }
        }
    }

    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.velocity.y = 0;

        if (this.position.x + this.width >= canvas.width || this.position.x <= 0) {
            this.velocity.x = -this.velocity.x;
            this.velocity.y = 30;
        }
    }
}

// ========== Variáveis Globais ==========
const player = new Player();
const projectiles = [];
const invaderProjectiles = [];
const particles = [];
const grids = [];

const keys = {
    a: { pressed: false },
    d: { pressed: false },
    space: { pressed: false }
};

let frames = 0;
let randomInterval = Math.floor(Math.random() * 500 + 500);
let game = { over: false, active: true, paused: false };
let score = 0;

// ========== Funções Auxiliares ==========
function createParticles({ object, color, fades }) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle({
            position: {
                x: object.position.x + object.width / 2,
                y: object.position.y + object.height / 2
            },
            velocity: {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2
            },
            radius: Math.random() * 3,
            color: color || '#BAA0DE',
            fades
        }));
    }
}

// Inicializar partículas de fundo
for (let i = 0; i < 100; i++) {
    particles.push(new Particle({
        position: {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        },
        velocity: { x: 0, y: 0.3 },
        radius: Math.random() * 3,
        color: 'white'
    }));
}

// ========== Loop Principal ==========
function animate() {
    if (!game.active) {
        document.getElementById("btn").style.visibility = "visible";
        return;
    }

    if (game.paused) {
        c.fillStyle = 'rgba(0,0,0,0.5)';
        c.fillRect(0, 0, canvas.width, canvas.height);
        c.fillStyle = 'white';
        c.font = '48px Arial';
        c.textAlign = 'center';
        c.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
        return;
    }

    requestAnimationFrame(animate);
    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, canvas.height);

    player.update();

    // Partículas
    particles.forEach((particle, i) => {
        if (particle.position.y - particle.radius >= canvas.height) {
            particle.position.x = Math.random() * canvas.width;
            particle.position.y = -particle.radius;
        }

        particle.opacity <= 0
            ? particles.splice(i, 1)
            : particle.update();
    });

    // Projetos inimigos
    invaderProjectiles.forEach((projectile, i) => {
        if (projectile.position.y + projectile.height >= canvas.height) {
            invaderProjectiles.splice(i, 1);
        } else {
            projectile.update();
        }

        if (
            projectile.position.y + projectile.height >= player.position.y &&
            projectile.position.x + projectile.width >= player.position.x &&
            projectile.position.x <= player.position.x + player.width
        ) {
            const loseAudio = new Audio("Audio/sfx-lose.ogg");
            loseAudio.play();

            invaderProjectiles.splice(i, 1);
            player.opacity = 0;
            game.over = true;

            setTimeout(() => game.active = false, 2000);

            // Leaderboard logic
            let leaderboard = getLeaderboard();
            if (nickname) {
                leaderboard.push({ name: nickname, score });
                leaderboard = leaderboard
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5);
                saveLeaderboard(leaderboard);
                updateLeaderboardDisplay();
            }

            createParticles({ object: player, color: 'white', fades: true });
        }
    });

    // Tiros do jogador
    projectiles.forEach((projectile, i) => {
        if (projectile.position.y + projectile.radius <= 0) {
            projectiles.splice(i, 1);
        } else {
            projectile.update();
        }
    });

    // Invasores
    grids.forEach((grid, gridIndex) => {
        grid.update();

        if (frames % 100 === 0 && grid.invaders.length > 0) {
            grid.invaders[Math.floor(Math.random() * grid.invaders.length)].shoot(invaderProjectiles);
        }

        grid.invaders.forEach((invader, i) => {
            invader.update({ velocity: grid.velocity });

            projectiles.forEach((projectile, j) => {
                const hit =
                    projectile.position.y - projectile.radius <= invader.position.y + invader.height &&
                    projectile.position.x + projectile.radius >= invader.position.x &&
                    projectile.position.x - projectile.radius <= invader.position.x + invader.width &&
                    projectile.position.y + projectile.radius >= invader.position.y;

                if (hit) {
                    score += 100;
                    scoreEl.innerHTML = score;
                    createParticles({ object: invader, fades: true });

                    grid.invaders.splice(i, 1);
                    projectiles.splice(j, 1);

                    if (grid.invaders.length > 0) {
                        const first = grid.invaders[0];
                        const last = grid.invaders[grid.invaders.length - 1];
                        grid.width = last.position.x - first.position.x + last.width;
                        grid.position.x = first.position.x;
                    } else {
                        grids.splice(gridIndex, 1);
                    }
                }
            });
        });
    });

    // Controles
    if (keys.a.pressed && player.position.x >= 0) {
        player.velocity.x = -7;
        player.rotation = -0.15;
    } else if (keys.d.pressed && player.position.x + player.width <= canvas.width) {
        player.velocity.x = 7;
        player.rotation = 0.15;
    } else {
        player.velocity.x = 0;
        player.rotation = 0;
    }

    // Spawn de novos grids
    if (frames % randomInterval === 0) {
        grids.push(new Grid());
        randomInterval = Math.floor(Math.random() * 500 + 500);
        frames = 0;
    }

    frames++;
}

animate();

// ========== Eventos de Teclado ==========
addEventListener('keydown', ({ key }) => {
    if (key === 'p') {
        game.paused = !game.paused;
        if (!game.paused) animate(); // Resume animation if unpausing
        return;
    }
    if (game.over || game.paused) return;

    switch (key) {
        case 'a':
            keys.a.pressed = true;
            break;
        case 'd':
            keys.d.pressed = true;
            break;
        case ' ':
            projectiles.push(new Projectile({
                position: {
                    x: player.position.x + player.width / 2,
                    y: player.position.y
                },
                velocity: { x: 0, y: -10 }
            }));
            const laserAudio = new Audio("Audio/sfx-laser1.ogg");
            laserAudio.play();
            break;
    }
});

addEventListener('keyup', ({ key }) => {
    switch (key) {
        case 'a':
            keys.a.pressed = false;
            break;
        case 'd':
            keys.d.pressed = false;
            break;
    }
});

const nicknameInput = document.getElementById('nickname');
const leaderboardList = document.getElementById('leaderboardList');
let nickname = localStorage.getItem('nickname') || '';
nicknameInput.value = nickname;
nicknameInput.addEventListener('input', (e) => {
    nickname = e.target.value.trim();
    localStorage.setItem('nickname', nickname);
});

function getLeaderboard() {
    return JSON.parse(localStorage.getItem('leaderboard') || '[]');
}

function saveLeaderboard(leaderboard) {
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

function updateLeaderboardDisplay() {
    const leaderboard = getLeaderboard();
    leaderboardList.innerHTML = leaderboard.map((entry, i) =>
        `<li>${i + 1}. <span class="font-bold">${entry.name}</span> - <span class="text-indigo-300">${entry.score}</span></li>`
    ).join('');
}
updateLeaderboardDisplay();
