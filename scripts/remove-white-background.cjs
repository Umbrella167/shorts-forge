const fs = require('fs');
const {PNG} = require('pngjs');

const files = ['小红书.png', 'B站.png', '抖音.png'];
const tolerance = 42;

for (const file of files) {
  const source = PNG.sync.read(fs.readFileSync(file));
  const visited = new Uint8Array(source.width * source.height);
  const queue = [];
  const isWhite = (x, y) => {
    const i = (y * source.width + x) * 4;
    return source.data[i] > 255 - tolerance && source.data[i + 1] > 255 - tolerance && source.data[i + 2] > 255 - tolerance;
  };
  const add = (x, y) => {
    if (x < 0 || y < 0 || x >= source.width || y >= source.height) return;
    const p = y * source.width + x;
    if (!visited[p] && isWhite(x, y)) {
      visited[p] = 1;
      queue.push([x, y]);
    }
  };
  for (let x = 0; x < source.width; x += 1) { add(x, 0); add(x, source.height - 1); }
  for (let y = 0; y < source.height; y += 1) { add(0, y); add(source.width - 1, y); }
  while (queue.length) {
    const [x, y] = queue.shift();
    const i = (y * source.width + x) * 4;
    source.data[i + 3] = 0;
    add(x - 1, y); add(x + 1, y); add(x, y - 1); add(x, y + 1);
  }
  fs.writeFileSync(`public/${file.replace('.png', '-transparent.png')}`, PNG.sync.write(source));
}
