/* eslint-disable no-extra-boolean-cast */
/* eslint-disable no-undef */
// @ts-nocheck
/* eslint-disable no-unused-vars */
let w, m, c, C, W, H, HW, HH, r, diameter;

let a = function () {
  document
    .getElementsByTagName("body")[0]
    .appendChild(document.createElement("canvas"));
  w = window;
  m = Math;
  c = document.getElementsByTagName("canvas")[0];
  c.style.background = 'black';
  C = c.getContext("2d");
};

let b = function () {
  W = c.width = w.innerWidth;
  H = c.height = w.innerHeight;
  HW = W / 2;
  HH = H / 2;
  diameter = 20;
};

let f = function (t) {
  t /= 3000;
  C.clearRect(0, 0, W, H);
  C.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) {
    if (k === 0) C.fillStyle = '#FF0000';
    if (k === 1) C.fillStyle = '#00FF00';
    if (k === 2) C.fillStyle = '#0000FF';
    for (i = 0; i < H; i += diameter) {
      for (j = 0; j < W / 2; j += diameter) {
        let index = i * W + j;
        C.globalAlpha = m.tan(index * index - t);
        C.fillRect(
          m.tan(i * j - m.sin(index + k / 100) + t) * j + HW - diameter / 2,
          i,
          m.tan(index + i / j + t + k / 100) / 2 * diameter / 2,
          m.tan(index * index - t) * diameter / 2
        );
      }
    }
  }
  r = requestAnimationFrame(f);
};

window.onload = function () {
  a();
  b();
  f();
  w.onresize = function () {
    cancelAnimationFrame(r);
    b();
    f();
  };
};
