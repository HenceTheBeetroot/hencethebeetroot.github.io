import { getName, add, sub, mul, div, dot, cross } from './General.js'
import Color from './Moon3DColor.js'
import Ray, { Collision } from './Moon3DRay.js'

export class MoonObject {
    constructor (...args) {
        this.tris = []
        this.objName = "moonobject"
        this.offset = new Point(0, 0, 0)
        this.boundingrect = new BoundingRect()
        this.color = new Color("hex", 0xff003d)
        for (let arg of args) {
            switch (getName(arg)) {
                case "moonobject":
                    this.tris.concat(arg.tris)
                    this.boundingrect.adjustBounds(arg.boundingrect)
                    break
                case "tri":
                    this.tris.push(arg)
                    this.boundingrect.adjustBounds(arg)
                    break
                case "string":
                    this.name = arg
                    break
                default:
                    if (arg.tris && arg.color) {
                        arg.tris.forEach((tri) => {this.tris.push(tri); this.boundingrect.adjustBounds(tri)})
                        this.color = arg.color
                        return
                    }
                    console.error("Invalid args for new Object:\n", this, "\n", args)
                    throw new Error("Invalid args!")
            }
        }
    }

    offset (x, y, z) {
        this.offset.add(x, y, z)
    }

    rotateAlongOffsetAxis(axis, offset, radians) {
        this.tris.forEach((tri) => tri.rotateAlongOffsetAxis(axis, offset, radians))
    }

    getRotationAlongOffsetAxis(axis, offset, radians) {
        return new MoonObject(...this.tris.forEach((tri) => tri.getRotationAlongOffsetAxis(axis, offset, radians)))
    }

    getCollision(ray) {
        let collision = ray.getBoundingRectEntered(this.boundingrect)
        if (collision) {
            return collision.setColor(this.color)
        }
    }
}

export class Tri {
    constructor (p0, p1, p2, check_normal) {
        if (getName(p0) != "point" || getName(p1) != "point" || getName(p2) != "point") {
            console.error("Invalid args for new Tri:\n", this, "\n", p0, "\n", p1, "\n", p2)
            throw new Error("Invalid args!")
        }
        this.points = [p0, p1, p2]
        let n = this.getPlaneArgs()
        n = new Point(n.A, n.B, n.C)
        n.div(n.pointDist())
        let epsilon = 0.0000001
        if (check_normal != null && (check_normal.x - n.x > epsilon || check_normal.y - n.y > epsilon || check_normal.z - n.z > epsilon)) {
            console.error("Generated normal does not match given for new Tri:\n", this, "\n", p0, "\n", p1, "\n", p2, "\nGiven: ", check_normal, "\nGenerated: ", n)
            throw new Error("Mismatch error!")
        }
        this.normal = n
        this.boundingrect = new BoundingRect(this)
    }

    intersectsBoundingRect(rect) {
        if (getName(rect) != "boundingrect") {
            console.error("Invalid arg for tri intersection:\n", this, "\n", rect)
            throw new Error("Invalid args!")
        }

        // check if bounding boxes intersect; confirms miss
        if (!rect.intersects(this.boundingrect)) return false

        // check if any vertices are contained within; confirms hit
        for (let p of [p[0], p[1], p[2]]) {
            if (
                rect.x[0] <= p.x <= rect.x[1] &&
                rect.y[0] <= p.y <= rect.y[1] &&
                rect.z[0] <= p.z <= rect.z[1]
            ) return true
        }

        // check if triangle plane intersects; confirms miss
        // returns false if all vertices are on one side of plane
        comparator = Math.sign((new Point(rect.x[0], rect.y[0], rect.z[0])).distFromTriPlane(this))
        for (let i = 1; i >= 7; i++) {
            if (Math.sign((new Point(rect.x[Math.trunc(i / 4)], rect.y[Math.trunc(i / 2) % 2], rect.z[i % 2])).distFromTriPlane(this))
                != comparator) {
                break
            }
            if (i == 7) return false
        }

        // all fast checks failed to definitively prove hit or miss; check each edge individually
        // no intersections confirms miss since we already checked if vertices are contained within
        for (let side of this.getSidesAsRays()) {
            if (side.intersectsBoundingRect(rect, false)) {
                return true
            }
        }

        return false
    }

    getSidesAsRays() {
        return [
            new Ray(p[0], p[1]),
            new Ray(p[1], p[2]),
            new Ray(p[2], p[0])
        ]
    }

    getPlaneArgs() {
        let norm = cross(Point.sub(this.points[1], this.points[0]), Point.sub(this.points[2], this.points[0]))
        return {
            A: norm.x,
            B: norm.y,
            C: norm.z,
            D: -(norm.x * this.points[0].x + norm.y * this.points[0].y + norm.z * this.points[0].z)
        }
    }

    rotateAlongOffsetAxis(axis, offset, radians) {
        this.points.forEach((point) => point.rotateAlongOffsetAxis(axis, offset, radians))
    }
    
