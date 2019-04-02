import {vec3, vec4, mat4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';
import * as Loader from 'webgl-obj-loader';

const deg2Rad = 0.017453292519943295769236907684886;


export default class CustomMesh extends Drawable {
    meshIdx: any;
    meshPos: any;
    meshNor: any;

    indices: Uint32Array;
    positions: Float32Array;
    normals: Float32Array;
    colors: Float32Array;
    uvs: Float32Array;
    center: vec4;
    offsets: Float32Array;

    vertList = new Array<vec4>();
    normList = new Array<vec4>();

    pos =  new Array<number>();
    nor =  new Array<number>();
    idx = new Array<number>();

    height: number;

    constructor(mesh: any) {
        super();

        this.meshIdx = mesh.indices;
        this.meshPos = mesh.vertices;
        this.meshNor = mesh.vertexNormals;

        this.create();
    }

    // update vert attr
    public updateArrays() {
        this.pos.length = 0;
        this.nor.length = 0;
        for (let i = 0; i < this.vertList.length; i++) {
            this.pos.push(this.vertList[i][0]);
            this.pos.push(this.vertList[i][1]);
            this.pos.push(this.vertList[i][2]);
            this.pos.push(this.vertList[i][3]);

            this.nor.push(this.normList[i][0]);
            this.nor.push(this.normList[i][1]);
            this.nor.push(this.normList[i][2]);
            this.nor.push(this.normList[i][3]);
        }
    }

    public rotate(deg: number, axis: vec3) {
        let rotMat = mat4.fromValues(0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0);
        mat4.fromRotation(rotMat, deg*deg2Rad, axis);

        for (let i = 0; i < this.vertList.length; i++) {
            vec4.transformMat4(this.vertList[i], this.vertList[i], rotMat);
            vec4.transformMat4(this.normList[i], this.normList[i], rotMat);
        }
        this.updateArrays();
    }


    scale(x: number, y: number, z: number) {
        for (let i = 0; i < this.vertList.length; i++) {
            this.vertList[i][0] *= x;
            this.vertList[i][1] *= y;
            this.vertList[i][2] *= z;
        }
        this.height = y;
        this.updateArrays();
    }

    translate(v: vec4) {
        for (let i = 0; i < this.vertList.length; i++) {
            this.vertList[i][0] += v[0];
            this.vertList[i][1] += v[1];
            this.vertList[i][2] += v[2];
        }
        this.updateArrays();
    }

    create() {
        let minY = 1000;
        let maxY = -1000;
        for (let i = 0; i < this.meshPos.length - 2; i += 3 ) {
            if (this.meshPos[i + 1] < minY) {
                minY = this.meshPos[i + 1];
            }

            if (this.meshPos[i + 1] > maxY) {
                maxY = this.meshPos[i + 1];
            }


            this.pos.push(this.meshPos[i]);
            this.pos.push(this.meshPos[i + 1]);
            this.pos.push(this.meshPos[i + 2]);
            this.pos.push(1);

            this.nor.push(this.meshNor[i]);
            this.nor.push(this.meshNor[i + 1]);
            this.nor.push(this.meshNor[i + 2]);
            this.nor.push(0);

            this.idx.push(this.meshIdx[i]);
            this.idx.push(this.meshIdx[i + 1]);
            this.idx.push(this.meshIdx[i + 2]);
        }
        this.height = maxY - minY;

        for (let i = 0; i < this.pos.length - 3; i += 4) {
            let vert = vec4.fromValues(this.pos[i], this.pos[i + 1], this.pos[i + 2], this.pos[i + 3]);
            this.vertList.push(vert);

            let norm = vec4.fromValues(this.nor[i], this.nor[i + 1], this.nor[i + 2], this.nor[i + 3]);
            this.normList.push(norm);
        }
    }
};

