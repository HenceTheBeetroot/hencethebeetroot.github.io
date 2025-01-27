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

async function init() {
  // Create a canvas tag
  const canvasTag = document.createElement('canvas');
  canvasTag.id = "renderCanvas";
  document.body.appendChild(canvasTag);
  // Modify the canvas size
  const devicePixelRatio = window.devicePixelRatio || 1;
  const width = window.innerWidth * devicePixelRatio;
  const height = window.innerHeight * devicePixelRatio;
  canvasTag.width = width;
  canvasTag.height = height; 
  // Check if the browser supports WebGPU
  if (!navigator.gpu) {
    throw Error("WebGPU is not supported in this browser.");
  }
  // Get a GPU adapter
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw Error("Couldn't request WebGPU adapter.");
  }
  // Get a GPU device
  const device = await adapter.requestDevice();
  // Get canvas context using WebGPU
  const context = canvasTag.getContext("webgpu");
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: device,
    format: canvasFormat,
  });
  // Create a GPU command encoder
  const encoder = device.createCommandEncoder();
  // Use the encoder to begin render pass
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      clearValue: { r: 64/255, g: 32/255, b: 48/255, a: 1 },
      loadOp: "clear",
      storeOp: "store",
    }]
  });

  // Create shader module
  var shaderModule = device.createShaderModule({
    label: "Shader",
    code: `
      @vertex // this compute the scene coordinate of each input vertex
      fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f {
        return vec4f(pos, 0, 1); // (pos, Z, W) = (X, Y, Z, W)
      }
      
      @fragment // this compute the color of each pixel
      fn fragmentMain() -> @location(0) vec4f {
        return vec4f(32.f/255, 0.f/255, 0.f/255, 1);
      }
      `
  });

  // Create a triangle geometry in CPU
  var vertices = new Float32Array([
    // x, y
     // Ground
     1,    -1,
     0.5,  -0.8,
    -1,    -1,
     1,    -1,
    -0.5,  -0.8,
    -1,    -1,
    -1,    -1,
    -1,    -0.6,
    -0.4,  -1,
     1,    -1,
     1,    -0.6,
     0.4,  -1,
    
     // Tower
     0.3,  -1,
     0.2,  -0,
     0,    -1,
    -0.3,  -1,
    -0.2,   0,
     0,    -1,
     0.2,   0,
     0,    -1,
    -0.2,   0,
     0.2,   0,
     0.25,  0.5,
     0,     0,
    -0.2,   0,
    -0.25,  0.5,
     0,     0,
     0,     0,
     0.2,   0.25,
    -0.2,   0.25,

    // Eye
     0.15,  0.55,
     0.1,   0.7,
     0.1,   0.4,
    -0.15,  0.55,
    -0.1,   0.7,
    -0.1,   0.4,
     0.1,   0.7,
    -0.05,  0.7,
     0.1,   0.4,
     0.1,   0.4,
     0,     0.4,
     0.1,   0.7,
    -0.1,   0.7,
     0.05,  0.7,
    -0.1,   0.4,
    -0.1,   0.4,
     0,     0.4,
    -0.1,   0.7,
    -0.1,   0.7,
     0,     0.75,
     0.1,   0.7,
    -0.1,   0.4,
     0,     0.35,
     0.1,   0.4,

    ]);
    
  // Create vertex buffer to store the vertices in GPU
  var vertexBuffer = device.createBuffer({
    label: "Vertices",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  // Copy from CPU to GPU
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // Defne vertex buffer layout - how the shader should read the buffer
  var vertexBufferLayout = {
    arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
    attributes: [{
      format: "float32x2", // 32 bits, each has two coordiantes
      offset: 0,
      shaderLocation: 0, // position in the vertex shader
    }],
  };

  var renderPipeline = device.createRenderPipeline({
    label: "Render Pipeline",
    layout: "auto", // we will talk about layout later
    vertex: {
      module: shaderModule,         // the shader module
      entryPoint: "vertexMain",     // where the vertex shader starts
      buffers: [vertexBufferLayout] // the buffer layout - more about it soon
    },
    fragment: {
      module: shaderModule,         // the shader module
      entryPoint: "fragmentMain",   // where the fragment shader starts
      targets: [{
        format: canvasFormat        // the target canvas format (the output)
      }]
    }
  });

  // add more render pass to draw the plane
  pass.setPipeline(renderPipeline);      // which render pipeline to use
  pass.setVertexBuffer(0, vertexBuffer); // which vertex buffer is used at location 0
  pass.draw(vertices.length / 2);        // how many vertices to draw
  pass.end(); // end the pass
  // Create the command buffer
  const commandBuffer = encoder.finish();
  // Submit to the device to render
  device.queue.submit([commandBuffer]);

  return context;
}

init().then( ret => {
  console.log(ret);
}).catch( error => {
  // Error handling - add a p tag to display the error message
  const pTag = document.createElement('p');
  pTag.innerHTML = navigator.userAgent + "</br>" + error.message;
  document.body.appendChild(pTag);
  // Remove the created canvas tag
  document.getElementById("renderCanvas").remove();
});