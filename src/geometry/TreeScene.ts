import Drawable from "../rendering/gl/Drawable";
import {gl} from '../globals';
import CustomMesh from 'CustomMesh';

export default class TreeScene extends Drawable {
    indices: Uint32Array;
    positions: Float32Array;
    normals: Float32Array;
    // colors: Float32Array;

    pos =  new Array<number>();
    nor =  new Array<number>();
    // col =  new Array<number>();
    idx = new Array<number>();

    public addMesh(mesh: CustomMesh) {
        let count = this.pos.length / 4;

        this.pos = this.pos.concat(mesh.pos);
        this.nor = this.nor.concat(mesh.nor);

        for (let i = 0; i < mesh.idx.length; i++) {
            this.idx.push(mesh.idx[i] + count);
        }
    }

    create() {
        this.positions = Float32Array.from(this.pos);
        this.normals = Float32Array.from(this.nor);
        this.indices = Uint32Array.from(this.idx);


        this.generateIdx();
        this.generatePos();
        this.generateNor();
        // this.generateCol();

        this.count = this.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    }
};

