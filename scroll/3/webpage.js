import FilteredRenderer from '<FilteredRenderer>'
import Standard2DVertexColorObject from '<we will create this soon>'

async function init() {
  // Create a canvas tag
  const canvasTag = document.createElement('canvas');
  canvasTag.id = "renderCanvas";
  document.body.appendChild(canvasTag);
  // Create a 2d renderer
  const renderer = new FilteredRenderer(canvasTag);
  await renderer.init();
  // Create a triangle geometry
  var vertices = new Float32Array([
    // x, y, r, g, b, a - added four values for rgba color
    0, 0.5, 1, 0, 0, 1,
    -0.5, 0, 0, 1, 0, 1,
    0.5,  0, 0, 0, 1, 1,
  ]);
  await renderer.appendSceneObject(new Standard2DVertexColorObject(renderer._device, renderer._canvasFormat, vertices));
  renderer.render();
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