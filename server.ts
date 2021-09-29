import events from 'events';
import express from 'express';
import serveStatic from 'serve-static';
import { Board, Sensor } from 'johnny-five';
import { Server } from 'socket.io';
import { createServer } from 'http';

import { OUTPUT_PATH, PORT, PUBLIC_PATH } from './app.config';

const enum Mode {
  STANDBY,
  ACTIVE,
}

const state = { mode: Mode.STANDBY, pho1: 0, pho2: 0, fsr: 1024 };
const emitter = new events.EventEmitter();

new Board({ repl: false }).on('ready', () => {
  const pho1 = new Sensor({ pin: 'A0' });
  const pho2 = new Sensor({ pin: 'A1' });
  const fsr = new Sensor({ pin: 'A2' });
  pho1.on('change', () => (state.pho1 = pho1.value));
  pho2.on('change', () => (state.pho2 = pho2.value));
  fsr.on('change', () => {
    if (fsr.value <= 1000 && state.fsr > 1000) {
      state.mode = Mode.ACTIVE;
    } else if (state.fsr <= 1000 && fsr.value > 1000) {
      state.mode = Mode.STANDBY;
      emitter.emit(
        'particle',
        1000 - state.fsr,
        Math.min(1000, ((state.pho1 + state.pho2 - 1200) * 10) / 2)
      );
    }
    state.fsr = fsr.value;
  });
});

const app = express();

app.use(PUBLIC_PATH, serveStatic(OUTPUT_PATH));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: ['http://localhost:8080'], credentials: true },
});

io.on('connection', (socket) => {
  console.log(socket.id);
  emitter.addListener('particle', (...args) =>
    socket.volatile.emit('particle', ...args)
  );
});

httpServer.listen(PORT, () =>
  console.log(`Listening at https://localhost:${PORT}`)
);
