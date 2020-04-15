<template>
  <div>
    <div class="box">
      <div>
        <canvas width="1920" height="1080" ref="main_canvas" id="main_canvas" />
      </div>
      <p class="right">
        {{ (fps_hist.reduce((a, b) => a + b) / fps_hist.length).toFixed(0) }}
        FPS
      </p>
      <div class="container">
        <label for="num_boids">Number of Boids</label>
        <input
          id="num_boids"
          type="range"
          min="1"
          max="500"
          step="1"
          class="slider"
          v-model="num_boids"
        />
        <p>{{ num_boids }}</p>
        <label for="speed">Boid Speed</label>
        <input
          id="speed"
          type="range"
          min="0"
          max="2"
          step=".01"
          class="slider"
          v-model="speed"
        />
        <p>{{ speed }}</p>
        <label for="size">Boid Size</label>
        <input
          id="size"
          type="range"
          min="1"
          max="50"
          step="1"
          class="slider"
          v-model="boid_size"
        />
        <p>{{ boid_size }}</p>
        <div class="bar" />
        <div class="bar" />
        <div class="bar" />
        <label for="field_of_view_deg">Field of View</label>
        <input
          id="field_of_view_deg"
          type="range"
          min="1"
          max="180"
          step="1"
          class="slider"
          v-model="field_of_view_deg"
        />
        <p>{{ field_of_view_deg }}°</p>
        <label for="vision_dist">Vision Distance</label>
        <input
          id="vision_dist"
          type="range"
          min="0"
          max="500"
          step="1"
          class="slider"
          v-model="vision_dist"
        />
        <p>{{ vision_dist }}</p>
        <label for="collision_dist">Collision Avoidance Distance</label>
        <input
          id="collision_dist"
          type="range"
          min="1"
          max="200"
          step="1"
          class="slider"
          v-model="collision_dist"
        />
        <p>{{ collision_dist }}</p>
        <label for="draw_debug">Draw Vision Lines</label>
        <input id="draw_debug" type="checkbox" v-model="draw_debug" />
        <p></p>
        <div class="bar" />
        <div class="bar" />
        <div class="bar" />
        <label for="collision_avoidance_strength"
          >Collision Avoidance Strength</label
        >
        <input
          id="collision_avoidance_strength"
          type="range"
          min="0"
          max=".02"
          step=".001"
          class="slider"
          v-model="collision_avoidance_strength"
        />
        <p>{{ collision_avoidance_strength }}</p>
        <label for="velocity_align_strength">Velocity Alignment Strength</label>
        <input
          id="velocity_align_strength"
          type="range"
          min="0"
          max=".02"
          step=".001"
          class="slider"
          v-model="velocity_align_strength"
        />
        <p>{{ velocity_align_strength }}</p>
        <label for="center_of_mass_align_strength">
          Center of Mass Alignment Strength</label
        >
        <input
          id="center_of_mass_align_strength"
          type="range"
          min="0"
          max=".02"
          step=".001"
          class="slider"
          v-model="center_of_mass_align_strength"
        />
        <p>{{ center_of_mass_align_strength }}</p>
      </div>
      <div class="bar m1em" />
      <div>
        <p class="left">
          <a href="https://en.wikipedia.org/wiki/Boids">Boids</a> are an
          artificial life program, developed by Craig Reynolds, which simulates
          the flocking behaviour of birds. The name "boid" corresponds to a
          shortened version of "bird-oid object", which refers to a bird-like
          object. Boids are an example of emergent behavior; that is, the
          complexity of Boids arises from the interaction of individual agents
          (the boids, in this case) adhering to a set of simple rules. The rules
          applied in the simplest Boids world are as follows:
        </p>
        <ul>
          <li>
            separation: steer to avoid crowding local flockmates
          </li>
          <li>
            alignment: steer towards the average heading of local flockmates
          </li>
          <li>
            cohesion: steer to move towards the average position (center of
            mass) of local flockmates
          </li>
        </ul>
        <p class="left">
          The blue ring shows how close a flock mate has to get before collision
          avoidance begins.
        </p>
        <p class="left">
          The green region shows the field of view combined with the vision
          distance. Any flock member inside this reigon will be used for
          velocity alignment and center of mass alignment calculations. Red
          lines are also drawn to these flock members.
        </p>
        <p class="left">The red dot is the center of mass.</p>
      </div>
    </div>
  </div>
</template>

