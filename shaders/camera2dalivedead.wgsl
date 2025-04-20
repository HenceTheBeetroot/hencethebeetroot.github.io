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

// struct to store a multi vector
struct MultiVector {
  s: f32,
  exey: f32,
  eoex: f32,
  eoey: f32
};

// struct to store 2D PGA pose
struct Pose {
  motor: MultiVector,
  scale: vec2f
};

@group(0) @binding(0) var<uniform> pose: Pose; // a uniform buffer describing the object pose

fn geometricProduct(a: MultiVector, b: MultiVector) -> MultiVector {
  // Note, both points and motors are using scalar (1), exey, eoex, eoey
  // We don't need a full geometric product (all other coefficients are zeros)
  // ref: https://geometricalgebratutorial.com/pga/
  // The geometric product rules are:
  //   1. eoeo = 0, exex = 1 and eyey = 1
  //   2. eoex + exeo = 0, eoey + eyeo = 0 exey + eyex = 0
  // Then, we have the below product table
  // ss    = scalar , sexey                        = exey    , seoex                                  = eoex  , seoey                        = eoey
  // exeys = exey   , exeyexey = -eyexexey = -eyey = -scalar , exeyeoex = -exeyexeo = eyexexeo = eyeo = -eoey , exeyeoey = -exeoeyey = -exeo = eoex
  // eoexs = eoex   , eoexexey                     = eoey    , eoexeoex = -exeoeoex                   = 0     , eoexeoey = -exeoeoey         = 0
  // eoeys = eoey   , eoeyexey = -eoexeyey         = -eoex   , eoeyeoex = -eyeoeoex                   = 0     , eoeyeoey = -eyeoeoey         = 0
  // i.e. group by terms, when we multiple two multivectors, the coefficients of each term are:
  // scalar term: a.s * b.s - a.exey * b.exey
  // exey term: a.s * b.exey + a.exey * b.s
  // eoex term: a.s * b.eoex + a.exey * b.eoey + a.eoex * b.s - a.eoey * b.exey
  // eoey term: a.s * b.eoey - a.exey * b.eoex + a.eoex * b.exey + a.eoey * b.s
  return MultiVector(
    a.s * b.s - a.exey * b.exey , // scalar
    a.s * b.exey + a.exey * b.s , // exey
    a.s * b.eoex + a.exey * b.eoey + a.eoex * b.s - a.eoey * b.exey, // eoex
    a.s * b.eoey - a.exey * b.eoex + a.eoex * b.exey + a.eoey * b.s  // eoey
  );
}
fn reverse(a: MultiVector) -> MultiVector {
  // The reverse is the reverse order of the basis elements
  // e.g. the reverse of exey is eyex = -exey
  //      the reverse of eoex is exeo = -exeo
  //      the reverse of eoey is eyeo = -eyeo
  //      the reverse of a scalar is the scalar
  // So, for an input a as an array storing the coefficients of [s, exey, eoex, eoey],
  // Its reverse is [s, -exey, -eoex, -eoey].
  return MultiVector( a.s, -a.exey, -a.eoex, -a.eoey );
}

fn applyMotor(p: MultiVector, m: MultiVector) -> MultiVector {
  // To apply a motor to a point, we use the sandwich operation
  // The formula is m * p * reverse of m
  return geometricProduct(m, geometricProduct(p, reverse(m)));
}

fn createPoint(p: vec2f) -> MultiVector {
  // A point is given by exey + x eyeo + y eoex
  return MultiVector(0, 1, p.y, -p.x);
}

fn extractPoint(p: MultiVector) -> vec2f {
  // to extract the 2d pont from a exey + b eyeo + c eoex
  // we have x = -b/a and y = c/a
  return vec2f(-p.eoey / p.exey, p.eoex / p.exey);
}

fn applyMotorToPoint(p: vec2f, m: MultiVector) -> vec2f {
  let new_p = applyMotor(createPoint(p), m);
  return extractPoint(new_p);
}

fn on(cell: u32, neighbors: u32) -> u32 {
  return 1u;
}

fn preserve(cell: u32, neighbors: u32) -> u32 {
  return cell;
}

fn blink(cell: u32, neighbors: u32) -> u32 {
  return 1u - cell;
}

fn basic(cell: u32, neighbors: u32) -> u32 {
  if ((cell + neighbors) % 2 == 1) {
    return 1u;
  }
  return 0u;
}

