import {Edge, Intersection, MapTexture} from './LSystemRoad'
import {vec2, vec3, mat4} from 'gl-matrix';
import {runInNewContext} from "vm";

class City {
    cityGrid: number[][]// 2D grid of 1's and 0's. 1 if true 0 false
    roadThickness: number;
    highwayThickness: number;
    texture: MapTexture;
    edges: Edge[];

    constructor(texture: Uint8Array, width: number, height: number) {
        this.texture = new MapTexture(texture, width, height);

    }

    rasterize(edges : Edge[], roadThickness: number, highwayThickness: number) : number[][]{
        this.highwayThickness = highwayThickness;
        this.roadThickness = roadThickness;
        this.edges = edges;
        // initial setup
        this.cityGrid = [];
        for (let i = 0; i < this.texture.width; i++) {
            let newArr = [];
            for (let j = 0; j < this.texture.height; j++) {
                     newArr.push(0);
            }
            this.cityGrid.push(newArr);
        }
        // check for roads
        for (let i = 0; i < this.edges.length; i++) {
            let edge = this.edges[i];
            let ep = edge.endPoint;
            let sp = edge.startingPoint;

            let ymin = Math.min(ep[2], sp[2]);
            let ymax = Math.max(ep[2], sp[2]);
            let xmin = Math.min(ep[0], sp[0]);
            let xmax = Math.max(ep[0], sp[0]);

            let width = edge.size == 10 ? this.highwayThickness : this.roadThickness;


            if (ymin == ymax) {
                for (let x = Math.floor(xmin); x <= Math.ceil(xmax); x++) {
                    for (let y = Math.floor(ymin - width); y <= Math.floor(ymax + width); y++) {
                        if (x >= 0 && x < this.texture.width && y >= 0 && y < this.texture.height) {

                            this.cityGrid[x][y] = 1;
                        }                    }
                }
            } else if (xmin == xmax) {
                for (let x = Math.floor(xmin - width); x <= Math.floor(xmax + width); x++) {
                    for (let y = Math.floor(ymin); y <= Math.ceil(ymax); y++) {
                        if (x >= 0 && x < this.texture.width && y >= 0 && y < this.texture.height) {

                            this.cityGrid[x][y] = 1;
                        }
                    }
                }
            }
            else {
                let m = (ep[2] - sp[2]) /
                    (ep[0] - sp[0]);
                 let x1 = sp[0];
                 let y1 = sp[2] ;

                for (let y = Math.floor(ymin); y <= Math.ceil(ymax ); y++) {
                    let xInt = x1 + (y - y1) / m;
                    for (let x = Math.floor(xInt - width); x <= Math.ceil(xInt + width); x++) {
                        //let yInt = y1 + (xInt - x1) * m;
                        //for (let dy = Math.floor(yInt - width); dy <= Math.ceil(yInt + width); dy++) {
                            if (x >= 0 && x < this.texture.width && y >= 0 && y < this.texture.height) {
                                this.cityGrid[x][y] = 1;
                            }
                        //}
                    }
                }

                for (let x = Math.floor(xmin); x <= Math.ceil(xmax ); x++) {
                    let yInt = y1 + (x - x1) * m;
                    for (let y = Math.floor(yInt - width); y <= Math.ceil(yInt + width); y++) {
                        if (x >= 0 && x < this.texture.width && y >= 0 && y < this.texture.height) {
                            this.cityGrid[x][y] = 1;
                        }

                    }
                }

            }

        }
        // check water
        for (let i = 0; i < this.texture.width; i++) {
            for (let j = 0; j < this.texture.height; j++) {
                if (this.texture.getElevation(i, j) == 0) {
                    this.cityGrid[i][j] = 1;
                }
            }
        }

        // place buildings
        for (let i = 0; i < this.texture.width * 4; i++) {
            let x = Math.floor(this.texture.width * Math.random());
            let y = Math.floor(this.texture.height * Math.random());

            // check if x,y is a valid place to have a building
            let valid = true;
            if (this.texture.getPopulation(x, y) < 0.055) {
                valid = false;
            }
            let radius = 5;
            for (let j = x - radius; j < x + radius + 1; j++) {
                for (let k = y - radius; k < y + radius + 1; k++) {
                    if (j >= 0 && j < this.texture.width && k >= 0 && k < this.texture.height) {
                        if (this.cityGrid[j][k] != 0) {
                            valid = false;
                        }
                    }
                }
            }
            // draw point if valid
            if (valid) {
                console.log("HI");
                for (let j = x - radius; j <  x + radius + 1; j++) {
                    for (let k: number = y - radius; k < y + radius + 1; k++) {
                        if (j >= 0 && j < this.texture.width && k >= 0 && k < this.texture.height) {
                            this.cityGrid[j][k] = 2;
                        }
                    }
                }
            }


        }
        return this.cityGrid;
    }


}

export {City};