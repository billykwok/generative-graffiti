import type P5 from 'p5';
import type { Socket } from 'socket.io-client';
import { Vector } from 'p5';

const GRAVITATIONAL_CONSTANT = 6.674;
const MAX_LIFESPAN = 10000;
const MAX_COLOR = 1000;

export class ParticleSketch {
  #p5: P5;
  #socket: Socket;
  #origin: Vector;
  #system: ParticleSystem;

  constructor(p5: P5, socket: Socket) {
    this.#p5 = p5;
    this.#socket = socket;
  }

  setup() {
    const { width, height } = this.#p5;
    this.#origin = this.#p5.createVector(width / 2, height / 2);
    this.#system = new ParticleSystem(this.#origin, 667);
    this.#socket.on('particle', (fsr: number, pho: number) => {
      this.#system.addParticle(
        new Particle(
          this.#p5,
          this.#origin,
          pho % 1000,
          fsr / 500,
          this.#p5.createVector(this.#p5.random(200, 400), 0),
          this.#p5.createVector(0, 5),
          this.#p5.createVector(0, 0)
        )
      );
    });
    this.#p5.colorMode(this.#p5.HSB, MAX_COLOR);
    this.#p5.noStroke();
    this.#p5.smooth();
    this.#p5.background(0);
    this.#p5.frameRate(60);
    setInterval(() => {
      this.#system.addParticle(
        new Particle(
          this.#p5,
          this.#origin,
          MAX_COLOR + 1,
          1,
          this.#p5.createVector(this.#p5.random(200, 400), 0),
          this.#p5.createVector(0, this.#p5.random(4, 5)),
          this.#p5.createVector(0, 0)
        )
      );
    }, 10000);
  }

  draw() {
    const { width, height } = this.#p5;
    this.#p5.fill(0, 0, 0, 7);
    this.#p5.rect(0, 0, width, height);
    this.#system.run();
  }
}

class Particle {
  #p5: P5;
  #origin: Vector;
  #hue: number;
  #mass: number;
  #position: Vector;
  #velocity: Vector;
  #acceleration: Vector;
  #gm: number;
  #lifespan = MAX_LIFESPAN;

  constructor(
    p5: P5,
    origin: Vector,
    hue: number,
    mass: number,
    position: Vector,
    velocity: Vector,
    acceleration: Vector
  ) {
    this.#p5 = p5;
    this.#origin = origin;
    this.#hue = hue;
    this.#mass = mass;
    this.#position = position;
    this.#velocity = velocity;
    this.#acceleration = acceleration;
    this.#gm = GRAVITATIONAL_CONSTANT * mass;
  }

  age() {
    return --this.#lifespan;
  }

  update(acceleration: Vector) {
    this.#acceleration = acceleration;
    this.#velocity.add(this.#acceleration).limit(5);
    this.#position.add(this.#velocity);
    const { width, height } = this.#p5;
    if (
      this.#position.x > width ||
      this.#position.x < 0 ||
      this.#position.y > height ||
      this.#position.y < 0
    ) {
      this.#position.add(Vector.sub(this.#origin, this.#position).mult(2));
    }
  }

  display() {
    this.#p5.fill(
      ...((this.#hue > MAX_COLOR
        ? [
            0,
            MAX_COLOR * 0.1,
            MAX_COLOR * 0.1,
            (this.#lifespan * MAX_COLOR) / MAX_LIFESPAN,
          ]
        : [
            this.#hue,
            MAX_COLOR,
            MAX_COLOR,
            (this.#lifespan * MAX_COLOR) / MAX_LIFESPAN,
          ]) as [number, number, number, number])
    );
    this.#p5.ellipse(this.#position.x, this.#position.y, 8, 8);
  }

  getHue() {
    return this.#hue;
  }

  getMass() {
    return this.#mass;
  }

  getGM() {
    return this.#gm;
  }

  getPosition() {
    return this.#position;
  }
}

class ParticleSystem {
  #origin: Vector;
  #gm: number;
  #particles: Particle[] = [];

  constructor(origin: Vector, mass: number) {
    this.#origin = origin;
    this.#gm = GRAVITATIONAL_CONSTANT * mass;
  }

  addParticle(particle: Particle) {
    this.#particles.push(particle);
  }

  run() {
    for (let i = this.#particles.length - 1; i >= 0; --i) {
      const particle = this.#particles[i];
      const position = particle.getPosition();
      const d = Vector.sub(this.#origin, position);
      const rSq = d.magSq();

      if (particle.age() < 0 || rSq <= 9) {
        this.#particles.splice(i, 1);
      } else {
        const acc = d.normalize().mult(this.#gm / rSq);

        for (let j = this.#particles.length - 1; j >= 0; --j) {
          if (j != i) {
            const peer = this.#particles[j];
            const d = Vector.sub(peer.getPosition(), position);
            const rSq = d.magSq();
            acc.add(d.normalize().mult(peer.getGM() / rSq));
          }
        }

        particle.update(acc);
      }
    }

    for (const particle of this.#particles) {
      particle.display();
    }
  }
}
