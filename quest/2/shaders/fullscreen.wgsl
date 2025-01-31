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

// A structure to store the vertex outpupt
struct VertexOutput {
  @builtin(position) pos: vec4f, // a builtin position to store the output screen position
  @location(0) texCoords: vec2f  // texture coordinates, return to the location(0) of the fragment shader
};

@vertex
fn vertexMain(@builtin(vertex_index) vIdx: u32) -> VertexOutput {
  // a fixed array to describe the quad geometry - two triangles
  var pos = array<vec2f, 6>(
    vec2f(-1, -1), vec2f(1, -1), vec2f(-1, 1),
    vec2f(1, -1), vec2f(1, 1), vec2f(-1, 1)
  );
  // a fixed array to describe the corresponding texture coordinates for the two triangles
  var texCoords = array<vec2f, 6>(
    vec2f(0, 1), vec2f(1, 1), vec2f(0, 0),
    vec2f(1, 1), vec2f(1, 0), vec2f(0, 0)
  );
  // we use the vertex index to get the desired vertex and texture coordinates from the fixed arrays in this shader
  var out: VertexOutput;
  out.pos = vec4f(pos[vIdx], 0, 1);
  out.texCoords = texCoords[vIdx];
  return out;
}

@group(0) @binding(0) var inTexture: texture_2d<f32>; // a texture, a.k.a. an image
@group(0) @binding(1) var inSampler: sampler;         // a texture sampler, which handle value interpolation for us

@fragment
fn fragmentMain(@location(0) texCoords: vec2f) -> @location(0) vec4f {
  return textureSample(inTexture, inSampler, texCoords); // use the sampler to sample the color from inTexture at location texCoords
}
