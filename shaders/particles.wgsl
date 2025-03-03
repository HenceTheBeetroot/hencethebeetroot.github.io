/* 
 * Copyright (c) 2025 SingChun LEE @ Bucknell University. CC BY-NC 4.0.
 * 
 * This code is provided mainly for educational purposes at Bucknell University.
 *
 * This code is licensed under the Creative Commons Attribution-NonCommerical 4.0
 * International License. To view a copy of the license, visit 
 *   https://creativecommons.org/licenses/by-nc/4.0/
 * or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
 *
 * You are free to:
 *  - Share: copy and redistribute the material in any medium or format.
 *  - Adapt: remix, transform, and build upon the material.
 *
 * Under the following terms:
 *  - Attribution: You must give appropriate credit, provide a link to the license,
 *                 and indicate if changes where made.
 *  - NonCommerical: You may not use the material for commerical purposes.
 *  - No additional restrictions: You may not apply legal terms or technological 
 *                                measures that legally restrict others from doing
 *                                anything the license permits.
 */

struct Particle {
  position: vec2f,
  velocity: vec2f
}
struct Trailer {
  position: vec2f
}

struct Color {
  r: f32,
  g: f32,
  b: f32
}

struct VertexOutput {
  @builtin(position) particle: vec4f,
  @location(0) color: vec3f
}

// name the binded variables particlesIn and particlesOut
@group(0) @binding(0) var<storage> particlesIn: array<Particle>;
@group(0) @binding(1) var<storage, read_write> particlesOut: array<Particle>;
@group(1) @binding(0) var<storage> color: array<Color>;
//@group(2) @binding(0) var<storage> trailersIn: array<Trailer>;
//@group(2) @binding(1) var<storage, read_write> trailersOut: array<Trailer>;
@group(2) @binding(0) var<storage> time: f32;

@vertex
fn vertexMain(@builtin(instance_index) idx: u32, @builtin(vertex_index) vIdx: u32) -> VertexOutput {
  //let vI = vIdx % 16;
  //var particle: vec2f;
  //if (vIdx >= 16) {
  //  particle = particlesIn[idx].position;
  //} else {
  //  particle = trailersIn[3 * idx + (vIdx / 16) - ((vIdx / 16) % 1)].position;
  //}
  var particle = particlesIn[idx].position;
  let size = 0.0125;
  let pi = 3.14159265;
  let theta = 2. * pi / 8. * f32(vIdx);
  let x = cos(theta) * size;
  let y = sin(theta) * size;
  var out: VertexOutput;
  out.particle = vec4f(vec2f(x + particle[0], y + particle[1]), 0, 1);
  out.color = vec3f(color[idx].r, color[idx].g, color[idx].b);

  return out;
}

@fragment
fn fragmentMain(@location(0) color: vec3f) -> @location(0) vec4f {
  return vec4f(color[0], color[1], color[2], 1); // (R, G, B, A)
}

@compute @workgroup_size(256)
fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
  // Revise the compute shader to update the particles using the velocity
  let idx = global_id.x;
  
  if (idx < arrayLength(&particlesIn)) {
    particlesOut[idx] = particlesIn[idx];
    particlesOut[idx].position[0] += particlesOut[idx].velocity[0];
    particlesOut[idx].position[1] += particlesOut[idx].velocity[1];

    //trailersOut[3 * idx + 2].position = trailersOut[3 * idx + 1].position;
    //trailersOut[3 * idx + 1].position = trailersOut[3 * idx + 0].position;
    //trailersOut[3 * idx + 0].position = particlesOut[idx].position;

    // Detect out of bounds
    if (particlesOut[idx].position[0] > 1 || particlesOut[idx].position[0] < -1 || particlesOut[idx].position[1] > 1 || particlesOut[idx].position[1] < -1) {
      // offset particle respawning; if a line hits the top of the screen it'll be broken up
      if (rand(particlesOut[idx].velocity[0]) > 0.975) {
        // Initial velocity
        particlesOut[idx].velocity = vec2f(
          (randBounds(-1, 1, particlesOut[idx].position[0])) * 0.03,
          randBounds(0.01, 0.02, particlesOut[idx].position[1])
        );
        // Reposition particle
        particlesOut[idx].position = vec2f(
          (randBounds(-1, 1, particlesOut[idx].velocity[0])) * 0.3,
          -1
        );
      }
    } else {
      // Update velocity
      particlesOut[idx].velocity = vec2f(
        (particlesOut[idx].velocity[0] - (sign(particlesOut[idx].position[0]) / 400)) * 0.97,
        particlesOut[idx].velocity[1] * 1.01
      );
      // "push" stuck particles
      if (particlesOut[idx].velocity[1] < 0.01) {
        particlesOut[idx].velocity[1] = 0.01;
      }
    }
  }
}

fn rand(off: f32) -> f32 {
  return fract((sin(time) + off) * 43758.5453);
}

fn randBounds(lower: f32, upper: f32, off: f32) -> f32 {
  return (upper - lower) * rand(off) + lower;
}