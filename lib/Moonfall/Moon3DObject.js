export class Point {
    constructor (...args) {
        switch (args.length) {
            case 1: // single arg (duplicate point)
                this.x = args[0].x
                this.y = args[0].y
                this.z = args[0].z
                return this
            case 3: // three args (point by vals)
                this.x = args[0]
                this.y = args[1]
                this.z = args[2]
                return this
            default: // empty/invalid args
                this.x = 0
                this.y = 0
                this.z = 0
                return this
        }
    }
    toArray () {
        return Float32Array(this.x, this.y, this.z)
    }
    getNormalized () {
        return normalize(this)
    }
    
    add (x, y, z) {
        console.log(x, typeof(x))
        console.log(y, typeof(y))
        console.log(z, typeof(z))
        if (typeof(x) == "Point") { console.log("detected point, decompiling"); return this.add(x.x, x.y, x.z) }
        if (typeof(y) == "undefined") { y = x }
        if (typeof(z) == "undefined") { z = x }
        this.x += x
        this.y += y
        this.z += z
        return this
    }
    static add (p1, p2) {
        console.log("static point add")
        return new Point(p1).add(p2)
    }
    sub (x, y, z) {
        if (typeof(p) == "Point") return this.sub(p.x, p.y, p.z)
        this.x -= x
        this.y -= y
        this.z -= z
        return this
    }
    static sub (p1, p2) {
        return new Point(p1).sub(p2)
    }
    mul (x, y, z) {
        if (typeof(p) == "Point") return this.mul(p.x, p.y, p.z)
        this.x *= x
        this.y *= y
        this.z *= z
        return this
    }
    static mul (p1, p2) {
        return new Point(p1).mul(p2)
    }
    div (x, y, z) {
        if (typeof(p) == "Point") return this.div(p.x, p.y, p.z)
        this.x /= x
        this.y /= y
        this.z /= z
        return this
    }
    static div (p1, p2) {
        return new Point(p1).div(p2)
    }    

    static normalize (p) {
        return normalize(p.x, p.y, p.z)
    }

    static normalize (x, y, z) {
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
        switch (args.length) {
            case 0:
            case 1:
            case 2: // empty/invalid args
                this.points = [
                    new Point(1, 0, 0),
                    new Point(0, 1, 0),
                    new Point(0, 0, 1)
                ]
                break
            default: // 3+ points
                this.points = points
        }
    }
    getLines () {
        let lines = []
        for (let i = 0; i < length(this.points) - 1; i ++) {
            lines.append(Line.new(this.points[i], this.points[i + 1]))
        }
    }
}