<template>
  <div>
    <div>
      <canvas width="1920" height="1080" ref="main_canvas" id="main_canvas" />
    </div>
    <div class="container">
      <div class="item">
        <label for="num_boids">number of boids</label>
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
      </div>
      <div class="item">
        <label for="field_of_view_deg">field of view (degrees)</label>
        <input
          id="field_of_view_deg"
          type="range"
          min="1"
          max="180"
          step="1"
          class="slider"
          v-model="field_of_view_deg"
        />
        <p>{{ field_of_view_deg }}</p>
      </div>
      <div class="item">
        <label for="vision_dist">vision distance</label>
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
      </div>
      <div class="item">
        <label for="collision_dist">collision distance</label>
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
      </div>
      <div class="item">
        <label for="collision_avoidance_strength"
          >collision avoidance strength</label
        >
        <input
          id="collision_avoidance_strength"
          type="range"
          min="0"
          max=".05"
          step=".001"
          class="slider"
          v-model="collision_avoidance_strength"
        />
        <p>{{ collision_avoidance_strength }}</p>
      </div>
      <div class="item">
        <label for="velocity_align_strength">velocity align strength</label>
        <input
          id="velocity_align_strength"
          type="range"
          min="0"
          max=".05"
          step=".001"
          class="slider"
          v-model="velocity_align_strength"
        />
        <p>{{ velocity_align_strength }}</p>
      </div>
      <div class="item">
        <label for="center_of_mass_align_strength"
          >center of mass align strength</label
        >
        <input
          id="center_of_mass_align_strength"
          type="range"
          min="0"
          max=".05"
          step=".001"
          class="slider"
          v-model="center_of_mass_align_strength"
        />
        <p>{{ center_of_mass_align_strength }}</p>
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
      speed: 0.4,
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
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.restore();
    },
    drawCircle(center, radius, color) {
      this.context.beginPath();
      this.context.arc(center.x, center.y, radius, 0, 2 * Math.PI);
      this.context.strokeStyle = color;
      this.context.stroke();
    },
    drawLine(p1, p2) {
      this.context.beginPath();
      this.context.moveTo(p1.x, p1.y);
      this.context.lineTo(p2.x, p2.y);
      this.context.strokeStyle = "#ff0000";
      this.context.stroke();
    },
    drawPrimative({ verts }) {
      this.context.beginPath();
      this.context.moveTo(verts[0].x, verts[0].y);
      for (let i = 1; i < verts.length; ++i) {
        this.context.lineTo(verts[i].x, verts[i].y);
      }
      this.context.fill();
    },
    update(dt) {
      for(const boid of this.boids) {
        /* --------------- */
        /* update velocity */
        /* --------------- */

        // Collision Detection
        const seen = [];
        if (boid.debug) boid.seen = [];
        for(const other of this.boids){
          if (boid == other) continue;
          const x = boid.pos.x - other.pos.x;
          const y = boid.pos.y - other.pos.y;
          const d = Math.sqrt(x * x + y * y);

          if (d > this.vision_dist) continue;

          const other_v = {
            x: other.pos.x - boid.pos.x,
            y: other.pos.y - boid.pos.y,
          };
          const th = maths.angle_between(other_v, boid.pos);

          // other boid was seen
          if (th > this.field_of_view) continue;
          if (boid.debug) boid.seen.push(other.pos);

          seen.push({ other, other_v, th, d });
        }

        // Collision Avoidance
        for(const { other_v, th, d } of seen){
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
          for(const {other} of seen){
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
      for(const boid of this.boids){
        const th =
          Math.atan(boid.vel.y / boid.vel.x) - (boid.vel.x < 0 ? Math.PI : 0);
        this.drawPrimative(
          graphics.translatePrimitive(
            graphics.rotatePrimitive(
              graphics.scalePrimitive(this.triangle, { x: 10, y: 10 }),
              th
            ),
            boid.pos
          )
        );
        if (boid.debug) {
          this.drawCircle(boid.pos, this.vision_dist, "#ff0000");
          this.drawCircle(boid.pos, this.collision_dist, "#0000ff");
          this.drawCircle(boid.com, 10, "#ff0000");
          for(const pos of boid.seen){
            this.drawLine(pos, boid.pos);
          }
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
        for (let i = 0; i < more; ++i) {
          this.boids.push({
            pos: { x: 100, y: 100 },
            vel: maths.random_vector(),
            debug: false,
          });
        }
      }
      if (this.boids.length > this.num_boids) {
        this.boids.splice(this.num_boids - 1);
      }
      requestAnimationFrame(this.loop);
    },
  },
  created() {
    for (let i = 0; i < this.num_boids; ++i) {
      this.boids.push({
        pos: { x: 100, y: 100 },
        vel: maths.random_vector(),
        debug: false,
      });
    }
    this.boids[0].debug = true;
  },
  mounted() {
    this.canvas = this.$refs.main_canvas;
    this.context = this.$refs.main_canvas.getContext("2d");
    requestAnimationFrame(this.loop);
  },
};
</script>

<style lang="css" scoped>
canvas {
  width: 100%;
  height: auto;
}
p {
  display: inline;
}
.container {
  display: flex;
  align-items: center;
  align-content: stretch;
  flex-wrap: wrap;
}
.item {
  flex-basis: 100%;
}
label,
p {
  margin: 1em;
}
</style>
