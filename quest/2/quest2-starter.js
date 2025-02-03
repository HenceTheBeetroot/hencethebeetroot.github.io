/*!
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

// Check your browser supports: https://github.com/gpuweb/gpuweb/wiki/Implementation-Status#implementation-status
// Need to enable experimental flags chrome://flags/
// Chrome & Edge 113+ : Enable Vulkan, Default ANGLE Vulkan, Vulkan from ANGLE, Unsafe WebGPU Support, and WebGPU Developer Features (if exsits)
// Firefox Nightly: sudo snap install firefox --channel=latext/edge or download from https://www.mozilla.org/en-US/firefox/channel/desktop/

import FilteredRenderer from '/lib/Viz/2DFilteredRenderer.js'
import Standard2DFullScreenObject from '/lib/DSViz/Standard2DFullScreenObject.js'
import Standard2DPGAPosedVertexColorObject from '/lib/DSViz/Standard2DPGAPosedVertexColorObject.js'
import LineStrip2DVertexObject from '/lib/DSViz/LineStrip2DVertexObject.js'
import DemoTreeObject from '/lib/DSViz/DemoTreeObject.js'
import PGA2D from '/lib/Math/PGA2D.js'

async function init() {
  const update_ms = 25
  const RPS = Math.PI / 500 * update_ms; // 1 RPS
  
  // Create a canvas tag
  const canvasTag = document.createElement('canvas', innerWidth = 800, innerHeight = 800);
  canvasTag.id = "renderCanvas";
  document.body.appendChild(canvasTag);
  // Create a 2d animated renderer
  const renderer = new FilteredRenderer(canvasTag);
  await renderer.init();
  // Create a background
  await renderer.appendSceneObject(new Standard2DFullScreenObject(renderer._device, renderer._canvasFormat, "/assets/space.jpg"));
  
  function generate_polygon(sides, radius, center = 0xFF000000, edge = 0xFF000000) {
    /** Given a number of sides and a radius, returns a set of points representing a regular polygon made of triangles. Accepts separate ARGB hexadecimal values for center and edges, or defaults to black if unspecified. */
    if (sides < 3) { console.error("Polygon must have at least three sides!"); }
    if (radius < 0) { console.error("Radius must be nonnegative!"); }
    const angle = (Math.PI / 2) * (1 - (2 / sides));
    var values = [];
    
    const bc = (center % 0x100) / 0xFF
    const gc = (Math.floor(center / 0x100) % 0x100) / 0xFF
    const rc = (Math.floor(center / 0x10000) % 0x100) / 0xFF
    const ac = (Math.floor(center / 0x1000000) % 0x100) / 0xFF

    const be = (edge % 0x100) / 0xFF
    const ge = (Math.floor(edge / 0x100) % 0x100) / 0xFF
    const re = (Math.floor(edge / 0x10000) % 0x100) / 0xFF
    const ae = (Math.floor(edge / 0x1000000) % 0x100) / 0xFF
    
    for (var i = 0; i < sides; i++) {
      var x1 = 1 / Math.tan(angle); // Define base of triangle
      var y = 1 / Math.sqrt(Math.pow(x1, 2) + 1); // Normalize variable (this comes first because former val of x is not saved, but former val of y is known to be one)
      x1 *= y // (conveniently, y can be used to normalize x since it was 1 before)
      var x2 = -x1; // Duplicate and reflect
      var to_rotate = i * 2 * Math.PI / sides;
      var x1_f = x1 * Math.cos(to_rotate) - y * Math.sin(to_rotate); // Rotate appropriately
      var y1_f = x1 * Math.sin(to_rotate) + y * Math.cos(to_rotate);
      var x2_f = x2 * Math.cos(to_rotate) - y * Math.sin(to_rotate); // ...and again for the other one
      var y2_f = x2 * Math.sin(to_rotate) + y * Math.cos(to_rotate);
      x1_f *= radius; // Extend points to radius
      x2_f *= radius;
      y1_f *= radius;
      y2_f *= radius;
      
      values.push(
        0, 0, rc, gc, bc, ac, // Center point
        x1_f, y1_f, re, ge, be, ae,
        x2_f, y2_f, re, ge, be, ae
      ); // And just repeat that for each side!
    }

    // Finally, return results
    return new Float32Array(values);
  }

  var objects = {
    sun: {
      body: generate_polygon(16, 0.25, 0xFFFFDD88, 0xFFDD9900),
      distance: 0,
      speed: 1
    },
    kiron: {
      body: generate_polygon(16, 0.0625, 0xFFFFFFFF, 0xFF888888),
      distance: 0.25,
      speed: 0.25
    },
    odysseus: {
      body: generate_polygon(16, 0.125, 0xFF888888, 0xFF222222),
      distance: 0.425,
      speed: 0.1
    }
  }
  
  // use a rotor to rotate about an object around a center
  let center = [0, 0]; // set the ceter to (0, 0) - feel free to change it and see different results
  
  for (const [name, data] of Object.entries(objects)) {
    console.log(name, data);
    data.pose = new Float32Array([1, 0, data.distance, 0, 1, 1]); // need to covert to Float32Array for uploading to GPU with fixed known size
    await renderer.appendSceneObject(new Standard2DPGAPosedVertexColorObject(renderer._device, renderer._canvasFormat, data.body, data.pose));
    data.angle = RPS * data.speed;
    data.dm = PGA2D.normaliozeMotor(PGA2D.createRotor(data.angle, center[0], center[1]));
  };

  setInterval(() => { 
    renderer.render();
    // update the pose by multiplying the delta motor to the current pose
    for (const [name, data] of Object.entries(objects)) {
      data.motor = PGA2D.normaliozeMotor(PGA2D.geometricProduct(data.dm, [data.pose[0], data.pose[1], data.pose[2], data.pose[3]]));
      for (var i = 0; i < data.motor.length; i++) { data.pose[i] = data.motor[i]; }
    }
  }, update_ms);
  return renderer;
}

init().then( ret => {
  console.log(ret);
}).catch( error => {
  const pTag = document.createElement('p');
  pTag.innerHTML = navigator.userAgent + "</br>" + error.message;
  document.body.appendChild(pTag);
  document.getElementById("renderCanvas").remove();
});