<script>
import graphics from "@/scripts/graphics";
import maths from "@/scripts/maths";
export default {
  name: "Boids",
  data() {
    return {
      draw_debug: true,
      id: 0,
      fps_hist: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      prevTime: performance.now(),
      canvas: null,
      context: null,
      triangle: {
        center: { x: 0, y: 0 },
        verts: [
          { x: 1, y: 0 },
          { x: -0.866, y: 0.5 },
          { x: -0.866, y: -0.5 },
        ],
      },
      boids: [],
      boid_size: 10,
      speed: 0.45,
      num_boids: 100,
      vision_dist: 100,
      field_of_view_deg: 120,
      collision_dist: 50,
      collision_avoidance_strength: 0.005,
      velocity_align_strength: 0.01,
      center_of_mass_align_strength: 0.001,
    };
  },
  computed: {
    field_of_view() {
      return (this.field_of_view_deg * Math.PI) / 180;
    },
  },
  methods: {
    clear() {
      this.context.save();
      this.context.setTransform(1, 0, 0, 1, 0, 0);
      // this.context.fillStyle = "#ffecc7";
      this.context.fillStyle = "#cde2e2";
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.restore();
    },
    fillCircle(center, radius, color) {
      this.context.beginPath();
      this.context.arc(center.x, center.y, radius, 0, 2 * Math.PI);
      this.context.fillStyle = color;
      this.context.fill();
    },
    drawCircle(center, radius, color) {
      this.context.beginPath();
      this.context.arc(center.x, center.y, radius, 0, 2 * Math.PI);
      this.context.lineWidth = 4;
      this.context.strokeStyle = color;
      this.context.stroke();
    },
    drawFOV(center, radius, forward, angle, color) {
      const start =
        Math.atan(forward.y / forward.x) - (forward.x < 0 ? Math.PI : 0);
      this.context.beginPath();
      this.context.moveTo(
        center.x + forward.x * radius,
        center.y + forward.y * radius
      );
      this.context.arc(center.x, center.y, radius, start, start + angle, false);
      this.context.lineTo(center.x, center.y);
      this.context.moveTo(
        center.x + forward.x * radius,
        center.y + forward.y * radius
      );
      this.context.arc(center.x, center.y, radius, start, start - angle, true);
      this.context.lineTo(center.x, center.y);
      this.context.lineWidth = 4;
      this.context.strokeStyle = color;
      this.context.stroke();
    },
    drawLine(p1, p2) {
      this.context.beginPath();
      this.context.moveTo(p1.x, p1.y);
      this.context.lineTo(p2.x, p2.y);
      this.context.strokeStyle = "#ff0000";
      this.context.lineWidth = 2;
      this.context.stroke();
    },
    drawPrimative({ verts }, color) {
      this.context.beginPath();
      this.context.moveTo(verts[0].x, verts[0].y);
      for (let i = 1; i < verts.length; ++i) {
        this.context.lineTo(verts[i].x, verts[i].y);
      }
      this.context.fillStyle = color;
      this.context.fill();
    },
    update(dt) {
      this.fps_hist.shift();
      this.fps_hist.push((1 / dt) * 1000);
      for (const boid of this.boids) {
        /* --------------- */
        /* update velocity */
        /* --------------- */

        // Collision Detection
        const seen = [];
        if (boid.debug) boid.seen = [];
        for (const other of this.boids) {
          if (boid.id == other.id) continue;
          const x = boid.pos.x - other.pos.x;
          const y = boid.pos.y - other.pos.y;
          const d = Math.sqrt(x * x + y * y);

          if (d > this.vision_dist) continue;

          const other_v = {
            x: other.pos.x - boid.pos.x,
            y: other.pos.y - boid.pos.y,
          };
          const th = maths.angle_between(other_v, boid.vel);

          // other boid was seen
          if (th > this.field_of_view) continue;
          // if (boid.debug) boid.seen.push({ x: other.pos.x, y: other.pos.y });
          if (boid.debug) boid.seen.push(other.pos);

          seen.push({ other, other_v, th, d });
        }

        // Collision Avoidance
        for (const { other_v, th, d } of seen) {
          if (d > this.collision_dist) continue;

          if (maths.cross_product(other_v, boid.vel) < 0) {
            boid.vel = maths.rotate_vector(
              boid.vel,
              -th * dt * this.collision_avoidance_strength
            );
          } else {
            boid.vel = maths.rotate_vector(
              boid.vel,
              th * dt * this.collision_avoidance_strength
            );
          }
        }

        // Velocity Alignment
        const com = { x: 0, y: 0 };
        if (seen.length > 0) {
          const vel_avg = { x: 0, y: 0 };
          for (const { other } of seen) {
            vel_avg.x += other.vel.x;
            vel_avg.y += other.vel.y;
            com.x += other.pos.x;
            com.y += other.pos.y;
          }

          vel_avg.x /= seen.length;
          vel_avg.y /= seen.length;
          com.x /= seen.length;
          com.y /= seen.length;

          const th = maths.angle_between(vel_avg, boid.vel);
          if (maths.cross_product(vel_avg, boid.vel) > 0) {
            boid.vel = maths.rotate_vector(
              boid.vel,
              -th * dt * this.velocity_align_strength
            );
          } else {
            boid.vel = maths.rotate_vector(
              boid.vel,
              th * dt * this.velocity_align_strength
            );
          }
        }
        if (boid.debug) boid.com = com;

        // Center of Mass Alignment
        if (seen.length > 0) {
          const com_v = { x: com.x - boid.pos.x, y: com.y - boid.pos.y };
          const th = maths.angle_between(com_v, boid.vel);
          if (maths.cross_product(com_v, boid.vel) > 0) {
            boid.vel = maths.rotate_vector(
              boid.vel,
              -th * dt * this.center_of_mass_align_strength
            );
          } else {
            boid.vel = maths.rotate_vector(
              boid.vel,
              th * dt * this.center_of_mass_align_strength
            );
          }
        }

        /* --------------- */
        /* update position */
        /* --------------- */
        boid.pos = {
          x: boid.pos.x + boid.vel.x * dt * this.speed,
          y: boid.pos.y + boid.vel.y * dt * this.speed,
        };

        if (boid.pos.x > this.canvas.width) boid.pos = { x: 0, y: boid.pos.y };
        if (boid.pos.x < 0) boid.pos = { x: this.canvas.width, y: boid.pos.y };
        if (boid.pos.y > this.canvas.height) boid.pos = { x: boid.pos.x, y: 0 };
        if (boid.pos.y < 0) boid.pos = { x: boid.pos.x, y: this.canvas.height };
      }
    },
    render() {
      this.clear();
      for (const boid of this.boids) {
        const th =
          Math.atan(boid.vel.y / boid.vel.x) - (boid.vel.x < 0 ? Math.PI : 0);
        this.drawPrimative(
          graphics.translatePrimitive(
            graphics.rotatePrimitive(
              graphics.scalePrimitive(this.triangle, {
                x: this.boid_size,
                y: this.boid_size,
              }),
              th
            ),
            boid.pos
          ),
          boid.color
        );
      }
      if (this.boids[0].debug && this.draw_debug) {
        const boid = this.boids[0];
        // this.drawCircle(boid.pos, this.vision_dist, "#ff0000");
        this.drawCircle(boid.pos, this.collision_dist, "#0000ff");
        if (boid.seen.length > 0) this.fillCircle(boid.com, 7, "#ff0000");
        if (boid.seen.length > 0) this.drawCircle(boid.com, 7, "#000");
        this.drawFOV(
          boid.pos,
          this.vision_dist,
          boid.vel,
          this.field_of_view,
          "#1f823f"
        );
        for (const pos of boid.seen) {
          const x = pos.x - boid.pos.x;
          const y = pos.y - boid.pos.y;
          const d = Math.sqrt(x * x + y * y);
          if (d < this.vision_dist) this.drawLine(pos, boid.pos);
        }
      }
    },
    loop(time) {
      const dt = time - this.prevTime;
      this.prevTime = time;
      this.update(dt);
      this.render();
      if (this.boids.length < this.num_boids) {
        const more = this.num_boids - this.boids.length;
        const cs = maths.linear_spaced_array(100, 255, more);
        for (let i = 0; i < more; ++i) {
          this.boids.push({
            pos: { x: 100, y: 100 },
            vel: maths.random_vector(),
            debug: false,
            color: `rgb(0,0,${cs[i]})`,
            id: this.id++,
          });
        }
      }
      if (this.boids.length > this.num_boids) {
        this.boids.splice(this.num_boids);
      }
      requestAnimationFrame(this.loop);
    },
  },
  created() {
    const cs = maths.linear_spaced_array(100, 255, this.num_boids);
    for (let i = 0; i < this.num_boids; ++i) {
      this.boids.push({
        pos: { x: 100, y: 100 },
        vel: maths.random_vector(),
        debug: false,
        color: `rgb(0,0,${cs[i]})`,
        id: this.id++,
      });
    }
    this.boids[0].debug = true;
  },
  mounted() {
    this.canvas = this.$refs.main_canvas;
    this.context = this.$refs.main_canvas.getContext("2d", { alpha: false });
    requestAnimationFrame(this.loop);
  },
};
</script>

