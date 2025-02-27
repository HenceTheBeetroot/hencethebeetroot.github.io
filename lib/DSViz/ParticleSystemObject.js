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

import SceneObject from '/lib/DSViz/SceneObject.js'

export default class ParticleSystemObject extends SceneObject {
  constructor(device, canvasFormat, numParticles = 4096) {
    super(device, canvasFormat);
    this._numParticles = numParticles;
    this._step = 0;
  }
  
  async createGeometry() { 
    const dataSize = [
      this._numParticles * 4 * 6, // Particle buffer (6 floats per particle)
      4 * 1                       // Time buffer (1 float)
    ];
    
    const totalDataSize = dataSize.reduce((sum, val) => sum + val);

    let temp = [0];

    dataSize.forEach((val) => temp = temp.concat(temp.length > 0? temp.reduce((sum, subval) => sum + subval) + val : val));
    const offset = temp.slice(0, temp.length - 1);
    console.log("data size", dataSize);
    console.log("tds", totalDataSize);
    console.log("offset", offset);

    this._data = new ArrayBuffer(totalDataSize)

    // Create particles
    this._particles = new Float32Array(this._data, 0, this._numParticles * 6); // [x, y, ix, iy, vx, vy]
    this._time = new Float32Array(this._data, offset[1], 1);
    // create ping-pong buffers to store and update the particles in GPU
    // name the ping-pong buffers _particleBuffers
    this._particleBuffers = [
      this._device.createBuffer({
        label: "Particle Buffer 1 " + this.getName(),
        size: this._particles.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      }),
      this._device.createBuffer({
        label: "Particle Buffer 2 " + this.getName(),
        size: this._particles.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      })
    ];
    
    this._timeBuffer = this._device.createBuffer({
      label: "Time Buffer",
      size: this._time.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    // calling the resetParticles function to reset the particle buffers
    this.resetParticles();
  }
    
  resetParticles() {
    for (let i = 0; i < this._numParticles; ++i) {
      // random position between [-1, 1] x [-1, 1]
      this._particles[6 * i + 0] = (Math.random() * 2 - 1); // [-1, 1] 
      this._particles[6 * i + 1] = (Math.random() * 2 - 1);
      // store the initial positions
      this._particles[6 * i + 2] = this._particles[6 * i + 0];
      this._particles[6 * i + 3] = this._particles[6 * i + 1];
      // TODO 6: update the velocity
      this._particles[6 * i + 4] = (Math.random() - 0.5) * 2 / 256;
      this._particles[6 * i + 5] = (Math.random()) / 256;
    }
    this._time[0] = performance.now();
    
    // Copy from CPU to GPU
    this._step = 0;
    this._device.queue.writeBuffer(this._particleBuffers[this._step], 0, this._particles);
    this._device.queue.writeBuffer(this._timeBuffer, 0, this._time);
  }
  
  updateGeometry() { }
  
  async createShaders() {
    let shaderCode = await this.loadShader("/shaders/particles.wgsl");
    this._shaderModule = this._device.createShaderModule({
      label: "Particles Shader " + this.getName(),
      code: shaderCode,
    });
    // Create the bind group layout for using the ping-pong buffers in the GPU
    // name the bind group layout _bindGroupLayout
    this._particleBindGroupLayout = this._device.createBindGroupLayout({
      label: "Particle Bind Group Layout " + this.getName(),
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
        buffer: { type: "read-only-storage"} // Particle status input buffer
      }, {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage"} // Particle status output buffer
      }]
    });

    this._uniformBindGroupLayout = this._device.createBindGroupLayout({
      label: "Uniform Bind Group Layout",
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "read-only-storage" } // time buffer
      }]
    })

    // create the pipeline layout using the bind group layout
    this._pipelineLayout = this._device.createPipelineLayout({
      label: "Pipeline Layout",
      bindGroupLayouts: [ this._particleBindGroupLayout, this._uniformBindGroupLayout ]
    });
  }
  
  async createRenderPipeline() { 
    await this.createPipelines();
  }
  
  async createPipelines() {
    this._pipeline = this._device.createRenderPipeline({
      label: "Render Pipeline " + this.getName(),
      layout: this._pipelineLayout,
      vertex: {
        module: this._shaderModule, 
        entryPoint: "vertexMain",
      },
      fragment: {
        module: this._shaderModule,
        entryPoint: "fragmentMain",
        targets: [{
          format: this._canvasFormat
        }]
      },
      primitives: {
        typology: 'line-strip'
      }
    });

    // Create bind group to bind the particle buffers
    this._particleBindGroups = [
      this._device.createBindGroup({
        layout: this._particleBindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: { buffer: this._particleBuffers[0] }
          },
          {
            binding: 1,
            resource: { buffer: this._particleBuffers[1] }
          }
        ],
      }),
      this._device.createBindGroup({
        layout: this._particleBindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: { buffer: this._particleBuffers[1] }
          },
          {
            binding: 1,
            resource: { buffer: this._particleBuffers[0] }
          }
        ],
      })
    ];

    this._uniformBindGroup = this._device.createBindGroup({
      layout: this._uniformBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this._timeBuffer }
        }
      ]
    });
  }
  
  render(pass) { 
    pass.setPipeline(this._pipeline);
    //console.log("Bind groups:", this._particleBindGroups[this._step], this._uniformBindGroup);
    pass.setBindGroup(0, this._particleBindGroups[this._step]);
    pass.setBindGroup(1, this._uniformBindGroup);
    pass.draw(128, this._numParticles);
  }
  
  async createComputePipeline() { 
    this._computePipeline = this._device.createComputePipeline({
      label: "Particles Compute Pipeline " + this.getName(),
      layout: this._pipelineLayout,
      compute: {
        module: this._shaderModule,
        entryPoint: "computeMain",
      }
    });
  }
  
  compute(pass) { 
    let particleBindGroup = this._particleBindGroups[this._step];
    let uniformBindGroup = this._uniformBindGroup;
    //console.log("Bind groups:\n", particleBindGroup, uniformBindGroup);
    pass.setPipeline(this._computePipeline);
    pass.setBindGroup(0, particleBindGroup);
    pass.setBindGroup(1, uniformBindGroup);
    pass.dispatchWorkgroups(Math.ceil(this._numParticles / 256));
    this._step ++;
    this._step %= 2;
  }
}