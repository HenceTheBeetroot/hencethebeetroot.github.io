import { Point, Tri, MoonObject } from './Moon3DObject.js'

export default async function analyzeSTL(path) {
    return fetch(path)
    .then((file) => file.text())
    .then((text) => text.split('\n'))
    .then((text) => {
        let tris = []
        let normRegEx = /facet normal (-?\d\.\d+) (-?\d\.\d+) (-?\d\.\d+)/g
        let vertRegEx = /vertex (-?\d\.\d+) (-?\d\.\d+) (-?\d\.\d+)/g
    
        let normal = normRegEx.exec(text)
        do {
            normal = new Point(parseFloat(normal[1]), parseFloat(normal[2]), parseFloat(normal[3])) // start from 1 because 0 is full string
            let points = []
            for (let i = 0; i < 3; i++) {
                let coords = vertRegEx.exec(text);
                let x = parseFloat(coords[1]);
                let y = parseFloat(coords[2]);
                let z = parseFloat(coords[3]);
                points.push(new Point(x, y, z))
            }
            tris.push(new Tri(...points, normal))
            normal = normRegEx.exec(text)
        } while (normal)

        let object = new MoonObject(...tris, getModelName(path))
        return object
    })
    .catch((e) => console.error(e))
    
    //fetch(path)
    //.then((file) => file.text())
    //.then((text) => text.replaceAll(/\s|\n/g, ""))
    //.then((text) => {
    //    return JSON.parse(text)}
    //)
    //.catch((error) => console.error(error))
}

export function getModelName(path) {
    return path.match(/\/(\w+)\.stl/)[1]
}