<style lang="css" scoped>
.container {
  display: grid;
  grid-template-columns: max-content auto 12%;
  grid-gap: 5px;
  align-items: center;
  background: #eee;
  border-radius: 10px;
  padding: 10px;
}
.container > label {
  text-align: right;
}
.container > p {
  text-align: left;
}
label {
  margin-right: 1em;
}
p {
  margin-top: 0px;
  margin-bottom: 0px;
  margin-left: 1em;
}
.slider {
  -webkit-appearance: none;
  height: 5px;
  border-radius: 10px;
  background: #d3d3d3;
  outline: none;
  opacity: 0.7;
  -webkit-transition: 0.2s;
  transition: opacity 0.2s;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 15px;
  border-radius: 20%;
  background: #577399;
  cursor: pointer;
}
.slider::-moz-range-thumb {
  width: 10px;
  height: 15px;
  border-radius: 20%;
  background: #577399;
  cursor: pointer;
}
.slider:hover {
  opacity: 1;
}
.box {
  max-width: 1000px;
  margin: 0 auto;
}
.bar {
  background: darkgray;
  height: 2px;
}
canvas {
  max-width: 100%;
  height: auto;
}
.right {
  text-align: right;
}
.left {
  text-align: left;
}
ul {
  text-align: left;
}
.m1em {
  margin: 1em;
}
</style>
