import { getName } from "./General.js"
import { Collection } from "./Moon3DCollection.js"
import { MoonObject, Point } from "./Moon3DObject.js"
import Ray from "./Moon3DRay.js"
import { add, sub, mul, div, dot, cross } from "./General.js"

export default class MoonSceneRenderer {
    constructor (canvas) {
        this.CANVAS = canvas
        this.items = []
        this.camera = new Camera()
        this.pixArray
    }

    addToScene(...args) {
        for (let arg of args) {
            switch (getName(arg)) {
                case "collection":
                case "moonobject":
                    this.items.push(arg)
                    break
                default:
                    console.error("Invalid args to add to scene:\n", this, "\n", args)
                    throw new Error("Invalid args!")
            }
        }
    }

    getObjects() {
        let objects = []
        for (let item of this.items) {
            if (getName(item) == "collection") {
                item = item.getObjects()
            }
            objects.push(...item)
        }
        return objects
    }

    getTriArray() {
        return this.getObjects().flatMap((object) => object.tris)
    }

    sortPointsInTri(tri) {
        tri.points.sort((a, b) => this.camera.direction.getAngle(new Ray(a, b)) - (Math.PI / 2))
    }
    
    getOrderedTriArray() {
        this.getTriArray().forEach((tri) => this.sortPointsInTri(tri))
        return this.getTriArray().sort((a, b) => this.camera.direction.getAngle(new Ray(a.points[0], b.points[0])) - (Math.PI / 2))
    }
    
    getRenderArray() {
        return new Float32Array(this.getObjects()
            .map((obj) => {return {tris: obj.tris, color: obj}}) // converts objects into easy-to-work-with generics
            .flatMap((obj) => obj.tris.map((tri) => {return {points: tri.points, color: obj.color.color}})) // splits points and colors
            .map((obj) => {return {points: this.camera.translatePoints(obj.points), color: obj.color}}) // rotates points appropriately
            .sort((a, b) => Math.min(a.points.map((point => point.z))) - Math.min(b.points.map((point => point.z)))) // sorts tris by direction relative to camera
            .flatMap((item) => item.color? item.color : [item.x, item.y, item.z])) // splits all values into individual numbers
    }

    initPixArray(resolution) {
        this.pixArray = new Uint32Array(resolution[0] * resolution[1])
        // stores 00000000 - ffffffff
        // plan: ff ff f f f f
        // for:   x y  r g b a
        // 16 vals per color part, 255 values per vertex part
    }

    updatePixArray(resolution) {
        if (this.pixArray === null) {
            this.initPixArray(resolution)
        }
        for (let x = 0; x < resolution[0]; x++) {
            for (let y = 0; y < resolution[1]; y++) {
                let rx = 1. * x / resolution[0] - .5
                let ry = 1. * y / resolution[0] - .5
                let from = new Point(this.camera.direction.getRelative()).mul(-1).add(this.camera.position)
                let to = new Point(this.camera.position)
                let raycast = new Ray(from, to)
                to = to.sub(new Point(dot(raycast, new Point(0, 1, 0)) * rx, -dot(raycast, new Point(1, 0, 0)) * rx, ry))
                let collision = null
                for (let object of this.getObjects()) {
                    let this_collision = object.getCollision(raycast)
                    if (this_collision && (collision === null || this_collision.distance < collision.distance)) {
                        collision = this_collision
                    }
                }
                this.pixArray[x][y] = (collision !== null)? 0x00000000
                    + 0x1000000 * x
                    + 0x10000 * y
                    + 0x1000 * collision.color.r / 0x10
                    + 0x100 * collision.color.g / 0x10
                    + 0x10 * collision.color.b / 0x10
                    + 0x1 * collision.color.a / 0x10
                    : 0x1000000 * x
                    + 0x10000 * y
                    + 0xf
            }
        }
    }

