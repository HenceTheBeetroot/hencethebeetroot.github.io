struct VertexOut {
    @builtin(position) pixel: vec4f,
    @location(0) color: vec4f
}

// name the binded variables particlesIn and particlesOut
@group(0) @binding(0) var<storage> pixeldata: array<u32>;

@vertex
fn vertexMain(@builtin(instance_index) idx: u32, @builtin(vertex_index) vIdx: u32) -> VertexOut {
  var data = pixeldata[idx];
  // ff ff f f f f
  //  x y  r g b a
  let x = pixeldata[idx] >> 24;       // ff______
  let y = pixeldata[idx] << 8 >> 24;  // __ff____
  let r = pixeldata[idx] << 16 >> 28; // ____f___
  let g = pixeldata[idx] << 20 >> 28; // _____f__
  let b = pixeldata[idx] << 24 >> 28; // ______f_
  let a = pixeldata[idx] << 28 >> 28; // _______f

  var out = VertexOut();

  out.pixel = vec4f(f32(x), f32(y), 1.0, 1.0);
  out.color = vec4f(f32(r), f32(g), f32(b), f32(a));

  return out;
}

@fragment
fn fragmentMain(@location(0) color: vec4f) -> @location(0) vec4f {
  return vec4f(color[0], color[1], color[2], color[3]); // (R, G, B, A)
}