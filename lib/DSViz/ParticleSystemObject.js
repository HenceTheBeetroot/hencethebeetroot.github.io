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
  constructor(device, canvasFormat, numParticles = 4092, numTrailers = 3) {
    super(device, canvasFormat);
    this._numParticles = numParticles;
    //this._numTrailers = numTrailers;
    this._step = 0;
  }
  
  async createGeometry() { 
    const dataSize = [
      this._numParticles * 4 * 4,                     // Particle buffer (4 floats per particle)
      this._numParticles * 4 * 3,                     // Color buffer (3 floats per color)
      //this._numParticles * this._numTrailers * 4 * 2, // Trailer buffer (2 floats per trailer)
      4 * 1                                           // Time buffer (1 float)
    ];
    
    const totalDataSize = dataSize.reduce((sum, val) => sum + val);

    let temp = [0];

    dataSize.forEach((val) => temp = temp.concat(temp.length > 0? temp[temp.length - 1] + val : val));
    const offset = temp.slice(0, temp.length - 1);
    console.log("data size", dataSize);
    console.log("tds", totalDataSize);
    console.log("offset", offset);

    this._data = new ArrayBuffer(totalDataSize);

    // Create particles
    this._particles = new Float32Array(this._data, offset[0], this._numParticles * 4); // [x, y, v_x, v_y]
    this._colors = new Float32Array(this._data, offset[1], this._numParticles * 3); // [r, g, b]
    //this._trailers = new Float32Array(this._data, offset[2], this._numParticles * this._numTrailers * 2); // [x, y]
    this._time = new Float32Array(this._data, offset[2], 1); // single value
    // create ping-pong buffers to store and update the particles in GPU
    // name the ping-pong buffers _particleBuffers
    this._particleBuffers = [
      this._device.createBuffer({
        label: "Particle Buffer 1",
        size: this._particles.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      }),
      this._device.createBuffer({
        label: "Particle Buffer 2",
        size: this._particles.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      })
    ];

    this._colorBuffer = this._device.createBuffer({
      label: "Color Buffer",
      size: this._colors.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    })

    //this._trailerBuffers = [
    //  this._device.createBuffer({
    //    label: "Trailer Buffer 1",
    //    size: this._trailers.byteLength,
    //    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    //  }),
    //  this._device.createBuffer({
    //    label: "Trailer Buffer 2",
    //    size: this._trailers.byteLength,
    //    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    //  })
    //];
    
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
      // random position between [-1, 1] and [-1, 1]
      this._particles[4 * i + 0] = 0;//(Math.random() * 2 - 1); // [-1, 1] 
      this._particles[4 * i + 1] = 1.5;//(Math.random() * 2 - 1);
      // update the velocity
      this._particles[4 * i + 2] = (Math.random() - 0.5) * 2 / 256;
      this._particles[4 * i + 3] = (Math.random()) / 256;
      // randomize colors
      let this_color = Math.random() * 0.25;
      this._colors[3 * i + 0] = this_color * 2; // R
      this._colors[3 * i + 1] = this_color; // G
      this._colors[3 * i + 2] = this_color * 3; // B
      // apply trailers
      //for (let j = 0; j < this._numTrailers; j += 2) {
      //  this._trailers[this._numTrailers * 2 * i + j + 0] = this._particles[2 * i + 0];
      //  this._trailers[this._numTrailers * 2 * i + j + 1] = this._particles[2 * i + 1];
      //}
    }
    this._time[0] = performance.now();
    
    // Copy from CPU to GPU
    this._step = 0;
    this._device.queue.writeBuffer(this._particleBuffers[this._step], 0, this._particles);
    this._device.queue.writeBuffer(this._colorBuffer, 0, this._colors);
    //this._device.queue.writeBuffer(this._trailerBuffers[this._step], 0, this._trailers);
    this._device.queue.writeBuffer(this._timeBuffer, 0, this._time);
  }
  
  updateGeometry() { }
  
  async createShaders() {
    let shaderCode = await this.loadShader("/shaders/particles.wgsl");
    this._shaderModule = this._device.createShaderModule({
      label: "Particle Shader " + this.getName(),
      code: shaderCode,
    });
    // Create the bind group layout for using the ping-pong buffers in the GPU
    // name the bind group layout _bindGroupLayout
    this._particleBindGroupLayout = this._device.createBindGroupLayout({
      label: "Particle Bind Group Layout " + this.getName(),
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
        buffer: { type: "read-only-storage"} // Particle input buffer
      }, {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage"} // Particle output buffer
      }]
    });

    this._colorBindGroupLayout = this._device.createBindGroupLayout({
      label: "Color Bind Group Layout",
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "read-only-storage" } // Color buffer
      }]
    });

    //this._trailerBindGroupLayout = this._device.createBindGroupLayout({
    //  label: "Trailer Bind Group Layout",
    //  entries: [{
    //    binding: 0,
    //    visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
    //    buffer: { type: "read-only-storage" } // Trailer input buffer
    //  },
    //  {
    //    binding: 1,
    //    visibility: GPUShaderStage.COMPUTE,
    //    buffer: { type: "storage" } // Trailer output buffer
    //  }]
    //});

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
      bindGroupLayouts: [ this._particleBindGroupLayout, this._colorBindGroupLayout, /*this._trailerBindGroupLayout,*/ this._uniformBindGroupLayout ]
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
        label: "Particle Bind Group 1",
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
        label: "Particle Bind Group 2",
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

    this._colorBindGroup = this._device.createBindGroup({
      label: "Color Bind Group",
      layout: this._colorBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this._colorBuffer }
        }
      ]
    });

    //this._trailerBindGroups = [
    //  this._device.createBindGroup({
    //    label: "Trailer Bind Group 1",
    //    layout: this._trailerBindGroupLayout,
    //    entries: [
    //      {
    //        binding: 0,
    //        resource: { buffer: this._trailerBuffers[0] }
    //      },
    //      {
    //        binding: 1,
    //        resource: { buffer: this._trailerBuffers[1] }
    //      }
    //    ]
    //  }),
    //  this._device.createBindGroup({
    //    label: "Trailer Bind Group 2",
    //    layout: this._trailerBindGroupLayout,
    //    entries: [
    //      {
    //        binding: 0,
    //        resource: { buffer: this._trailerBuffers[1] }
    //      },
    //      {
    //        binding: 1,
    //        resource: { buffer: this._trailerBuffers[0] }
    //      }
    //    ]
    //  })
    //]

    this._uniformBindGroup = this._device.createBindGroup({
      label: "Uniform Bind Group",
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
    pass.setBindGroup(0, this._particleBindGroups[this._step]);
    pass.setBindGroup(1, this._colorBindGroup);
    //pass.setBindGroup(2, this._trailerBindGroups[this._step]);
    pass.setBindGroup(2, this._uniformBindGroup);
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
    this._time[0] = performance.now();
    this._device.queue.writeBuffer(this._timeBuffer, 0, this._time);
    pass.setPipeline(this._computePipeline);
    pass.setBindGroup(0, this._particleBindGroups[this._step]);
    pass.setBindGroup(1, this._colorBindGroup);
    //pass.setBindGroup(2, this._trailerBindGroups[this._step]);
    pass.setBindGroup(2, this._uniformBindGroup);
    pass.dispatchWorkgroups(Math.ceil(this._numParticles / 256));
    this._step ++;
    this._step %= 2;
  }
}