fn conway(cell: u32, neighbors: u32) -> u32 {
  if (cell == 0 && neighbors == 3) {
    return 1u;
  }
  else if (cell == 1 && (neighbors < 2 || 3 < neighbors)) {
    return 0u;
  }
  return cell;
}

struct Data {
  n: vec2f,
  writeCell: vec2f,
  paused: f32
}

@group(0) @binding(0) var<uniform> camerapose: Pose;
@group(0) @binding(1) var<storage> cellStatusIn: array<u32>;
@group(0) @binding(2) var<storage, read_write> cellStatusOut: array<u32>;
@group(0) @binding(3) var<uniform> data: Data;

struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0) cellStatus: f32 // pass the cell status
};

@vertex // this compute the scene coordinate of each input vertex
fn vertexMain(@location(0) pos: vec2f, @builtin(instance_index) idx: u32) -> VertexOutput {
  let nx = data.n.x;
  let ny = data.n.y;
  let u = idx % u32(nx); // we are expecting x/y, so modulo x to get the x index
  let v = idx / u32(nx); // divide by x to get the y index
  let uv = vec2f(f32(u) / nx, f32(v) / ny); // normalize the coordinates to [0, 1]
  let halfLength = 1.; // half length
  let cellLength = halfLength * 2; // full length
  let cell = pos / nx; // divide the input quad into pieces
  let offset = -halfLength + uv * cellLength + vec2f(halfLength / nx, halfLength / ny);
  // Apply motor
  let transformed = applyMotorToPoint(cell + offset, reverse(camerapose.motor));
  // Apply scale
  let scaled = transformed * camerapose.scale;
  var out: VertexOutput;
  out.pos = vec4f(scaled, 0, 1);
  out.cellStatus = f32(cellStatusIn[idx]);
  return out;
}

@fragment // this compute the color of each pixel
fn fragmentMain(@location(0) cellStatus: f32) -> @location(0) vec4f {
  switch (i32(cellStatus)) {
    case 0: {
      return vec4f(16.f/255, 0.f/255, 16.f/255, 1);
    }
    case 1: {
      return vec4f(192.f/255, 64.f/255, 192.f/255, 1); // (R, G, B, A)
    }
    default: {
      return vec4f(0, 0, 0, 1);
    }
  }
}

var<private> lastWrite: vec2f = vec2f(0, 0);

@compute
@workgroup_size(4, 4)
fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
  // First count how many neighbors are alive
  let x: u32 = cell.x;
  let y: u32 = cell.y;
  let nx: u32 = u32(data.n.x);
  let ny: u32 = u32(data.n.y);
  let i = y * nx + x;

  if (data.paused == -1) {
    cellStatusOut[i] = cellStatusIn[i];
  } else {
    var cardinalNeighbors: u32 = 0;
    if (x < nx) { cardinalNeighbors += cellStatusIn[(y) * nx + (x + 1)]; }
    if (x > 0)  { cardinalNeighbors += cellStatusIn[(y) * nx + (x - 1)]; }
    if (y < ny) { cardinalNeighbors += cellStatusIn[(y + 1) * nx + (x)]; }
    if (y > 0)  { cardinalNeighbors += cellStatusIn[(y - 1) * nx + (x)]; }
    
    var diagonalNeighbors: u32 = 0;
    if (x < nx && y < ny) { diagonalNeighbors += cellStatusIn[(y + 1) * nx + (x + 1)]; }
    if (x > 0 && y > 0) { diagonalNeighbors += cellStatusIn[(y - 1) * nx + (x - 1)]; }
    if (x > 0 && y < ny) { diagonalNeighbors += cellStatusIn[(y + 1) * nx + (x - 1)]; }
    if (x < nx && y > 0) { diagonalNeighbors += cellStatusIn[(y - 1) * nx + (x + 1)]; }

    var allNeighbors = cardinalNeighbors + diagonalNeighbors;

    cellStatusOut[i] = conway(cellStatusIn[i], allNeighbors);
  }
  
  if (
      // this cell is marked to change
      (data.writeCell.x == f32(x) && data.writeCell.y == f32(y)) &&
      // this cell is *newly* marked to change
      (data.writeCell.x != lastWrite.x || data.writeCell.y != lastWrite.y)
    ) {
    cellStatusOut[i] = 1 - cellStatusOut[i];
    lastWrite.x = data.writeCell.x;
    lastWrite.y = data.writeCell.y;
  }
}