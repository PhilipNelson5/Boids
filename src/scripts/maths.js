function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function random_vector() {
  const x = getRandom(-1, 1);
  const y = getRandom(-1, 1);
  const m = Math.sqrt(x * x + y * y);
  return { x: x / m, y: y / m };
}

function angle_between(v1, v2) {
  const m1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const m2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  const result = Math.acos((v1.x * v2.x + v1.y * v2.y) / (m1 * m2));
  if (Number.isNaN(result)) return 0;
  return result;
}

function cross_product(v1, v2) {
  return v1.x * v2.y - v1.y * v2.x;
}

function rotate_vector(v, th) {
  const sin_th = Math.sin(th);
  const cos_th = Math.cos(th);
  return { x: v.x * cos_th - v.y * sin_th, y: v.x * sin_th + v.y * cos_th };
}

export default {
  random_vector,
  angle_between,
  cross_product,
  rotate_vector,
};
