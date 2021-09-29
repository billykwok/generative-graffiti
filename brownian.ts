import type P5 from 'p5';

const LIFE = 512;

type Trail = {
  life: number;
  range: number;
  weight: number;
  color: [number, number, number];
  xy: [number, number][];
};

export class BrownianSketch {
  #p5: P5;
  #trails: Trail[] = [];

  constructor(p5: P5) {
    this.#p5 = p5;
  }

  setup() {
    this.#p5.frameRate(30);
  }

  draw() {
    const { width, height } = this.#p5;
    this.#p5.background(0);

    if (this.#p5.random(0, 100) % 98 <= 1) {
      this.#trails.push({
        life: LIFE * 2,
        range: this.#p5.random(20, 50),
        weight: this.#p5.random(2, 5),
        color: [
          this.#p5.random(128, 255),
          this.#p5.random(128, 255),
          this.#p5.random(128, 255),
        ],
        xy: [
          [
            this.#p5.constrain(
              this.#p5.randomGaussian(width / 2, 100),
              0,
              width
            ),
            this.#p5.constrain(
              this.#p5.randomGaussian(height / 2, 100),
              0,
              height
            ),
          ],
        ],
      });
    }

    let splice = 0;
    this.#trails.forEach((it) => {
      const xy = it.xy;
      if (it.life <= LIFE) {
        xy.shift();
      } else {
        const ref = xy[xy.length - 1];
        xy.push([
          this.#p5.constrain(
            ref[0] + this.#p5.random(-it.range, it.range),
            0,
            width
          ),
          this.#p5.constrain(
            ref[1] + this.#p5.random(-it.range, it.range),
            0,
            height
          ),
        ]);
      }
      if (--it.life <= 0) {
        ++splice;
      }
    });

    for (let j = 0; j < this.#trails.length; ++j) {
      const { life, weight, color, xy } = this.#trails[j];
      for (let i = 1; i < xy.length; ++i) {
        this.#p5.stroke(...color, this.#p5.max(0, life - LIFE) + i);
        this.#p5.strokeWeight(weight);
        this.#p5.line(...xy[i - 1], ...xy[i]);
      }
    }

    this.#trails.splice(0, splice);
  }
}
