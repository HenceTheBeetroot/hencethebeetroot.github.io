/*! 
 * No copyright.
 * I guess if you need it to be licensed under something for legal purposes just throw WTFPL onto it.
 */

export default class GeometryHelper {
    static createPolygon(sides, radius, center = 0xFF000000, edge = 0xFF000000) {
        /** Given a number of sides and a radius, returns a set of points representing a regular polygon made of triangles. Accepts separate ARGB hexadecimal values for center and edges, or defaults to black if unspecified. */
        if (sides < 3) { console.error("Polygon must have at least three sides!"); }
        if (radius < 0) { console.error("Radius must be nonnegative!"); }
        const angle = (Math.PI / 2) * (1 - (2 / sides));
        var values = [];
        
        const bc = (center % 0x100) / 0xFF
        const gc = (Math.floor(center / 0x100) % 0x100) / 0xFF
        const rc = (Math.floor(center / 0x10000) % 0x100) / 0xFF
        const ac = (Math.floor(center / 0x1000000) % 0x100) / 0xFF
    
        const be = (edge % 0x100) / 0xFF
        const ge = (Math.floor(edge / 0x100) % 0x100) / 0xFF
        const re = (Math.floor(edge / 0x10000) % 0x100) / 0xFF
        const ae = (Math.floor(edge / 0x1000000) % 0x100) / 0xFF
        
        for (var i = 0; i < sides; i++) {
          var x1 = 1 / Math.tan(angle); // Define base of triangle
          var y = 1 / Math.sqrt(Math.pow(x1, 2) + 1); // Normalize variable (this comes first because former val of x is not saved, but former val of y is known to be one)
          x1 *= y // (conveniently, y can be used to normalize x since it was 1 before)
          var x2 = -x1; // Duplicate and reflect
          var to_rotate = i * 2 * Math.PI / sides;
          var x1_f = x1 * Math.cos(to_rotate) - y * Math.sin(to_rotate); // Rotate appropriately
          var y1_f = x1 * Math.sin(to_rotate) + y * Math.cos(to_rotate);
          var x2_f = x2 * Math.cos(to_rotate) - y * Math.sin(to_rotate); // ...and again for the other one
          var y2_f = x2 * Math.sin(to_rotate) + y * Math.cos(to_rotate);
          x1_f *= radius; // Extend points to radius
          x2_f *= radius;
          y1_f *= radius;
          y2_f *= radius;
          
          values.push(
            0, 0, rc, gc, bc, ac, // Center point
            x1_f, y1_f, re, ge, be, ae,
            x2_f, y2_f, re, ge, be, ae
          ); // And just repeat that for each side!
        }
    
        // Finally, return results
        return new Float32Array(values);
      }
}