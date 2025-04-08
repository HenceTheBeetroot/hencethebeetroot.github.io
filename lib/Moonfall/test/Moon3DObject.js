import { Point } from 'lib/Moonfall/Moon3DObject.js'

let test1 = new Point(1, 2, 3);
console.log("point 1 created\n", test1);
let test2 = Point.add(test1, 1);
console.log("point 2 created\n", test2);
let test3 = new Point();
console.log("point 3 created\n", test3);
let test4 = new Point(test3).add(test1);
console.log("point 4 created\n", test4);
let test5 = new Point("stink", "stank", "stunk");
console.log("point 5 created\n", test5)