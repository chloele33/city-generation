import {Edge, Intersection, MapTexture} from './LSystemRoad'
import {vec2, vec3, mat4, quat} from 'gl-matrix';
import {runInNewContext} from "vm";

class City {
    cityGrid: number[][]// 2D grid of 1's and 0's. 1 if true 0 false
    roadThickness: number;
    highwayThickness: number;
    texture: MapTexture;
    edges: Edge[];
    buildingCenters: vec2[];
    buildingHeight: number;

    constructor(texture: Uint8Array, width: number, height: number) {
        this.texture = new MapTexture(texture, width, height);

    }

    rasterize(edges : Edge[], roadThickness: number, highwayThickness: number) : number[][]{
        this.highwayThickness = highwayThickness;
        this.roadThickness = roadThickness;
        this.edges = edges;
        // initial setup
        this.buildingCenters = [];
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
                if (this.texture.getElevation(i, j) == 0 && this.cityGrid[i][j] == 0) {
                    this.cityGrid[i][j] = 3;
                }
            }
        }

        // place buildings
        for (let i = 0; i < this.texture.width * 2; i++) {
            let x = Math.floor(this.texture.width * Math.random());
            let y = Math.floor(this.texture.height * Math.random());

            // check if x,y is a valid place to have a building
            let valid = true;
            if (this.texture.getPopulation(x, y) < 0.35) {
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
                this.buildingCenters.push(vec2.fromValues(x, y)); // add to the collection of building centers
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

    // grow buildings at each building center in the grid
    // returns the tranform matrices for instance rendering
    generateBuildings(floorHeight: number, buildingHeight: number, width: number, prob: number) {
        let buildingWidth = width;
        let vertices : vec2[] = [];
        let transforms : mat4[] = [];
        let buildingBlocks: BuildingPrimitive[] = [];
        for (let i = 0; i < this.buildingCenters.length; i++) {
            buildingWidth = width;
            // add population density to determine height of building
            let x = this.buildingCenters[i][0];
            let y = this.buildingCenters[i][1];
            let popDensity = this.texture.getPopulation(x, y);
            let height = buildingHeight * 2 *  popDensity * popDensity ;
            if (popDensity < 0.7) {
                height = buildingHeight   *  popDensity * popDensity;
                buildingWidth = buildingWidth * 2;

            }

            // place first primitive
            let angle = Math.random() * 2 * Math.PI;
            let first = new BuildingPrimitive(vec2.fromValues(x, y), buildingWidth/3 + buildingWidth * Math.random(), height, buildingWidth/3 + buildingWidth*Math.random(), angle);
            buildingBlocks.push(first);
            transforms.push(first.getTransform());

            // extrude downwards
            while (height > 0) {
                let random = Math.random();
                // add another building block
                if (random < prob) {
                    // find a random vertex to be the new center of the new primitive
                    let idx = Math.floor(Math.random() * buildingBlocks.length);
                    let newCenter = buildingBlocks[idx].getRandomEdgeVertex();
                    // random rotation
                    angle = Math.random() * 2 * Math.PI;
                    // create new
                    let newBlock = new BuildingPrimitive(newCenter, buildingWidth/3 + buildingWidth*Math.random(), height, buildingWidth/3 + buildingWidth*Math.random(), angle);
                    buildingBlocks.push(newBlock);
                    transforms.push(newBlock.getTransform());
                }
                // update height
                height = height - floorHeight;
            }

        }
        return transforms;
    }


}


class BuildingPrimitive {
    center: vec2;
    x_length: number;
    y_length: number;
    z_length: number;
    angle: number;
    constructor(position: vec2, x_length: number, y_length: number, z_length: number, angle: number) {
        this.center = position;
        this.x_length = x_length;
        this.y_length = y_length/2;
        this.z_length = z_length;
        this.angle = angle;


    }

    getRandomEdgeVertex() : vec2 {
        let x = 0;
        let y = 0;


        let rand = Math.floor(Math.random() * Math.floor(4));
        if (rand == 0) {
            x = this.center[0] + this.x_length/2 * Math.cos(this.angle) - this.z_length/2 *  Math.sin(this.angle);

            y = this.center[1] + this.x_length/2 * Math.sin(this.angle) + this.z_length/2 * Math.cos(this.angle);

        } else if (rand == 1) {
            x = this.center[0] + this.x_length/2 * Math.cos(this.angle) - this.z_length/2 *  Math.sin(this.angle);

            y = this.center[1] + this.x_length/2 * Math.sin(this.angle) - this.z_length/2 * Math.cos(this.angle);

        } else if (rand == 2) {
            x = this.center[0] + this.x_length/2 * Math.cos(this.angle) + this.z_length/2 *  Math.sin(this.angle);

            y = this.center[1] + this.x_length/2 * Math.sin(this.angle) + this.z_length/2 * Math.cos(this.angle);


        } else {
            x = this.center[0] + this.x_length/2 * Math.cos(this.angle) + this.z_length/2 *  Math.sin(this.angle);

            y = this.center[1] + this.x_length/2 * Math.sin(this.angle) - this.z_length/2 * Math.cos(this.angle);


        }

        return vec2.fromValues(x, y);

    }

    getTransform() {
        let translate = vec3.fromValues(this.center[0], this.y_length, this.center[1]);
        let rotQuat: quat = quat.create();
        quat.rotateY(rotQuat, rotQuat, this.angle);
        let scaleVec = vec3.fromValues(this.x_length, this.y_length, this.z_length);

        let transformationMat: mat4 = mat4.create();
        mat4.fromRotationTranslationScale(transformationMat, rotQuat, translate, scaleVec);
        return transformationMat;
    }
}

export {City, BuildingPrimitive};