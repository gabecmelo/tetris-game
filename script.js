const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');
nextCtx.scale(20, 20);

const colors = [
  null,
  '#00f0f0', // I
  '#0000f0', // J
  '#f0a000', // L
  '#f0f000', // O
  '#00f000', // S
  '#a000f0', // T
  '#f00000', // Z
];

const tetrominoes = {
  I: [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  J: [[2,0,0],[2,2,2],[0,0,0]],
  L: [[0,0,3],[3,3,3],[0,0,0]],
  O: [[4,4],[4,4]],
  S: [[0,5,5],[5,5,0],[0,0,0]],
  T: [[0,6,0],[6,6,6],[0,0,0]],
  Z: [[7,7,0],[0,7,7],[0,0,0]],
};

function createMatrix(w, h) {
  const m = [];
  while (h--) m.push(new Array(w).fill(0));
  return m;
}

function drawMatrix(m, o, ctxRef = context) {
  m.forEach((row, y) => {
    row.forEach((v, x) => {
      if (v) {
        ctxRef.fillStyle = colors[v];
        ctxRef.fillRect(x + o.x, y + o.y, 1, 1);
      }
    });
  });
}

function merge(arena, player) {
  player.matrix.forEach((row,y) => row.forEach((v,x) => {
    if (v) arena[y+player.pos.y][x+player.pos.x] = v;
  }));
}

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; y++)
    for (let x = 0; x < m[y].length; x++)
      if (m[y][x] && (arena[y+o.y] && arena[y+o.y][x+o.x]) !== 0)
        return true;
  return false;
}

function rotate(m) {
  for (let y = 0; y < m.length; y++)
    for (let x = 0; x < y; x++)
      [m[x][y], m[y][x]] = [m[y][x], m[x][y]];
  m.forEach(r => r.reverse());
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    arenaSweep();
    updateScore();
    playerReset();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) player.pos.x -= dir;
}

function playerRotate(dir) {
  const pos = player.pos.x;
  rotate(player.matrix);
  if (dir < 0) rotate(player.matrix), rotate(player.matrix), rotate(player.matrix);
  let offset = 1;
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset>0?1:-1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix);
      if (dir < 0) rotate(player.matrix), rotate(player.matrix), rotate(player.matrix);
      player.pos.x = pos;
      return;
    }
  }
}

let score = 0;
let level = 0;
function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length-1; y >= 0; y--) {
    for (let x = 0; x < arena[y].length; x++)
      if (!arena[y][x]) continue outer;
    const row = arena.splice(y,1)[0].fill(0);
    arena.unshift(row);
    score += rowCount * 10;
    rowCount *= 2;
    level = Math.floor(score / 200);
    y++;
  }
}

function updateScore() {
  document.getElementById('score').innerText = score;
  document.getElementById('level').innerText = level;
  dropInterval = 1000 - level * 100;
}

function draw() {
  context.fillStyle = '#000';
  context.fillRect(0,0,canvas.width,canvas.height);
  drawMatrix(arena, {x:0,y:0});
  drawMatrix(player.matrix, player.pos);
  // next
  nextCtx.fillStyle = '#000';
  nextCtx.fillRect(0,0,nextCanvas.width, nextCanvas.height);
  drawMatrix(next.matrix, next.pos, nextCtx);
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
function update(time=0) {
  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;
  if (dropCounter > dropInterval) playerDrop();
  draw();
  requestAnimationFrame(update);
}

function randomPiece() {
  const keys = Object.keys(tetrominoes);
  const type = keys[(keys.length * Math.random()) | 0];
  return tetrominoes[type].map(row => row.slice());
}

function playerReset() {
  player.matrix = next.matrix;
  player.pos.y = 0;
  player.pos.x = (arena[0].length/2 | 0) - (player.matrix[0].length/2 | 0);
  if (collide(arena, player)) {
    arena.forEach(r => r.fill(0));
    score = 0; level = 0; updateScore();
  }
  next.matrix = randomPiece();
}

const arena = createMatrix(12,20);
const player = { pos: {x:0,y:0}, matrix: null };
const next = { pos: {x:1,y:1}, matrix: randomPiece() };

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') playerMove(-1);
  else if (e.key === 'ArrowRight') playerMove(1);
  else if (e.key === 'ArrowDown') playerDrop();
  else if (e.key === 'ArrowUp') playerRotate(1);
});

playerReset();
update();
