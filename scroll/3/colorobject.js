import SceneObject from "<the SceneObject.js in Quest 1>"

export default class Standard2DVertexColorObject extends SceneObject {
  constructor(device, canvasFormat, vertices) {
    super(device, canvasFormat);
    // This assume each vertex has (x, y, r, g, b, a)
    this._vertices = vertices;
  }

  async createGeometry() {
    // Create vertex buffer to store the vertices in GPU
    this._vertexBuffer = this._device.createBuffer({
      label: "Vertices " + this.getName(),
      size: this._vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    // Copy from CPU to GPU
    this._device.queue.writeBuffer(this._vertexBuffer, 0, this._vertices);
    // Defne vertex buffer layout - how the GPU should read the buffer
    this._vertexBufferLayout = {
    arrayStride: 6 * Float32Array.BYTES_PER_ELEMENT,
      attributes: [{ 
        // position 0 has two floats
        shaderLocation: 0,   // position in the vertex shader
        format: "float32x2", // two coordiantes
        offset: 0,           // no offset in the vertex buffer
      },
      {
        // position 1 has four floats
        shaderLocation: 1,   // position in the vertex shader
        format: "float32x4", // four color values
        offset: 2 * Float32Array.BYTES_PER_ELEMENT, // always after (x, y)
      }],
    };
  }

  async createShaders() {
    let shaderCode = await this.loadShader("<we will create this shader file>");
    this._shaderModule = this._device.createShaderModule({
      label: " Shader " + this.getName(),
      code: shaderCode,
    }); 
  }

  async createRenderPipeline() {
    this._renderPipeline = this._device.createRenderPipeline({
      label: "Render Pipeline " + this.getName(),
      layout: "auto",
      vertex: {
        module: this._shaderModule,         // the shader code
        entryPoint: "vertexMain",           // the shader function
        buffers: [this._vertexBufferLayout] // the binded buffer layout
      },
      fragment: {
        module: this._shaderModule,    // the shader code
        entryPoint: "fragmentMain",    // the shader function
        targets: [{
          format: this._canvasFormat   // the target canvas format
        }]
      }
    }); 
  }

  render(pass) {
    // add to render pass to draw the object
    pass.setPipeline(this._renderPipeline);      // which render pipeline to use
    pass.setVertexBuffer(0, this._vertexBuffer); // how the buffer are binded
    pass.draw(this._vertices.length / 6);        // number of vertices to draw
  }

  async createComputePipeline() {}

  compute(pass) {}
}