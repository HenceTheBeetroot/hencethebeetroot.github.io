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
 
import PGA3D from '/lib/Math/PGA3D.js'
 
export default class Camera {
  constructor(width, height) {
    this._pose = new Float32Array(Array(16).fill(0));
    this._pose[0] = 1;
    this._focal = new Float32Array(Array(2).fill(1));
    this._resolutions = new Float32Array([width, height]);
    this._inverse = false;
  }
  
  resetPose() {
    this._pose[0] = 1;
    for (let i = 1; i < 16; ++i) this._pose[i] = 0;
    this._focal[0] = 1;
    this._focal[1] = 1;
  }
  
  updatePose(newpose) {
    for (let i = 0; i < 16; ++i) this._pose[i] = newpose[i];
  }
  
  updateSize(width, height) {
    this._resolutions[0] = width;
    this._resolutions[1] = height;
  }
  
  moveX(d) { this.applyTranslation(PGA3D.createTranslator(d, 0, 0)); }
  moveY(d) { this.applyTranslation(PGA3D.createTranslator(0, d, 0)); }
  moveZ(d) { this.applyTranslation(PGA3D.createTranslator(0, 0, d)); }
  rotateX(d) { this.applyTranslation(PGA3D.createRotor(d, 1, 0, 0)); }
  rotateY(d) { this.applyTranslation(PGA3D.createRotor(d, 0, 1, 0)); }
  rotateZ(d) { this.applyTranslation(PGA3D.createRotor(d, 0, 0, 1)); }

  scaleFocal(d) { this._focal[0] *= d; this._focal[1] *= d; }
  
  applyTranslation(dt) {
    if (this._inverse) {
      this.updatePose(PGA3D.normalizeMotor(PGA3D.geometricProduct(dt, this._pose)));
    } else {
      this.updatePose(PGA3D.normalizeMotor(PGA3D.geometricProduct(this._pose, dt)));
    }
  }
}