    // ripped from DSViz/SceneObject.js
    loadShader(filename) {
        return new Promise((resolve, reject) => {
          const xhttp = new XMLHttpRequest();
          xhttp.open("GET", filename);
          xhttp.setRequestHeader("Cache-Control", "no-cache, no-store, max-age=0");
          xhttp.onload = function() {
            if (xhttp.readyState === XMLHttpRequest.DONE && xhttp.status === 200) {
              resolve(xhttp.responseText);
            }
            else {
              reject({
                status: xhttp.status,
                statusText: xhttp.statusText
              });
            }
          };
          xhttp.onerror = function () {
            reject({
              status: xhttp.status,
              statusText: xhttp.statusText
            });
          };
          xhttp.send();
        });
    }

    async init() {
        // Create a canvas tag
        const canvasTag = document.createElement('canvas');
        canvasTag.id = "renderCanvas";
        document.body.appendChild(canvasTag);
        const resolution = [128, 64]
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
            label: "Pix Shader",
            code: await this.loadShader("/shaders/moon/low_res.wgsl")
        });

        this.initPixArray(resolution)
        
        // Create vertex buffer to store the vertices in GPU
        var pixBuffer = device.createBuffer({
            label: "Pix Buffer",
            size: this.pixArray.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        // Copy from CPU to GPU
        device.queue.writeBuffer(pixBuffer, 0, this.pixArray);

        var bindGroupLayout = device.createBindGroupLayout({
            label: "Pix Bind Group Layout",
            entries: [{
              binding: 0,
              visibility: GPUShaderStage.VERTEX,
              buffer: { type: "read-only-storage" }
            }]
        })

        var bindGroup = device.createBindGroup({
            label: "Pix Bind Group",
            layout: bindGroupLayout,
            entries: [
              {
                binding: 0,
                resource: { buffer: pixBuffer }
              }
            ]
        })

        // create the pipeline layout using the bind group layout
        var pipelineLayout = device.createPipelineLayout({
            label: "Pix Layout",
            bindGroupLayouts: [ bindGroupLayout ]
        });

        var renderPipeline = device.createRenderPipeline({
            label: "Render Pipeline",
            layout: pipelineLayout,
            vertex: {
                module: shaderModule,         // the shader module
                entryPoint: "vertexMain",     // where the vertex shader starts
            },
            fragment: {
                module: shaderModule,         // the shader module
                entryPoint: "fragmentMain",   // where the fragment shader starts
                targets: [{
                    format: canvasFormat        // the target canvas format (the output)
                }]
            }
        });


        this.updatePixArray(resolution)
        // add more render pass to draw the plane
        pass.setPipeline(renderPipeline);
        pass.setBindGroup(0, bindGroup)
        pass.setVertexBuffer(0, pixBuffer);
        pass.draw(this.pixArray.length / 2);
        pass.end();
        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);

        return context;
    }

    render() {
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
    }
}

class Camera {
    constructor() {
        this.position = new Point(-2, 0, 0)
        this.direction = new Ray()
        this.focal_len = 0.5
    }

    translatePoints(...args) {
        return args.map((point) => {
            if (getName(point) == "point") {
                point = point.getAsArray()
            }
            
            let x
            let y
            let z

            let r = this.direction.getAsRotations()

            y = point.y * Math.cos(r.x) - point.z * Math.sin(r.x)
            z = point.y * Math.sin(r.x) + point.z * Math.cos(r.x)

            this.y = y
            this.z = z
            
            z = point.z * Math.cos(r.y) - point.x * Math.sin(r.y)
            x = point.z * Math.sin(r.y) + point.x * Math.cos(r.y)
            
            this.z = z
            this.x = x
            
            x = point.x * Math.cos(r.z) - point.y * Math.sin(r.z)
            y = point.x * Math.sin(r.z) + point.y * Math.cos(r.z)
            
            this.x = x
            this.y = y

            point.x -= this.position.x
            point.y -= this.position.y
            point.z -= this.position.z

            return {
                x: point.x,
                y: point.y,
                z: point.z
            }
        })
    }
}