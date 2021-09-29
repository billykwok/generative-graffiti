import 'normalize.css';

import './style.css';

import p5 from 'p5';
import { io } from 'socket.io-client';

// import { BrownianSketch } from './brownian';
import { PORT } from './app.config';
import { ParticleSketch } from './particle';

const socket = io(`http://localhost:${PORT}`);

socket
  .on('connect', () => {
    console.log(`Connected to ${socket.id}`);
  })
  .on('disconnect', () => {
    console.log(`Disconnected from ${socket.id}`);
  });

new p5((s: p5) => {
  const sketch = new ParticleSketch(s, socket);
  s.setup = () => {
    const { windowWidth, windowHeight } = s;
    s.createCanvas(windowWidth, windowHeight);
    sketch.setup();
  };
  s.draw = () => {
    sketch.draw();
  };

  s.windowResized = () => {
    const { windowWidth, windowHeight } = s;
    s.resizeCanvas(windowWidth, windowHeight);
  };
}, document.body);
