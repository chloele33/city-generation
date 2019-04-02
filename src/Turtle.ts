// A Turtle class to represent the current drawing state of your L-System.
// It should at least keep track of its current position, current orientation,
// and recursion depth (how many [ characters have been found while drawing before ]s)
import { vec3, mat4, vec4, quat } from "gl-matrix";
import {readTextFile} from './globals';

const deg2Rad = 0.017453292519943295769236907684886;


class Turtle {
    pos: vec4;
    orient: vec4;
    forward: vec4;
    depth: number;
    alive: boolean;
    iteration: number;

    // up: vec3;
    // forward: vec3;
    // left: vec3;

    constructor(pos: vec4, orient: vec4, depth: number, iteration: number) {
        let tempPos = vec4.create();
        vec4.add(tempPos, tempPos, pos);
        this.pos = pos;

        let tempOrient = vec4.create();
        vec4.add(tempOrient, tempOrient, orient);
        this.orient = orient;

        let tempDepth = 0;
        tempDepth = tempDepth + depth;
        this.depth = depth;
        this.alive = true;
        this.iteration = iteration;
    }

    moveForward(d: number) {
        let dist = vec4.create();
        vec4.multiply(dist, [d, d, d, 1], this.orient);
        vec4.add(this.pos, this.pos, dist);
        this.depth++;
        return this.pos;
    }

    public rotate(axis: vec3, deg: number) {
        let rotmat = mat4.fromValues(0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0);

        let rad = deg2Rad * deg;
        mat4.fromRotation(rotmat, rad, axis);
        vec4.transformMat4(this.orient, this.orient, rotmat);
        vec4.normalize(this.orient, this.orient);
        return this.orient;
    }

    getTranslationMatrix() : mat4 {
        let translation: vec4 = vec4.fromValues(this.pos[0], this.pos[1], this.pos[2], this.pos[3]);
        let matrix = mat4.create();
        let identity = mat4.create();
        mat4.identity(identity);
        mat4.translate(matrix, identity, vec3.fromValues(translation[0], translation[1], translation[2]));
        return matrix;
    }

    getTransformation() : mat4 {
        // prepare translation matrix
        let translation: vec4 = vec4.fromValues(this.pos[0], this.pos[1], this.pos[2], this.pos[3]);
        let translationMat = mat4.create();
        let identity = mat4.create();
        mat4.identity(identity);
        mat4.translate(translationMat, identity, vec3.fromValues(translation[0], translation[1], translation[2]))

        // prepare rotation mat
        let baseDir: vec3 = vec3.fromValues(0, 1, 0);
        let forwardDir: vec3 = vec3.fromValues(this.orient[0], this.orient[1], this.orient[2]);

        let rotAxis = vec3.create();
        vec3.cross(rotAxis, baseDir, forwardDir);

        let theta = Math.acos(vec3.dot(baseDir, forwardDir) / (vec3.length(baseDir) * vec3.length(forwardDir)));

        let rotMatrix = mat4.create();
        mat4.fromRotation(rotMatrix, theta, rotAxis);

        //prepare scale mat
        let xScale = 10.0 * Math.pow((1 / this.depth), 1.3);
        let zScale = 10.0 * Math.pow((1 / this.depth), 1.3);
        let scaleMat = mat4.create();
        let i = mat4.create()
        mat4.identity(i);
        mat4.scale(scaleMat, i, vec3.fromValues(xScale, 1, zScale));

        let transform = mat4.create();
        mat4.multiply(transform, translationMat, rotMatrix);
        mat4.multiply(transform, transform, scaleMat);
        return transform;
    }


}

class TurtleStack {
    list = new Array<Turtle>();

    public push(turtle: Turtle) {
        this.list.push(turtle);
    }

    public pop(): Turtle {
        return this.list.pop();
    }

    public size(): number {
        return this.list.length;
    }
}

export {Turtle, TurtleStack};
