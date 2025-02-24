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

// TODO 3: Define a struct to store a particle
struct Particle {
  position: vec2f,
  velocity: vec2f
}

struct Random {
  value: f32
}

// TODO 4: Write the bind group spells here using array<Particle>
// name the binded variables particlesIn and particlesOut
@group(0) @binding(0) var<storage> particlesIn: array<Particle>;
@group(0) @binding(1) var<storage, read_write> particlesOut: array<Particle>;
@group(1) @binding(0) var<storage> time: f32;

@vertex
fn vertexMain(@builtin(instance_index) idx: u32, @builtin(vertex_index) vIdx: u32) -> @builtin(position) vec4f {
  // TODO 5: Revise the vertex shader to draw circle to visualize the particles
  let particle = particlesIn[idx].position;
  let size = 0.0125;
  let pi = 3.14159265;
  let theta = 2. * pi / 8 * f32(vIdx);
  let x = cos(theta) * size;
  let y = sin(theta) * size;
  return vec4f(vec2f(x + particle[0], y + particle[1]), 0, 1);
}

@fragment
fn fragmentMain() -> @location(0) vec4f {
  return vec4f(238.f/255, 118.f/255, 35.f/255, 1); // (R, G, B, A)
}

@compute @workgroup_size(256)
fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
  // Revise the compute shader to update the particles using the velocity
  let idx = global_id.x;
  
  if (idx < arrayLength(&particlesIn)) {
    particlesOut[idx] = particlesIn[idx];
    particlesOut[idx].position[0] += particlesOut[idx].velocity[0];
    particlesOut[idx].position[1] += particlesOut[idx].velocity[1];

    // Add boundary checking and respawn the particle when it is offscreen
    //if (particlesOut[idx].position[0] > 1 || particlesOut[idx].position[0] < -1) {
    //  particlesOut[idx].position[0] = (particlesOut[idx].position[0] + 1) % 2 - 1;
    //}
    //if (particlesOut[idx].position[1] > 1 || particlesOut[idx].position[1] < -1) {
    //  particlesOut[idx].position[1] = (particlesOut[idx].position[1] + 1) % 2 - 1;
    //}
    if (particlesOut[idx].position[0] > 1 || particlesOut[idx].position[0] < -1 || particlesOut[idx].position[1] > 1 || particlesOut[idx].position[1] < -1) {
      particlesOut[idx].velocity = vec2f(
        rand(),
        0.01
      );
      particlesOut[idx].position = vec2f(0, -1);
    }
  }
}

fn rand() -> f32 {
  return fract(sin(time) * 43758.5453); //FIXME
}