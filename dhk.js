const canvas = document.querySelector('#c');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 600;
canvas.style.background = 'lightgray';
ctx.translate(100, 100);

const ORIGIN = { x: 0, y: 0 };

const tri = [
  { x: 132, y: 130 },
  { x: 200, y: 200 },
  { x: 80, y: 180 }
];

const quad = [
  { x: 200, y: 120 },
  { x: 240, y: 140 },
  { x: 220, y: 200 },
  { x: 140, y: 140 }
];

const drawLine = (p1, p2) => {
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
};

const drawPoly = points => {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.lineTo(points[0].x, points[0].y);
  ctx.stroke();
};

drawPoly(quad);
drawPoly(tri);

const dotProduct = (pointA, pointB) => {
  return pointA.x * pointB.x + pointA.y * pointB.y;
};

const getAxis = (pointA, pointB) => (
  {
    x: -(pointB.y - pointA.y),
    y: pointB.x - pointA.x
  }
);

const getProjections = (poly, axis) =>
  poly.map(point => dotProduct(axis, point));
	
const collides = (polyA, polyB) => {
  for (const poly of [ polyA, polyB ]) {
    for (const [i, point] of poly.entries()) {
      const axis = getAxis(point, poly[i + 1] || poly[0]);
      ctx.strokeStyle = 'green';
      drawLine(ORIGIN, axis);
      const projA = getProjections(polyA, axis);
      const projB = getProjections(polyB, axis);

      const minA = Math.min(...projA);
      const maxA = Math.max(...projA);
      const minB = Math.min(...projB);
      const maxB = Math.max(...projB);

      const overlap =
        (minA > minB && minA < maxB) ||
        (maxA > minB && maxA < maxB) ||
        (minB > minA && minB < maxA) ||
        (maxB > minA && maxB < maxA);

      if (!overlap) {
        return false;
      }
    }
  }
  return true;
};

console.log('COLLIDES', collides(tri, quad));
