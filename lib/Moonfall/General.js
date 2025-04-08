import { Point } from "./Moon3DObject.js"

export function getName(x) {
    let val = x && x.constructor?
        x.objName != null?
            x.objName
        :   x.constructor.name.toLowerCase()
    :   null
    return val == null? (typeof x).toLowerCase() : val
}

export function add(...args) { return args.slice(1).reduce((acc, val) => acc + val, args[0]) }
export function sub(...args) { return args.slice(1).reduce((acc, val) => acc - val, args[0]) }
export function mul(...args) { return args.slice(1).reduce((acc, val) => acc * val, args[0]) }
export function div(...args) { return args.slice(1).reduce((acc, val) => acc / val, args[0]) }

export function dot(p0, p1) {
    return p0.x * p1.x + p0.y * p1.y + p0.z * p1.z
}

export function cross(p0, p1) {
    return new Point(
        p0.y * p1.z - p0.z * p1.y,
        p0.z * p1.x - p0.x * p1.z,
        p0.x * p1.y - p0.y * p1.x
    )
}