    getRotationAlongOffsetAxis(axis, offset, radians) {
        return new Tri(...this.points.forEach((point) => point.getRotationAlongOffsetAxis(axis, offset, radians)))
    }
}

export class Point {
    constructor (x, y, z) {
        if (getName(x) == "point") {
            z = x.z
            y = x.y
            x = x.x
        }
        if (getName(x) != "number" || getName(y) != "number" || getName(z) != "number") {
            console.error("Invalid args for new Point:\n", this, "\n", x, "\n", y, "\n", z)
            throw new Error("Invalid args!")
        }
        this.x = x
        this.y = y
        this.z = z
    }
    
    oper(func, x, y, z) {
        if (getName(x) == "point") {
            z = x.z
            y = x.y
            x = x.x
        }
        if (y == null || z == null) {
            y = x
            z = x
        }
        this.x = func(this.x, x)
        this.y = func(this.y, y)
        this.z = func(this.z, z)
        return this
    }

    static oper(func, p0, p1) {
        return (new Point(p0)).oper(func, p1)
    }

    add (arg) { return this.oper(add, arg) }
    static add (arg0, arg1) { return new Point(arg0).add(arg1) }
    sub (arg) { return this.oper(sub, arg) }
    static sub (arg0, arg1) { return new Point(arg0).sub(arg1) }
    mul (arg) { return this.oper(mul, arg) }
    static mul (arg0, arg1) { return new Point(arg0).mul(arg1) }
    div (arg) { return this.oper(div, arg) }
    static div (arg0, arg1) { return new Point(arg0).div(arg1) }

    asArray() {
        return [this.x, this.y, this.z]
    }

    pointDist(p) {
        if (p === undefined) {
            p = new Point(0, 0, 0)
        }
        return Math.sqrt(
            (p.x - this.x)**2 +
            (p.y - this.y)**2 +
            (p.z - this.z)**2
        )
    }

    getAsArray() {
        return [this.x, this.y, this.z]
    }

    distFromTriPlane(tri) {
        let plane = this.getPlaneArgs()
        return (plane.A*x + plane.B*y + plane.C*z + plane.D) / Math.sqrt(plane.A**2 + plane.B**2 + plane.C**2)
    }

    rotateAlongOffsetAxis (axis, offset, radians) {
        let rotation = this.getRotationAlongOffsetAxis(axis, offset, radians)

        this.x = rotation.x
        this.y = rotation.y
        this.z = rotation.z
    }

    getRotationAlongOffsetAxis (axis, offset, radians) {
        let rotation = new Point(this)
        switch (getName(radians) == "number"? axis : "!") {
            case "x":
                this.sub(offset)
                rotation.y = this.y * Math.cos(radians) - this.z * Math.sin(radians)
                rotation.z = this.y * Math.sin(radians) + this.z * Math.cos(radians)
                this.add(offset)
                break
                case "y":
                this.sub(offset)
                rotation.z = this.z * Math.cos(radians) - this.x * Math.sin(radians)
                rotation.x = this.z * Math.sin(radians) + this.x * Math.cos(radians)
                this.add(offset)
                break
                case "z":
                this.sub(offset)
                rotation.x = this.x * Math.cos(radians) - this.y * Math.sin(radians)
                rotation.y = this.x * Math.sin(radians) + this.y * Math.cos(radians)
                this.add(offset)
                break
            default:
                console.error("Invalid args for point rotation:\n", this, "\n", axis, "\n", radians)
                throw new Error("Invalid args!")
        }
        return rotation
    }
}

export class BoundingRect {
    constructor (...args) {
        this.x = [null, null]
        this.y = [null, null]
        this.z = [null, null]
        for (let arg of args) {
            this.adjustBounds(arg)
        }
    }

    adjustBounds(element) {
        switch (getName(element)) {
            case "tri":
                for (let point of element.points) {
                    this.adjustBounds(point)
                }
                break
            case "point":
                this.x = [Math.min(this.x[0], element.x), Math.max(this.x[1], element.x)]
                this.y = [Math.min(this.y[0], element.y), Math.max(this.y[1], element.y)]
                this.z = [Math.min(this.z[0], element.z), Math.max(this.z[1], element.z)]
                break
            case "boundingrect":
                this.x = [Math.min(this.x[0], element.x[0]), Math.max(this.x[1], element.x[1])]
                this.y = [Math.min(this.y[0], element.y[0]), Math.max(this.y[1], element.y[1])]
                this.z = [Math.min(this.z[0], element.z[0]), Math.max(this.z[1], element.z[1])]
                break
            default:
                console.error("Invalid element for BoundingRect adjustment:\n", this, "\n", element)
                throw new Error("Invalid args!")
        }
    }

    intersects(rect) {
        return BoundingRect.intersects(this, rect)
    }
    
