import { getName } from '../General.js'

export class Point {
    constructor (...args) {
        if (getName(args[0]) == "undefined") { args[0] = 0 }
        if (getName(args[1]) == "undefined") { args[1] = 0 }
        if (getName(args[2]) == "undefined") { args[2] = 0 }
        if (getName(args[0]) == "point") {
            this.x = args[0].x
            this.y = args[0].y
            this.z = args[0].z
        } else if (getName(args[0]) == "number" && getName(args[1]) == "number" && getName(args[2]) == "number") {
            this.x = args[0]
            this.y = args[1]
            this.z = args[2]
        } else {
            throw new Error("No valid Point constructor found for [ " +
                args[0] + " (" + getName(args[0]) + "), " +
                args[1] + " (" + getName(args[1]) + "), " +
                args[2] + " (" + getName(args[2]) + ") ]")
        }

        return this
    }
    toArray () {
        return Float32Array(this.x, this.y, this.z)
    }
    getNormalized () {
        return normalize(this)
    }
    
    add (x, y, z) {
        if (getName(x) == "point") {
            return this.add(x.x, x.y, x.z)
        }
        if (getName(x) == "number" && getName(y) == "undefined" && getName(z) == "undefined") {
            y = z = x
        }
        if (getName(x) != "number" || getName(y) != "number" || getName(z) != "number") {
            throw new Error("Cannot add [ ",
                x, "(" + getName(x) + "), ", 
                y, "(" + getName(y) + "), ", 
                z, "(" + getName(z) + ") ] to point"
            )
        }
        this.x += x
        this.y += y
        this.z += z
        return this
    }
    static add (p1, p2) {
        return new Point(p1).add(p2)
    }
    sub (x, y, z) {
        if (getName(x) == "point") {
            return this.sub(x.x, x.y, x.z)
        }
        if (getName(x) == "number" && getName(y) == "undefined" && getName(z) == "undefined") {
            y = z = x
        }
        if (getName(x) != "number" || getName(y) != "number" || getName(z) != "number") {
            throw new Error("Cannot sub [ ",
                x, "(" + getName(x) + "), ", 
                y, "(" + getName(y) + "), ", 
                z, "(" + getName(z) + ") ] from point"
            )
        }
        this.x -= x
        this.y -= y
        this.z -= z
        return this
    }
    static sub (p1, p2) {
        return new Point(p1).sub(p2)
    }
    mul (x, y, z) {
        if (getName(x) == "point") {
            return this.mul(x.x, x.y, x.z)
        }
        if (getName(x) == "number" && getName(y) == "undefined" && getName(z) == "undefined") {
            y = z = x
        }
        if (getName(x) != "number" || getName(y) != "number" || getName(z) != "number") {
            throw new Error("Cannot multiply [ ",
                x, "(" + getName(x) + "), ", 
                y, "(" + getName(y) + "), ", 
                z, "(" + getName(z) + ") ] with point"
            )
        }
        this.x *= x
        this.y *= y
        this.z *= z
        return this
    }
    static mul (p1, p2) {
        return new Point(p1).mul(p2)
    }
    div (x, y, z) {
        if (getName(x) == "point") {
            return this.div(x.x, x.y, x.z)
        }
        if (getName(x) == "number" && getName(y) == "undefined" && getName(z) == "undefined") {
            y = z = x
        }
        if (getName(x) != "number" || getName(y) != "number" || getName(z) != "number") {
            throw new Error("Cannot divide [ ",
                x, "(" + getName(x) + "), ", 
                y, "(" + getName(y) + "), ", 
                z, "(" + getName(z) + ") ] from point"
            )
        }
        if (x == 0 || y == 0 || z == 0) {
            console.log("WARN: dividing point by one or more zero values ( " + 
                x + ", " +
                y + ", " +
                z + " ) (will create infinite dimensions)"
            )
        }
        this.x /= x
        this.y /= y
        this.z /= z
        return this
    }
    static div (p1, p2) {
        return new Point(p1).div(p2)
    }    

    static normalize (x, y, z) {
        if (getName(x) == "point") {
            return normalize(x.x, x.y, x.z)
        }
        return Float32Array(
            x / Math.sqrt(x ** 2 + y ** 2 + z ** 2),
            y / Math.sqrt(x ** 2 + y ** 2 + z ** 2),
            z / Math.sqrt(x ** 2 + y ** 2 + z ** 2)
        )
    }
}

export class Line {
    constructor (...args) {
        switch (args.length) {
            case 1: // one arg
                this.p1 = args[0]
                this.p2 = new Point()
                break
            case 2: // two args
                this.p1 = args[0]
                this.p2 = args[1]
                break
            case 0: // empty/invalid args
                this.p1 = new Point()
                this.p2 = new Point()
        }
    }
    getNormalized () {
        return Line(new Point(), new Point())
    }
    getOffset (p) {
        return Line(this.p1.offset(p), this.p2.offset(p))
    }
}

export class Polygon {
    constructor (...args) {
        this.points = args.filter((arg) => getName(arg) == "point")
        switch (this.points.length) {
            case 0:
            case 1:
            case 2: // empty/invalid args
                this.points = [
                    new Point(1, 0, 0),
                    new Point(0, 1, 0),
                    new Point(0, 0, 1)
                ]
                break
        }
    }
    getLines () {
        let lines = []
        for (let i = 0; i < length(this.points) - 1; i ++) {
            lines.append(Line.new(this.points[i], this.points[i + 1]))
        }
    }
}

export class Shape {
    constructor (...args) {
        this.polygons = args.filter((arg) => getName(arg) == "polygon")
        switch (this.polygons.length) {
            case 0:
            case 1:
            case 2:
            case 3:
                this.polygons = [
                    
                ]
        }
    }
}