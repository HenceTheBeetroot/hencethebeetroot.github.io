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

@group(0) @binding(0) var<storage> dataIn: array<vec2f>;
@group(0) @binding(1) var<storage, read_write> dataOut: array<vec2f>;
@group(1) @binding(0) var<storage> offset: array<u32>;

@vertex // this computes the scene coordinate of each input vertex
fn vertexMain(@builtin(vertex_index) vertex_id: u32) -> @builtin(position) vec4f {
  return vec4f(dataIn[vertex_id + offset[0]], 0, 1); // (pos, Z, W) = (X, Y, Z, W)
}

@fragment // this computes the color of each pixel
fn fragmentMain() -> @location(0) vec4f {
  return vec4f(238.f/255, 118.f/255, 35.f/255, 1); // (R, G, B, A)
}

@compute @workgroup_size(256)
fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
  let pointsOffset = 548865u;

  let idx = global_id.x + offset[0];
  var v = dataIn[idx];

  dataOut[idx] = v;
}