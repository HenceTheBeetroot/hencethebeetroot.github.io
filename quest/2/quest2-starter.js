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
import Standard2DPGAPosedLabeledVertexColorObject from '/lib/Moonfall/Standard2DPGAPosedLabeledVertexColorObject.js'
import LineStrip2DVertexObject from '/lib/DSViz/LineStrip2DVertexObject.js'
import DemoTreeObject from '/lib/DSViz/DemoTreeObject.js'
import PGA2D from '/lib/Math/PGA2D.js'
import GeometryHelper from '/lib/Moonfall/GeometryHelper.js'

async function init() {
  const update_ms = 25
  
  // Create a canvas tag
  const canvasTag = document.createElement('canvas', innerWidth = 800, innerHeight = 800);
  canvasTag.id = "renderCanvas";
  document.body.appendChild(canvasTag);
  // Create a 2d animated renderer
  const renderer = new FilteredRenderer(canvasTag);
  await renderer.init();
  // Create a background
  await renderer.appendSceneObject(new Standard2DFullScreenObject(renderer._device, renderer._canvasFormat, "/assets/space.jpg"));
  
  // The objects used in testing, before the switch to a solar system representation. Will live on in our hearts.
  // var object = {
  //   sun: {
  //     body: generate_polygon(16, 0.125, 0xFFFFDD88, 0xFFDD9900),
  //     distance: 0,
  //     speed: 1
  //   },
  //   kiron: {
  //     body: generate_polygon(16, 0.0625, 0xFFFFFFFF, 0xFF888888),
  //     distance: 0.4,
  //     speed: 0.2
  //   },
  //   odysseus: {
  //     body: generate_polygon(16, 0.125, 0xFF888888, 0xFF222222),
  //     distance: 0.75,
  //     speed: 0.1
  //   },
  //   moon_test: {
  //     body: generate_polygon(16, 0.03125, 0xFF00FFFF, 0xFF0088DD),
  //     distance: 0.1,
  //     speed: 2,
  //     parent: "kiron"
  //   }
  // }

  // Planetary orbit ratios from https://nssdc.gsfc.nasa.gov/planetary/factsheet/planet_table_ratio.html
  var object = {
    sun: {
      body: GeometryHelper.createPolygon(16, 0.07, 0xFFFFDD88, 0xFFDD9900),
      distance: 0,
      speed: 0
    },
    mercury: {
      body: GeometryHelper.createPolygon(16, 0.02, 0xFF888888, 0xFF444444),
      distance: 0.1,
      speed: 1 / 0.241
    },
    venus: {
      body: GeometryHelper.createPolygon(16, 0.03, 0xE9B311, 0xB16A18),
      distance: 0.15,
      speed: 1 / 0.615
    },
    earth: {
      body: GeometryHelper.createPolygon(16, 0.03, 0xFF50D3C2, 0xFF269C72),
      distance: 0.25,
      speed: 1
    },
    moon: {
      body: GeometryHelper.createPolygon(16, 0.01, 0xFF888888, 0xFF666666),
      distance: 0.05,
      speed: 1 / 0.0748,
      parent: "earth"
    },
    mars: {
      body: GeometryHelper.createPolygon(16, 0.02, 0xFFA14031, 0XFF6A2F2E),
      distance: 0.35,
      speed: 1 / 1.88
    },
    phobos: {
      body: GeometryHelper.createPolygon(16, 0.01, 0xFF888888, 0xFF666666),
      distance: 0.04,
      speed: 1 / 0.1,
      parent: "mars"
    },
    deimos: {
      body: GeometryHelper.createPolygon(16, 0.0075, 0xFFCAB677, 0xFFA18C59),
      distance: 0.05,
      speed: 1 / 0.13,
      parent: "mars"
    },
    jupiter: {
      body: GeometryHelper.createPolygon(16, 0.05, 0xFFDE913E, 0xFFA74926),
      distance: 0.5,
      speed: 1 / 11.9
    },
    saturn: {
      body: GeometryHelper.createPolygon(16, 0.04, 0xFFE9B226, 0xFFA86C0D),
      distance: 0.6,
      speed: 1 / 29.4
    },
    uranus: {
      body: GeometryHelper.createPolygon(16, 0.035, 0xFF00FFFF, 0xFF0088DD),
      distance: 0.8,
      speed: 1 / 83.7
    },
    neptune: {
      body: GeometryHelper.createPolygon(16, 0.035, 0xFF531FBA, 0xFF472884),
      distance: 1,
      speed: 1 / 163.7
    },
  }
  
  // use a rotor to rotate about an object around a center
  const perspective_angle = (Math.PI / 2) * 0.85
  
  const mod = 1;

  const RPS = Math.PI / 500 * update_ms * mod; // 1 RPS

  for (const [name, data] of Object.entries(object)) {
    console.log(name, "\n", data);
    data.angle = 0;
    data.base = [1, 0, 0, -data.distance, 1, 1];
    data.pose = [1, 0, 0, -data.distance, 1, 1];
    data.pose = new Float32Array(data.pose); // need to covert to Float32Array for uploading to GPU with fixed known size
    let sceneObject = new Standard2DPGAPosedLabeledVertexColorObject(renderer._device, renderer._canvasFormat, data.body, data.pose, name)
    await renderer.appendSceneObject(sceneObject);
  };
  
  setInterval(() => { 
    // update the pose by multiplying the delta motor to the current pose
    
    for (const [name, data] of Object.entries(object)) {
      
      for (let i = 0; i < data.base.length; i++) {
        data.pose[i] = data.base[i];
      }

      data.angle += data.speed * RPS;
      data.angle %= 2 * Math.PI;

      data.coordinates = [Math.cos(data.angle), Math.sin(data.angle)];
      
      data.coordinates[0] *= data.distance;
      data.coordinates[1] *= data.distance;

      data.coordinates[1] *= Math.cos(perspective_angle);
      
      let parent = data.parent? object[data.parent] : null;

      if (parent) {
        data.coordinates[0] += parent.coordinates[0];
        data.coordinates[1] += parent.coordinates[1];
      }

      data.motor = PGA2D.createTranslator(data.coordinates[0], data.coordinates[1]);
      for (let i = 0; i < data.motor.length; i++) {
        data.pose[i] = data.motor[i];
      }
    }
  
    function sort_planets(a, b) {
      if (!b._label || !a._label) { return 0; }

      let planetB = object[b._label];
      let planetA = object[a._label];
      
      let planetBOffset = (Math.sin(planetB.angle) * planetB.distance);
      let planetAOffset = (Math.sin(planetA.angle) * planetA.distance);
      
      let parent = null;
      parent = planetB.parent;
      while (parent) {
        parent = object[parent];
        planetBOffset += (Math.sin(parent.angle) * parent.distance);
        parent = object[parent.parent];
      }
      parent = planetA.parent;
      while (parent) {
        parent = object[parent];
        planetAOffset += (Math.sin(parent.angle) * parent.distance);
        parent = object[parent.parent];
      }
      
      return planetBOffset - planetAOffset;
    }
    
    renderer._objects.sort(sort_planets);
    
    renderer.render();
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
