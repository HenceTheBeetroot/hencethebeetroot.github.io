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

import RayTracer from '/lib/Viz/RayTracer.js'
import StandardTextObject from '/lib/DSViz/StandardTextObject.js'
import RayTracingBoxObject from '/lib/DSViz/RayTracingBoxObject.js'
import Camera from '/lib/Viz/3DCamera.js'

async function init() {
  // Create a canvas tag
  const canvasTag = document.createElement('canvas');
  canvasTag.id = "renderCanvas";
  document.body.appendChild(canvasTag);
  // Create a ray tracer
  const tracer = new RayTracer(canvasTag);
  await tracer.init();
  // Create a 3D Camera
  var camera = new Camera();
  // Create an object to trace
  var tracerObj = new RayTracingBoxObject(tracer._device, tracer._canvasFormat, camera);
  await tracer.setTracerObject(tracerObj);
  
  var fpsText = new StandardTextObject("Loading...");

  // two types of keys:
  // "instants" - keys that simply do something when pressed
  // "perpetuals" - keys that continue affecting the scene until released
  
  const keysPressed = new Set();
  var movespeed = 0.5;

  var helpVisible = true;
  window.addEventListener('keydown', (e) => {
    // initiate any perpetuals
    keysPressed.add(e.key);
    // handle any instants
    switch (e.key) {
      case 'f': case 'F':
        helpVisible = !helpVisible;
        break;
      case 'r': case 'R':
        camera.resetPose();
        tracerObj.updateCameraPose();
        tracerObj.updateCameraFocal();
        break;
      case 'p': case 'P':
        camera._isProjective = !camera._isProjective;
        tracerObj.updateCameraPose();
        break;
      case 'g': case 'G':
        camera._inverse = !camera._inverse;
        tracerObj.updateCameraPose();
    }
  });

  // this function appropriately disables untoggled perpetuals...
  window.addEventListener('keyup', (e) => {
    keysPressed.delete(e.key);
    // switch (e.key) {
    //   case 'g': case 'G':
    //     break;
    // }
  });

  // ...and this one handles perpetual functionality
  const keyboardInputUpdate = (fps) => {
    for (let key of keysPressed) {
      switch (key) {
        // Translation
        case 'w': case 'W':
          camera.moveZ(movespeed * 2 / fps);
          tracerObj.updateCameraPose();
          break;
        case 's': case 'S':   
          camera.moveZ(-movespeed * 2 / fps);
          tracerObj.updateCameraPose();
          break;
        case 'a': case 'A':  
          camera.moveX(-movespeed * 2 / fps);
          tracerObj.updateCameraPose();
          break;
        case 'd': case 'D': 
          camera.moveX(movespeed * 2 / fps);
          tracerObj.updateCameraPose();
          break;
        case ' ':  
          camera.moveY((camera._inverse? 1 : -1) * movespeed * 2 / fps);
          tracerObj.updateCameraPose();
          break;
        case 'Shift': 
          camera.moveY((camera._inverse? -1 : 1) * movespeed * 2 / fps);
          tracerObj.updateCameraPose();
          break;
        
        // Rotation
        case 'i': case 'I':
          camera.rotateX(-movespeed * 2 / fps);
          tracerObj.updateCameraPose();
          break;
        case 'k': case 'K':   
          camera.rotateX(movespeed * 2 / fps);
          tracerObj.updateCameraPose();
          break;
        case 'j': case 'J':
          camera.rotateY((camera._inverse? -1 : 1) * movespeed * 2 / fps);
          tracerObj.updateCameraPose();
          break;
        case 'l': case 'L':   
          camera.rotateY((camera._inverse? 1 : -1) * movespeed * 2 / fps);
          tracerObj.updateCameraPose();
          break;
        case 'u': case 'U':
          camera.rotateZ((camera._inverse? -1 : 1) * movespeed * 2 / fps);
          tracerObj.updateCameraPose();
          break;
        case 'o': case 'O':   
          camera.rotateZ((camera._inverse? 1 : -1) * movespeed * 2 / fps);
          tracerObj.updateCameraPose();
          break;

        // Focal Length
        case 'q': case 'Q':
          camera.scaleFocal(1 - (movespeed * 2 / fps * Math.sign(tgtFPS)));
          tracerObj.updateCameraFocal();
          break;
        case 'e': case 'E':
          camera.scaleFocal(1 + (movespeed * 2 / fps * Math.sign(tgtFPS)));
          tracerObj.updateCameraFocal();
          break;
      }
    };
  }
  
  // run animation at 60 fps
  var frameCnt = 0;
  var tgtFPS = 60;
  var secPerFrame = 1. / tgtFPS;
  var frameInterval = secPerFrame * 1000;
  var lastCalled;
  let renderFrame = () => {
    keyboardInputUpdate(tgtFPS);
    let elapsed = Date.now() - lastCalled;
    if (elapsed > frameInterval) {
      ++frameCnt;
      lastCalled = Date.now() - (elapsed % frameInterval);
      tracer.render();
    }
    requestAnimationFrame(renderFrame);
  };
  lastCalled = Date.now();
  renderFrame();
  setInterval(() => { 
    let text = `fps: ${frameCnt}` +
    `\n[ F ] ${helpVisible? "Hide" : "Show"} controls` +
    (helpVisible?
    '\n[ R ] Reset view' +
    `\n[ P ] Change view type (currently ${camera._isProjective? "projective" : "orthographic"})` +
    `\n[ G ] Move camera / object (currently ${camera._inverse? "object" : "camera"})` +
    `\n      (Uses light orange face as "front" and gray as "top")` +
    '\n\n[ W/S ] Dolly forward/backward' +
    '\n[ A/D ] Truck left/right' +
    '\n[ Space/Shift ] Boom up/down' +
    '\n\n[ I/K ] Tilt up/down' +
    '\n[ J/L ] Pan left/right' +
    '\n[ O/U ] Roll clockwise/counterclockwise' +
    '\n\n[ E/Q ] FOV in/out'
    : "")
    fpsText.updateTextRegion(text);
    fpsText.updateText(text);
    frameCnt = 0;
  }, 1000); // call every 1000 ms
  return tracer;
}

init().then( ret => {
  console.log(ret);
}).catch( error => {
  const pTag = document.createElement('p');
  pTag.innerHTML = navigator.userAgent + "</br>" + error.message;
  document.body.appendChild(pTag);
  document.getElementById("renderCanvas").remove();
});("renderCanvas").remove();
// });