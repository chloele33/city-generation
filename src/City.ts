import {Edge, Intersection, MapTexture} from './LSystemRoad'
import {vec2, vec3, mat4} from 'gl-matrix';
import {runInNewContext} from "vm";

class City {
    cityGrid: number[][]// 2D grid of 1's and 0's. 1 if true 0 false
    roadThickness: number;
    highwayThickness: number;
    texture: MapTexture;
    edges: Edge[];

    constructor(texture: Uint8Array, width: number, height: number,
                roadThickness: number, highwayThickness: number) {
        this.texture = new MapTexture(texture, width, height);
        this.highwayThickness = highwayThickness;
        this.roadThickness = roadThickness;
    }

    rasterize(edges : Edge[]) : number[][]{
        this.edges = edges;
        // initial setup
        this.cityGrid = [];
        for (let i = 0; i < this.texture.width; i++) {
            let newArr = [];
            for (let j = 0; j < this.texture.height; j++) {
                // check for water
                // if (this.texture.getElevation(i, j) == 1) {
                //     newArr.push(1);
                // } else {
                     newArr.push(0);
                // }
            }
            this.cityGrid.push(newArr);
        }

        // check edges
        for (let i = 0; i < this.texture.width; i++) {
            for (let j = 0; j < this.edges.length; j++) {
                let edge = this.edges[j];
                // rasterize with i being the y coordinate
                let result: any = null; // test against result
                let ymax = Math.max(edge.startingPoint[2], edge.endPoint[2]);
                let ymin = Math.min(edge.startingPoint[2], edge.endPoint[2]);

                if (ymax >= i && ymin <= i) {
                    let my = edge.endPoint[2] - edge.startingPoint[2]; //y
                    let mx = edge.endPoint[0] - edge.startingPoint[0]; //x

                    if (mx == 0) {
                        result = edge.startingPoint[0];
                    } else if (my == 0) {
                        // midpoint
                        let x = edge.startingPoint[0] + edge.endPoint[0];
                        let y = edge.startingPoint[1] + edge.endPoint[1];
                        let z = edge.startingPoint[2] + edge.endPoint[2];
                        result = vec3.fromValues(x / 2.0, y / 2.0, z / 2.0);
                    } else {
                        let m = my / mx;
                        result = (i / m) - (edge.startingPoint[2] / m) + edge.startingPoint[2];
                    }
                }

                if (result != null) {
                    let xInt = Math.floor(result);
                    let wid = edge.size == 10 ? this.highwayThickness : this.roadThickness;

                    for (let dx = -wid; dx < wid + 1; dx++) {
                        let x = xInt + dx;
                        if (x >= 0 && x < this.texture.width) {
                            this.cityGrid[x][i] = 1;
                        }
                    }
                }

            }
        }
        return this.cityGrid;
    }


}

export {City};