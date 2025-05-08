import { Point } from "./Moon3DObject.js"
import { dot, cross, getName } from "./General.js"

export default class Ray {
    constructor(from, to) {
        if (from == null && to == null) {
            from = new Point(0, 0, 0)
            to = new Point(1, 0, 0)
        }
        if (getName(from) == "string") {
            switch (from) {
                case "x":
                    to = new Point(1, 0, 0)
                    break
                case "-x":
                    to = new Point(-1, 0, 0)
                    break
                case "y":
                    to = new Point(0, 1, 0)
                    break
                case "-y":
                    to = new Point(0, -1, 0)
                    break
                case "z":
                    to = new Point(0, 0, 1)
                    break
                case "-z":
                    to = new Point(0, 0, -1)
                    break
            }
            from = new Point(0, 0, 0)
        }
        if (getName(from) != "point" || getName(to) != "point") {
            console.error("Invalid args for new Ray:\n", this, "\n", from, "\n", to)
            throw new Error("Invalid args!")
        }
        this.from = from
        this.to = to
        to.sub(from).div(
            Math.sqrt(to.asArray().reduce((acc, val) => acc + val**2, 0))
        ).add(from) // normalize
    }

    getRelative() {
        return Point.sub(this.to, this.from)
    }

    getMagnitude() {
        let relative = this.getRelative()
        return Math.sqrt(relative.x ** 2 + relative.y ** 2 + relative.z ** 2)
    }

    getAngle(ray) {
        return Math.acos(dot(this.getRelative(), ray.getRelative()) / (this.getMagnitude() * ray.getMagnitude()))
    }

    rotateAlongAxis(axis, radians) {
        this.to.rotateAlongOffsetAxis(axis, this.from, radians)   
    }

    getAsRotations() {
        return {
            x: this.getAngle(new Ray("x")),
            y: this.getAngle(new Ray("y")),
            z: this.getAngle(new Ray("z"))
        }
    }

    getIntersectionOnAxisPlane(axis, offset) {
        let d
        switch (axis) {
            case "x":
                // if ray is parallel to plane
                if (this.from.y == this.to.y || this.from.z == this.to.z) {
                    return null
                }
                d = 1. * (this.from.x - offset) / (this.from.x - this.to.x)
                break
                
            case "y":
                if (this.from.z == this.to.z || this.from.x == this.to.x) {
                    return null
                }
                d = 1. * (this.from.y - offset) / (this.from.y - this.to.y)
                break
                
            case "z":
                if (this.from.x == this.to.x || this.from.y == this.to.y) {
                    return null
                }
                d = 1. * (this.from.z - offset) / (this.from.z - this.to.z)
                break
            
            default:
                console.error("Invalid args for axis-aligned plane intersection:\n", this, "\n", axis, "\n", offset)
                throw new Error("Invalid args!")
        }

        return new Collision(
            new Point(
                this.from.x + d * (this.to.x - this.from.x),
                this.from.y + d * (this.to.y - this.from.y),
                this.from.z + d * (this.to.z - this.from.z)
            ),
            d
        )
    }

    getTriIntersection(tri, continuous) {
        continuous = continuous == null? true : continuous
        let plane = tri.getPlaneArgs()
        let normal = [plane.A, plane.B, plane.C]
        if (dot(normal, this.to.asArray()) == 0) {
            // ray is parallel to triangle
            return null
        }
        dist = ((dot(normal, this.from.asArray()) + plane.C) / dot(normal, this.to.asArray()))
        if (dist < 0) {
            // triangle is "behind" ray
            return null
        }
        let intersection = (new Point(to)).mul(t).add(from)

        let v0 = Point.sub(p1, p0)
        let v1 = Point.sub(p2, p1)
        let v2 = Point.sub(p0, p2)

        sign = Math.sign(dot(normal, cross(Point.sub(intersection, v0), Point.sub(v1, v0)).asArray()))

        if (Math.sign(dot(normal, cross(Point.sub(intersection, v1), Point.sub(v2, v1)).asArray())) == -sign
        ||  Math.sign(dot(normal, cross(Point.sub(intersection, v2), Point.sub(v0, v2)).asArray())) == -sign) {
            return null
        }

        return intersection
    }

    getBoundingRectIntersectionPoints(rect, continuous) {
        continuous = continuous == null? true : continuous
        let intersections = [null, null]
        for (let s of [["x", rect.x], ["y", rect.y], ["z", rect.z]]) {
            let [axis, axis_bounds] = s
            // calculates intersection point
            let this_intersection = this.getIntersectionOnAxisPlane(axis, axis_bounds[0])
            // if intersection is a hit
            if (this_intersection.point != null && 0 <= this_intersection.distance && (continuous == true || this_intersection.distance <= 1)) {
                intersections.push(new Collision(this_intersection.point, this_intersection.distance))
            }
            // repeat for other side
            this_intersection = this.getIntersectionOnAxisPlane(axis, axis_bounds[1])
            if (this_intersection.point != null && 0 <= this_intersection.distance && (continuous == true || this_intersection.distance <= 1)) {
                intersections.push(new Collision(this_intersection.point, this_intersection.distance))
            }
        }
        if (intersections[0] == intersections[1] == null) {
            return null
        }
        return intersections.sort((a, b) => a == null? -1 : b == null? 1 : a.distance - b.distance)
    }

    getBoundingRectEntered(rect, continuous) {
        return this.getBoundingRectIntersectionPoints(rect, continuous)[0]
    }

    getBoundingRectExited(rect, continuous) {
        return this.getBoundingRectIntersectionPoints(rect, continuous)[1]
    }

    intersectsBoundingRect(rect, continuous) {
        return this.getBoundingRectEntered != null
    }

    getBoundingRectSidesIntersected(rect, continuous) {
        let intersections = this.getBoundingRectIntersectionPoints(rect, continuous)
        if (intersections[0] == null) {
            return null
        }
        let axes = []
        let epsilon = 0.0001
        for (let axis of ['x', 'y', 'z']) {
            for (let side of [0, 1]) {
                for (let i of [0, 1]) {
                    if (rect[axis][0] - intersections[i].point[axis] < epsilon) {
                        axes.push({
                            axis: axis,
                            side: side,
                            distance: intersections[i].distance
                        })
                    }
                }
            }
        }
        return axes.sort((a, b) => a == null? -1 : b == null? 1 : a.distance - b.distance)
    }

    getBoundingRectSideEntered(rect, continuous) {
        return this.getBoundingRectSidesIntersected(rect, continuous)[0]
    }

    getBoundingRectSideExited(rect, continuous) {
        return this.getBoundingRectSidesIntersected(rect, continuous)[1]
    }
}

export class Collision {
    constructor(point, dist, color) {
        this.point = point
        this.dist = dist
        this.color = color
    }

    setPoint(point) {
        this.point = point
        return this
    }
    setDist(dist) {
        this.dist = dist
        return this
    }
    setColor(color) {
        this.color = color
        return this
    }
}