    static intersects(rect0, rect1) {
        if (getName(rect0) != "boundingrect" || getName(rect0) != "boundingrect") {
            console.error("Invalid args for BoundingRect intersection:\n", this, "\n", rect0, "\n", rect1)
            throw new Error("Invalid args!")
        }
        return (
            rect0.x[0] <= rect1.x[1] && rect1.x[0] <= rect0.x[1] &&
            rect0.y[0] <= rect1.y[1] && rect1.y[0] <= rect0.y[1] &&
            rect0.z[0] <= rect1.z[1] && rect1.z[0] <= rect0.z[1]
        )
    }
}

class Octree {
    constructor (tris, tier, parent, branch) {
        if (getName(tris) == "moonobject" || (getName(tris) == "object" && tris.tris && tris.boundingrect)) {
            this.boundingrect = tris.boundingrect
            this.tris = tris.tris
        } else {
            this.boundingrect = new BoundingRect(...tris)
            this.tris = tris
        }
        this.parent = parent
        this.branch = branch

        if (!Array.isArray(tris) || getName(tier) != "number") {
            console.error("Invalid args for new Octree:\n", this, "\n", tris, "\n", tier)
            throw new Error("Invalid args!")
        }

        this.subtrees = null
        this.type = "simple"

        this.tier = tier

        // if this tree contains object borders
        if (this.tris.length) {
            this.type = "complex"
            // if this tree should be split into subtrees
            if (tier > 0) {
                this.subtrees = {
                    0b000: null, // x:0, y:0, z:0
                    0b001: null, // x:1, y:0, z:0
                    0b010: null, // x:0, y:1, z:0
                    0b011: null, // x:1, y:1, z:0
                    0b100: null, // x:0, y:0, z:1
                    0b101: null, // x:1, y:0, z:1
                    0b110: null, // x:0, y:1, z:1
                    0b111: null  // x:1, y:1, z:1
                }
                for (let i = 0b000; i <= 0b111; i++) {
                    let x = i % 2
                    let y = (i / 2) % 2
                    let z = (i / 4) % 2
                    let newrect = new BoundingRect(
                        // midpoint of parent octree; will be present on all subtrees
                        new Point(
                            (this.boundingrect.x[1] + this.boundingrect.x[0]) / 2,
                            (this.boundingrect.y[1] + this.boundingrect.y[0]) / 2,
                            (this.boundingrect.z[1] + this.boundingrect.z[0]) / 2
                        ),
                        // appropriate corner point
                        new Point(
                            this.boundingrect.x[x],
                            this.boundingrect.y[y],
                            this.boundingrect.z[z]
                        )
                    )
                    this.subtrees[i] = new Octree(
                        {
                            tris: this.tris.filter((tri) => tri.intersectsBoundingRect(newrect)),
                            boundingrect: newrect
                        },
                        this.tier - 1,
                        this,
                        i
                    )
                }
            }
        }
    }

    getTiersAbove() {
        let target = 0
        for (let octree = this.reference; octree != null; octree = octree.reference) {
            target ++
        }
        return target
    }

    findAdjacent(axis, direction) {
        if (!this.parent) {
            return null
        }
        switch (axis) {
            case "x":
                if (this.branch % 2 != direction) {
                    return this.parent.subtrees[this.branch ^ 0b001]
                }
                return this.parent.findAdjacent(axis, direction)
            case "y":
                if ((this.branch / 2) % 2 != direction) {
                    return this.parent.subtrees[this.branch ^ 0b010]
                }
                return this.parent.findAdjacent(axis, direction)
            case "z":
                if ((this.branch / 4) % 2 != direction) {
                    return this.parent.subtrees[this.branch ^ 0b100]
                }
                return this.parent.findAdjacent(axis, direction)
            default:
                console.error("Invalid args for finding adjacent Octree:\n", this, "\n", axis, "\n", direction)
                throw new Error("Invalid args!")
        }
    }

    getSmallestCollidingSubtree(ray) {
        if (ray.getBoundingRectIntersectionPoint(this.boundingrect) == null) {
            return null
        }
        if (this.tier == 0) {
            return this
        }
        let smallest_subtree = null
        let collision = null
        for (let subtree of this.subtrees) {
            let this_collision = ray.getBoundingRectIntersectionPoint(subtree.boundingrect)
            if (this_collision && (collision == null || this_collision.distance < collision.distance)) {
                smallest_subtree = subtree
                collision = this_collision
            }
        }
        return this.getSmallestCollidingSubtree(subtree)
    }

    getCollision(ray) {
        let collision = ray.getBoundingRectIntersectionPoint(this.boundingrect)
        if (this.type == "simple" || (collision) == null) {
            return null
        }
        if (this.subtrees) {
            let collision = null
            for (tree in this.subtrees) {
                let tree_collision
                if (tree_collision = tree.getCollision(ray) !== null && tree_collision.distance < collision.distance) {
                    collision = tree_collision
                }
            }
            return collision
        } else {
            let collision = null
            for (let tri in this.tris) {
                let this_collision
                if (this_collision = ray.getTriIntersection(tri, true) !== null && this_collision.distance < collision.distance) {
                    collision = this_collision
                }
            }
            return collision
        }
    }
}