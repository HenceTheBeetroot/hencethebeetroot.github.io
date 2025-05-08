import { getName } from "./General.js"

export default class Color {
    constructor (type, a, b, c) {
        switch (type) {
            case "hsv":
                // using https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB_alternative
                let k = ((n) => (n + (a / (Math.PI / 3))) % 6)
                let f = ((n) => c - c * b * Math.max(0, Math.min(k(n), 4 - k(n), 1)))
                this.r = f(5)
                this.g = f(3)
                this.b = f(1)
                break
            case "hex":
                this.r = a / 0x10000
                this.g = a / 0x100 % 0x100
                this.b = a % 0x100
                break
            case "rgb":
                this.r = a
                this.g = b
                this.b = c
                break
            default:
                console.error("Invalid args for new Color:\n", this, "\n", type, "\n", a, "\n", b, "\n", c)
                throw new Error("Invalid args!")
        }
    }

    appendData (...args) {
        for (let item of args) {
            switch (getName(item)) {
                case "collection":
                    this.collections.push(item)
                    break
                case "moonobject":
                    this.objects.push(item)
                    break
                case "string":
                    this.name = item
                    break
                default:
                    console.error("Invalid args for new Collection:\n", this, "\n", args)
                    throw new Error("Invalid args!")
            }
        }
    }

    getObjects () {
        let to_return = []
        
        for (let object of this.objects) {
            to_return.push(object)
        }
        for (let collection of this.collections) {
            to_return.concat(collection.getObjects())
        }

        return to_return
    }
}