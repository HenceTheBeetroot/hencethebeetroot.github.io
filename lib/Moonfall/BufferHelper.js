/*! 
 * No copyright.
 * I guess if you need it to be licensed under something for legal purposes just throw WTFPL onto it.
 * It literally took like ten minutes I could care less if someone "steals" it lol
 */

export default class BufferHelper {
    static createCircularBuffer(num, device, buffer_dict) {
        let buffers = [];
        for (let i = 0; i < num; i++) {
            let new_dict = buffer_dict;
            new_dict.label = new_dict.label + i;
            buffers.push(
                device.createBuffer(buffer_dict)
            )
        } 
        return buffers;
    }
}