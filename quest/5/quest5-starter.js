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

import Renderer from '/lib/Viz/2DRenderer.js'
import PolygonObject from '/lib/DSViz/PolygonObject.js'
import Polygon from '/lib/DS/Polygon.js'
import StandardTextObject from '/lib/DSViz/StandardTextObject.js'
import DataObject from '/lib/Moonfall/Manager/DataObject.js';

async function init() {
  // Create a canvas tag
  const canvasTag = document.createElement('canvas');
  canvasTag.id = "renderCanvas";
  document.body.appendChild(canvasTag);
  // Create a 2d animated renderer
  const renderer = new Renderer(canvasTag);
  await renderer.init();
  //const polygon = new PolygonObject(renderer._device, renderer._canvasFormat, '/assets/box.polygon');
  const polygonObject = new Polygon('/assets/dense.polygon');
  await polygonObject.init();
  console.log(polygonObject);
  const points = polygonObject._polygon;
  const lines = points.map((val, idx) =>
    Math.sqrt((points[(idx + 1) % points.length][0] - val[0]) ** 2 + (points[(idx + 1) % points.length][1] - val[1]) ** 2)
  );
  // points.map((val, idx) => Math.sqrt(
  //   (points[idx % points.length][0] - val[0]) ** 2 + (points[idx % points.length][1] - val[1]) ** 2
  // ));
  const data = new DataObject("dataObject");
  data.setDevice(renderer._device)
    .setCanvasFormat(renderer._canvasFormat)
    .setShaderPath("/shaders/standard2d.wgsl")

    .startDataBind(lines)
    .setDynamic(false)
    .setDrawing(false)
    .commitDataBind()

    .startDataBind(points.flat())
    .setDynamic(true)
    .setDrawing(true)
    .commitDataBind();
  
  await renderer.appendSceneObject(data);
  var infoText = new StandardTextObject('fps: ???\nOutside');
  var isInside = false;

  canvasTag.addEventListener('mousemove', (e) => {
    var mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    var mouseY = (-e.clientY / window.innerHeight) * 2 + 1;

    var crosses = 0;
    points.forEach((point, idx) => {
      let next = points[(idx + 1) % points.length];
      if (
        Math.sign(point[1] - mouseY) != Math.sign(next[1] - mouseY) && // cast ray to the right and check for intersection
        (point[0] + next[0]) / 2 > mouseX
      ) crosses++;
    })
    isInside = crosses % 2 == 1;
  });
  
  // run animation at 60 fps
  var frameCnt = 0;
  var tgtFPS = 60;
  var secPerFrame = 1. / tgtFPS;
  var frameInterval = secPerFrame * 1000;
  var lastCalled;
  let renderFrame = () => {
    let elapsed = Date.now() - lastCalled;
    if (elapsed > frameInterval) {
      ++frameCnt;
      lastCalled = Date.now() - (elapsed % frameInterval);
      renderer.render();
    }
    requestAnimationFrame(renderFrame);
  };
  lastCalled = Date.now();
  renderFrame();
  setInterval(() => { 
    infoText.updateText(`fps: ${frameCnt}\n${isInside?"Inside":"Outside"}`);
    frameCnt = 0;
  }, 1000); // call every 1000 ms
  return renderer;
}

init().then( ret => {
  console.log(ret);
}).catch( error => {
  const pTag = document.createElement('p');
  pTag.innerHTML = navigator.userAgent + "</br>" + error.message;
  document.body.appendChild(pTag);
  document.getElementById("renderCanvas").remove();
  console.error(error);
});