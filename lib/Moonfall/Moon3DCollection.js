import { getName } from "./General.js"

export class Collection {
    constructor (...args) {
        this.collections = []
        this.objects = []
        this.name = "Moon3DCollection"
        this.appendData(...args)
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