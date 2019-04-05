import ExpansionRule from './ExpansionRule';
import {Turtle, TurtleStack} from './Turtle'
import DrawingRule from './DrawingRule';
import  TreeScene  from "./geometry/TreeScene";
import {vec2, vec3, vec4, mat4, quat} from "gl-matrix";
import CustomMesh from './geometry/CustomMesh';
import {readTextFile} from './globals';

class LSystemRoad {
    currTurtle: Turtle;
    turtleStack: TurtleStack;
    roadTurtleStack: TurtleStack;
    mapTexture: MapTexture;
    turtleStackHighway: TurtleStack;
    highwayLength: number; // distance to move forward
    population_threshold: number;
    highwayAngle: number;
    globalMaxPop: number;

    // Store your roads as sets of edges and intersections
    edges: Edge[];
    intersections: Intersection[];
    intersectionsSet: Set<number[]>;
    highwaySize: number;
    roadLength: number;
    roadSize: number;
    iterations: number;
    snap_coefficient: number;
    extension_coefficient: number;



    constructor (textureData: Uint8Array, texWidth: number, texHeight: number) {
        //Your Turtle will begin from a random point in the bounds of your screen.
        let randPos = vec4.fromValues(Math.random() - 0.5, Math.random() - 0.5, 1, 1);
        let orient = vec4.fromValues(0, 1, 0, 0);
        this.mapTexture = new MapTexture(textureData, texWidth, texHeight);
        this.currTurtle = new Turtle(randPos, orient, 0, 0);
        this.edges = [];
        this.intersections = [];
        this.intersectionsSet = new Set<number[]>();
        this.turtleStack = new TurtleStack(); //for highway turtles
        this.roadTurtleStack = new TurtleStack(); //for road turtles
        this.population_threshold = 0.8;
        this.highwaySize = 10;
        this.globalMaxPop = 0.0;
        this.roadSize = 5;

        // //
        // this.edges.push(new Edge(vec3.fromValues(2000, 0, 0), vec3.fromValues(0,0, 2000), 5));
        // //this.edges.push(new Edge(vec3.fromValues(0, 0, 2000), vec3.fromValues(2000,0, 0), 15));
        //
        // let newPoint = this.addRoadToNetwork(vec3.fromValues(0, 0, 0),vec3.fromValues(2000,0, 2000),5 );
        // this.edges.push(new Edge(vec3.fromValues(0, 0, 0), newPoint, 5));

        // this.growHighway();
        // this.growRoads();

    }

    run( highwayLength: number,
         highwayAngle: number, roadLength:number, iterations: number, snap_coefficient: number,
         extension_coefficient: number) {
        this.iterations = iterations;
        this.roadLength = roadLength;
        this.highwayAngle = highwayAngle;
        this.highwayLength = highwayLength;
        this.snap_coefficient = snap_coefficient;
        this.extension_coefficient = extension_coefficient;

        this.growHighway();
        this.growRoads();
    }

    // generate highway system
    growHighway() {
        // Turtle will begin from arbitrary point in the bounds of your screen.
        let origin = vec4.fromValues(0, 0, 0, 1);
        let dir = vec4.fromValues(0, 0, 1, 0);
        let highwayTurtle1 = new Turtle(origin, dir, 0, 0);

        let highwayTurtle2 = new Turtle(vec4.fromValues(1800, 0, 1300, 1),
            vec4.fromValues(-1, 0, -1, 0), 0, 0);

        let highwayTurtle3 = new Turtle(vec4.fromValues(2000, 0, 1800, 1),
            vec4.fromValues(-1, 0, 0, 0), 0, 0);

         let highwayTurtle4 = new Turtle(vec4.fromValues(1700, 0, 2000, 1),
             vec4.fromValues(-1, 0, -1, 0), 0, 0);

        let highwayTurtle5 = new Turtle(vec4.fromValues(0, 0, 2000, 1),
            vec4.fromValues(-1, 0, -1, 0), 0, 0);

         this.turtleStack.push(highwayTurtle3);
         this.turtleStack.push(highwayTurtle4);
        //
         this.turtleStack.push(highwayTurtle2);
        this.turtleStack.push(highwayTurtle1);


        while(this.turtleStack.size() > 0) {
            this.currTurtle = this.turtleStack.pop();
            // run this turtle and push more turtles to the stack
            while (this.currTurtle.alive && this.currTurtle.depth < 20) {
                this.moveHighwayTurtle(this.currTurtle);
            }
        }

        //console.log(this.edges.length);
        //console.log(this.intersections.length);

    }

    // move highway turtle and push more valid turtles to stack
    moveHighwayTurtle(currtur: Turtle) {
        let origin = vec4.create();
        vec4.copy(origin, this.currTurtle.pos);


        // rotate to get bias towards most populated area
        let count = 0;
        let biasTowardsOrient = vec4.create();
        //let biasTowardsOrient = vec4.fromValues(0, 0, 1, 0);
        vec4.copy(biasTowardsOrient, this.currTurtle.orient);
        let maxPop = 0.0;
        let minPop = 1000.0;
        while (count < 4) {
            count++;
            // reset turtle orient
             //vec4.copy(this.currTurtle.orient, vec4.fromValues(0, 0, 1, 0));
             let orient = this.currTurtle.rotate(vec3.fromValues(0, 1 ,0), this.highwayAngle);
             let goal_x = this.currTurtle.pos[0] + this.highwayLength * orient[0];
             let goal_y = this.currTurtle.pos[1] + this.highwayLength * orient[1];
             let goal_z = this.currTurtle.pos[2] + this.highwayLength * orient[2];
             let pop = this.checkPopulation(vec3.fromValues(goal_x,goal_y,goal_z));
             //console.log(pop);
             if (pop && pop > maxPop) {
                 //console.log(count);
                 maxPop = pop;
                 vec4.copy(biasTowardsOrient, orient);
                 //console.log(biasTowardsOrient);
                 if (pop > this.globalMaxPop) {
                     this.globalMaxPop = pop;
                 }
             }
             if (pop && pop < minPop) {
                 minPop = pop;
             }
            // // push highway to edges
            // this.edges.push(new Edge(vec3.fromValues(this.currTurtle.pos[0], this.currTurtle.pos[1], this.currTurtle.pos[2]),
            //     vec3.fromValues(goal_x,goal_y,goal_z),
            //     3));
        }

        vec4.copy(this.currTurtle.orient, biasTowardsOrient);
        //console.log(currTurtle.orient);
        let end_x = this.currTurtle.pos[0] + this.highwayLength * this.currTurtle.orient[0];
        let end_y = this.currTurtle.pos[1] + this.highwayLength * this.currTurtle.orient[1];
        let end_z = this.currTurtle.pos[2] + this.highwayLength * this.currTurtle.orient[2];

        let offsetOrigin = vec4.create();
        vec4.multiply(offsetOrigin, [1, 1, 1, 1], this.currTurtle.orient);
        vec4.add(origin, origin, offsetOrigin);

        // check local constraints
         let correctEndPoint = this.addRoadToHighwayNetwork(vec3.fromValues(origin[0], origin[1], origin[2]),
             vec3.fromValues(end_x, end_y, end_z), this.highwaySize);
        //let correctEndPoint = vec3.fromValues(end_x, end_y, end_z);
        // move turtle towards bias direction
        //let newTurtle = new Turtle(goal_endPoint, currTurtle.orient, 0);
        this.currTurtle.moveForward(this.distance(vec3.fromValues(origin[0], origin[1], origin[2]), correctEndPoint));

        // push highway to edges

        this.edges.push(new Edge(vec3.fromValues(origin[0], origin[1], origin[2]),
            correctEndPoint,
            this.highwaySize));
        // push highway vertices to intersections
        let newInter = new Intersection(vec3.fromValues(origin[0],
            origin[1], origin[2]),this.highwaySize);
        let newInterForSet = [origin[0], origin[1]];
        //this.intersections.push(new Intersection(correctEndPoint,this.highwaySize));

        // at every highway intersection, grow and push two road turtles to prep for road generation
        let existsCloseInter = this.existsCloseIntersection(vec3.fromValues(origin[0],
            origin[1], origin[2]), this.highwaySize,  0.8 * this.highwayLength);
        if (!existsCloseInter) {
            this.intersections.push(newInter);
        }
        if (!existsCloseInter && !this.intersectionsSet.has(newInterForSet) && this.currTurtle.iteration < 5) {
            let roadTurtleOrigin = vec4.fromValues(origin[0], origin[1], origin[2], origin[3]);
            let roadTurtleDir = vec4.fromValues(this.currTurtle.orient[0], this.currTurtle.orient[1],
                this.currTurtle.orient[2], this.currTurtle.orient[3]);
            let rightTurtle = new Turtle(roadTurtleOrigin, roadTurtleDir, 0, 0);
            let leftTurtle = new Turtle(roadTurtleOrigin, roadTurtleDir, 0, 0);
            // rotate to right and left
            rightTurtle.rotate(vec3.fromValues(0, 1, 0), 90);
            leftTurtle.rotate(vec3.fromValues(0, 1, 0), -90);
            this.roadTurtleStack.push(rightTurtle);
            this.roadTurtleStack.push(leftTurtle);
            this.intersectionsSet.add(newInterForSet);
        }

        // kill turtle if out of bounds
        if (this.isOutOfBound(this.currTurtle)) {
            this.currTurtle.alive = false;
            this.turtleStack.pop();
            return;
        } else {
            //check to see if current position is above population threshold
            //if so, check new turtle
            if (Math.abs(maxPop - this.globalMaxPop) < 0.018) {
                //if (maxPop > 0.40) {
                if (this.currTurtle.orient[2] > this.currTurtle.orient[0]) {
                    this.turtleStack.push(new Turtle(vec4.fromValues(correctEndPoint[0],
                        correctEndPoint[1], correctEndPoint[2], 1), vec4.fromValues(0, 0, -1, 0), 0, this.currTurtle.iteration + 1));
                    this.turtleStack.push(new Turtle(vec4.fromValues(correctEndPoint[0],
                        correctEndPoint[1], correctEndPoint[2], 1), vec4.fromValues(-1, 0, 0, 0), 0, this.currTurtle.iteration + 1));
                    this.turtleStack.push(new Turtle(vec4.fromValues(correctEndPoint[0],
                        correctEndPoint[1], correctEndPoint[2], 1), vec4.fromValues(1, 0, -1, 0), 0, this.currTurtle.iteration + 1));
                } else {
                    this.turtleStack.push(new Turtle(vec4.fromValues(correctEndPoint[0],
                        correctEndPoint[1], correctEndPoint[2], 1), vec4.fromValues(0, 0, 1, 0), 0, this.currTurtle.iteration + 1));
                    this.turtleStack.push(new Turtle(vec4.fromValues(correctEndPoint[0],
                        correctEndPoint[1], correctEndPoint[2], 1), vec4.fromValues(-1, 0, 0, 0), 0, this.currTurtle.iteration + 1));
                }
            }
        }




    }

    // returns a population density based on texture, between 0-1
    checkPopulation(endPoint: vec3) : number {
        //console.log(endPoint);
        let pop = this.mapTexture.getPopulationOld(endPoint[0], endPoint[2]);
        //console.log(pop);
        return pop;
    }


    // generate roads from highway
    growRoads() {
        // iterate through every generated road turtle from every highway intersection
        while(this.roadTurtleStack.size() > 0) {
            //console.log(this.roadTurtleStack.size());
            let currRoadTurtle = this.roadTurtleStack.pop();
            if (currRoadTurtle.alive && currRoadTurtle.iteration < this.iterations) {
                this.moveRoadTurtle(currRoadTurtle);
            }
        }
    }

    moveRoadTurtle(currRoadTurtle:Turtle) {
        // don't draw if origin point is out of bounds
        if (this.isOutOfBound(currRoadTurtle)) {
            return;
        }

        let origin = vec4.fromValues(currRoadTurtle.pos[0], currRoadTurtle.pos[1], currRoadTurtle.pos[2], 1);
        //vec4.copy(origin, currRoadTurtle.pos);

        let orient = vec4.fromValues(currRoadTurtle.orient[0], currRoadTurtle.orient[1], currRoadTurtle.orient[2], 0);
        //vec4.copy(orient, currRoadTurtle.orient);

        // forward
        let fowardPos = vec4.create();
        vec4.copy(fowardPos, currRoadTurtle.moveForward(this.roadLength));
        let proposedFoward = vec3.fromValues(fowardPos[0], fowardPos[1], fowardPos[2]);

        // right
        // reset turtle
        vec4.copy(currRoadTurtle.pos, origin);
        vec4.copy(currRoadTurtle.orient, orient);
        currRoadTurtle.rotate(vec3.fromValues(0, 1, 0), 90);
        let RightPos = vec4.create();
        vec4.copy(RightPos, currRoadTurtle.moveForward(this.roadLength));
        let proposedRight = vec3.fromValues(RightPos[0], RightPos[1], RightPos[2]);

        // left
        // reset turtle
        vec4.copy(currRoadTurtle.pos, origin);
        vec4.copy(currRoadTurtle.orient, orient);
        currRoadTurtle.rotate(vec3.fromValues(0, 1, 0), -90);
        let leftPos = vec4.create();
        vec4.copy(leftPos, currRoadTurtle.moveForward(this.roadLength));
        let proposedLeft = vec3.fromValues(leftPos[0], leftPos[1], leftPos[2]);

        // check local constraints for each direction
        let correctForward = this.addRoadToNetwork(vec3.fromValues(origin[0], origin[1], origin[2]),
            vec3.fromValues(proposedFoward[0], proposedFoward[1], proposedFoward[2]), this.roadSize);


        let correctRight = this.addRoadToNetwork(vec3.fromValues(origin[0], origin[1], origin[2]),
            vec3.fromValues(proposedRight[0], proposedRight[1], proposedRight[2]), this.roadSize);

        let correctLeft = this.addRoadToNetwork(vec3.fromValues(origin[0], origin[1], origin[2]),
            vec3.fromValues(proposedLeft[0], proposedLeft[1], proposedLeft[2]), this.roadSize)


        //console.log(correctForward, proposedFoward);
        // don't draw if point will be in water, only draw and add turle if on land
        if (correctForward[0] && correctForward[2]) {
            if (this.mapTexture.getElevation(correctForward[0], correctForward[2]) == 1) {
                this.edges.push(new Edge(vec3.fromValues(origin[0], origin[1], origin[2]), vec3.fromValues(correctForward[0], correctForward[1], correctForward[2]), this.roadSize));
                this.intersections.push(new Intersection(vec3.fromValues(correctForward[0], correctForward[1], correctForward[2]), this.roadSize));
                let newForward = new Turtle(vec4.fromValues(correctForward[0], correctForward[1], correctForward[2],
                    1), currRoadTurtle.orient, currRoadTurtle.depth, currRoadTurtle.iteration + 1);
               //newForward.moveForward(this.roadLength);
                this.roadTurtleStack.push(newForward);
            }
        } else {
            if (this.mapTexture.getElevation(proposedFoward[0], proposedFoward[2]) == 1) {
                this.edges.push(new Edge(vec3.fromValues(origin[0], origin[1], origin[2]), vec3.fromValues(proposedFoward[0], proposedFoward[1], proposedFoward[2]), this.roadSize));
                this.intersections.push(new Intersection(vec3.fromValues(proposedFoward[0], proposedFoward[1], proposedFoward[2]), this.roadSize));
                let newForward = new Turtle(vec4.fromValues(proposedFoward[0], proposedFoward[1], proposedFoward[2],
                    1), currRoadTurtle.orient, currRoadTurtle.depth, currRoadTurtle.iteration + 1);
                //newForward.moveForward(this.roadLength);
                this.roadTurtleStack.push(newForward);
            }
        }

        if (correctRight[0] && correctRight[2]) {
            if (this.mapTexture.getElevation(correctRight[0], correctRight[2]) == 1) {
                this.edges.push(new Edge(vec3.fromValues(origin[0], origin[1], origin[2]), vec3.fromValues(correctRight[0], correctRight[1], correctRight[2]), this.roadSize));
                this.intersections.push(new Intersection(vec3.fromValues(correctRight[0], correctRight[1], correctRight[2]), this.roadSize));
                let newRight = new Turtle(vec4.fromValues(correctRight[0], correctRight[1], correctRight[2],
                    1), orient, currRoadTurtle.depth, currRoadTurtle.iteration + 1);
                //newRight.moveForward(this.roadLength);
                this.roadTurtleStack.push(newRight);
            }
        } else {
            if (this.mapTexture.getElevation(proposedRight[0], proposedRight[2]) == 1) {
                this.edges.push(new Edge(vec3.fromValues(origin[0], origin[1], origin[2]), vec3.fromValues(proposedRight[0], proposedRight[1], proposedRight[2]), this.roadSize));
                this.intersections.push(new Intersection(vec3.fromValues(proposedRight[0], proposedRight[1], proposedRight[2]), this.roadSize));
                let newRight = new Turtle(vec4.fromValues(proposedRight[0], proposedRight[1], proposedRight[2],
                    1), orient, currRoadTurtle.depth, currRoadTurtle.iteration + 1);
                //newRight.moveForward(this.roadLength);
                this.roadTurtleStack.push(newRight);
            }
        }

        if (correctLeft[0] && correctLeft[2]) {
            if (this.mapTexture.getElevation(correctLeft[0], correctLeft[2]) == 1) {
                this.edges.push(new Edge(vec3.fromValues(origin[0], origin[1], origin[2]), vec3.fromValues(correctLeft[0], correctLeft[1], correctLeft[2]), this.roadSize));
                this.intersections.push(new Intersection(vec3.fromValues(correctLeft[0], correctLeft[1], correctLeft[2]), this.roadSize));
                let newLeft = new Turtle(vec4.fromValues(correctLeft[0], correctLeft[1], correctLeft[2],
                    1), orient, currRoadTurtle.depth, currRoadTurtle.iteration + 1);
                newLeft.rotate(vec3.fromValues(0, 1, 0), -90);
                //newLeft.moveForward(this.roadLength);
                this.roadTurtleStack.push(newLeft);
            }
        } else {
            if (this.mapTexture.getElevation(proposedLeft[0], proposedLeft[2]) == 1) {
                this.edges.push(new Edge(vec3.fromValues(origin[0], origin[1], origin[2]), vec3.fromValues(proposedLeft[0], proposedLeft[1], proposedLeft[2]), this.roadSize));
                this.intersections.push(new Intersection(vec3.fromValues(proposedLeft[0], proposedLeft[1], proposedLeft[2]), this.roadSize));
                let newLeft = new Turtle(vec4.fromValues(proposedLeft[0], proposedLeft[1], proposedLeft[2],
                    1), orient, currRoadTurtle.depth, currRoadTurtle.iteration + 1);
                newLeft.rotate(vec3.fromValues(0, 1, 0), -90);
                //newLeft.moveForward(this.roadLength);
                this.roadTurtleStack.push(newLeft);
            }
        }


        // // don't draw if point will be in water, only draw and add turtle if on land
        // if (this.mapTexture.getElevation(proposedFoward[0], proposedFoward[2]) == 1) {
        //     this.edges.push(new Edge(vec3.fromValues(origin[0], origin[1], origin[2]), vec3.fromValues(proposedFoward[0], proposedFoward[1], proposedFoward[2]), this.roadSize));
        //     this.intersections.push(new Intersection(vec3.fromValues(proposedFoward[0], proposedFoward[1], proposedFoward[2]), this.roadSize));
        //     let newForward = new Turtle(vec4.fromValues(proposedFoward[0], proposedFoward[1], proposedFoward[2], 1), currRoadTurtle.orient, currRoadTurtle.depth, currRoadTurtle.iteration + 1);
        //     newForward.moveForward(this.roadLength);
        //     this.roadTurtleStack.push(newForward);
        // }
        //
        // if (this.mapTexture.getElevation(proposedRight[0], proposedRight[2]) == 1) {
        //     this.edges.push(new Edge(vec3.fromValues(origin[0], origin[1], origin[2]), vec3.fromValues(proposedRight[0], proposedRight[1], proposedRight[2]), this.roadSize));
        //     this.intersections.push(new Intersection(vec3.fromValues(proposedRight[0], proposedRight[1], proposedRight[2]), this.roadSize));
        //     let newRight = new Turtle(vec4.fromValues(proposedRight[0], proposedRight[1], proposedRight[2], 1), orient, currRoadTurtle.depth, currRoadTurtle.iteration + 1);
        //     newRight.moveForward(this.roadLength);
        //     this.roadTurtleStack.push(newRight);
        // }

        //create new turtle at each intersection, facing original orient


        // add edge and intersections


    }

    // check if the nearest intersection to the endpoint is close enough
    // return the closest intersection if found, null if not found
    existsCloseIntersection(currPoint: vec3, roadSize: number, searchDist: number) : Intersection {
        let index = -1;
        let minDist = searchDist;
        for (let i = 0; i < this.intersections.length; i++) {
            let currDist = this.distance(currPoint, this.intersections[i].position);
            if (currDist < minDist) {
                index = i;
                minDist = currDist;
            }
        }

        // if found
        if (index != -1) {
            // if (roadSize > this.intersections[index].size) {
            //     this.intersections[index].size = roadSize;
            // }
            return this.intersections[index];
        }

        return null;
    }

    // distance helper function
    distance(startPt: vec3, endPt: vec3) : number {
        let a = (startPt[0] - endPt[0]) * (startPt[0] - endPt[0]);
        let b = (startPt[1] - endPt[1]) * (startPt[1] - endPt[1]);
        let c = (startPt[2] - endPt[2]) * (startPt[2] - endPt[2]);
        return Math.sqrt(a + b + c);
    }

    // check if will intersect with street
    // returns the new pruned line's intersection if so, null otherwise
    intersectsExistingStreet(startingPoint: vec3, endPoint: vec3, size: number) : Intersection {
        // check if proposed street intersects any existing edge
        for (let i: number = 0; i < this.edges.length; i++) {
            let currEdge = this.edges[i];
            // check if proposed street intersects this edge
            let proposedIntersection = currEdge.intersectsEdgeAt(startingPoint, endPoint, size);
            // if intersection exists, snap to the new intersection
            if (proposedIntersection != null) {
              //  console.log(proposedIntersection.position, endPoint);
                return proposedIntersection;
            }
        }
        return null;
    }

    // check if edge is close to intersecting with another street
    // returns the new extended line's intersection if so, null otherwise
    extendSegment(startingPoint: vec3, endPoint: vec3, size: number, searchDist: number) : Intersection {
        // created extended line
        let proposedStreetDir = vec3.fromValues(endPoint[0]- startingPoint[0],
            endPoint[1]- startingPoint[1],
            endPoint[2]- startingPoint[2]);
        let dist = vec3.create();
        vec3.multiply(dist, [searchDist, searchDist, searchDist], proposedStreetDir);
        vec3.add(endPoint, endPoint, dist);
        // using the updated endpoint, test if now intersects any of the existing streets
        return this.intersectsExistingStreet(startingPoint,endPoint,size);
    }


    isOutOfBound(currTurtle: Turtle) : boolean {
        if (currTurtle.pos[0] < 0 || currTurtle.pos[0] > 2000 ||
            currTurtle.pos[2] < 0 || currTurtle.pos[2] > 2000) {
            //console.log(currTurtle.pos);
            return true;
        }
        return false;
    }


    // adding an edge/road to the system
    // origin is current turtle's position
    // endPoint is the proposed endpoint
    // size is width of the road
    // end point is checked and returned
    addRoadToHighwayNetwork(startingPoint: vec3, endPoint: vec3, size: number) : vec3 {
        // look for the correct endpoint
        // LOCAL CONSTRAINTS
        let testPoint = vec3.create();
        vec3.copy(testPoint, endPoint);
        // if two streets intersect, generate an intersection
        let pruneToIntersection = this.intersectsExistingStreet(startingPoint, testPoint, size);
        if (pruneToIntersection != null) {
            vec3.copy(testPoint, pruneToIntersection.position);
            // console.log("old", endPoint);
            // console.log("newInter", testPoint);
            vec3.copy(endPoint, testPoint);

        } else {
            // if the end point is close to an existing intersection, use that inter as endpoint
            let searchDist = 50;
            let nearInter = this.existsCloseIntersection(testPoint, size, searchDist);
            if (nearInter != null) {
                testPoint = nearInter.position;
                vec3.copy(endPoint, testPoint);
            } else {
                // if close to intersecting a street, extend street to form an intersection
                let extendedInter = this.extendSegment(startingPoint, testPoint, size, 0.01 * this.highwayLength);
                if (extendedInter != null) {
                    testPoint = extendedInter.position;
                    vec3.copy(endPoint, testPoint);
                }
            }
        }

        // let newEdge = new Edge(startingPoint, endPoint, size);
        // let endNode = new Intersection(endPoint, size);

        //push to our collections of intersections and edges
        // this.edges.push(newEdge);
        // this.intersections.push(endNode);

        return endPoint;
    }

    // adding an edge/road to the system
    // origin is current turtle's position
    // endPoint is the proposed endpoint
    // size is width of the road
    // end point is checked and returned
    addRoadToNetwork(startingPoint: vec3, endPoint: vec3, size: number) : vec3 {
        // look for the correct endpoint
        // LOCAL CONSTRAINTS
        let testPoint = vec3.create();
        vec3.copy(testPoint, endPoint);
        // if two streets intersect, generate an intersection
        let pruneToIntersection = this.intersectsExistingStreet(startingPoint, testPoint, size);
        if (pruneToIntersection != null) {
            vec3.copy(testPoint, pruneToIntersection.position);
            // console.log("old", endPoint);
            // console.log("newInter", testPoint);
            // vec3.copy(endPoint, testPoint);
            endPoint = pruneToIntersection.position;
            //console.log(endPoint);
        } //else {
            // if the end point is close to an existing intersection, use that inter as endpoint
            let searchDist =  this.snap_coefficient * this.roadLength;
            let nearInter = this.existsCloseIntersection(testPoint, size, searchDist);
            if (nearInter != null) {
                testPoint = nearInter.position;
                vec3.copy(endPoint, testPoint);
                endPoint = testPoint;
          //  }
            }
              else {
                // if close to intersecting a street, extend street to form an intersection
                //if (pruneToIntersection == null) {
                    let extendedInter = this.extendSegment(startingPoint, testPoint, size, this.extension_coefficient * this.roadLength);
                    if (extendedInter != null) {
                        testPoint = extendedInter.position;
                        vec3.copy(endPoint, testPoint);
                    }
                //}
             }
        //}



        //push to our collections of intersections and edges
        // this.edges.push(newEdge);
        // this.intersections.push(endNode);

        return endPoint;
    }

    getVBO() {
        let col1Array: number[] = [];
        let col2Array: number[] = [];
        let col3Array: number[] = [];
        let col4Array: number[] = [];
        let colorsArray: number[] = [];

        for (var i = 0; i < this.edges.length; i++) {
            let currEdge = this.edges[i];
            let currTransform = currEdge.getTransform();

            col1Array.push(currTransform[0]);
            col1Array.push(currTransform[1]);
            col1Array.push(currTransform[2]);
            col1Array.push(currTransform[3]);

            col2Array.push(currTransform[4]);
            col2Array.push(currTransform[5]);
            col2Array.push(currTransform[6]);
            col2Array.push(currTransform[7]);

            col3Array.push(currTransform[8]);
            col3Array.push(currTransform[9]);
            col3Array.push(currTransform[10]);
            col3Array.push(currTransform[11]);

            col4Array.push(currTransform[12]);
            col4Array.push(currTransform[13]);
            col4Array.push(currTransform[14]);
            col4Array.push(currTransform[15]);

            colorsArray.push(0.8);
            colorsArray.push(0.8);
            colorsArray.push(0.8);
            colorsArray.push(1);
        }

        let col1: Float32Array = new Float32Array(col1Array);
        let col2: Float32Array = new Float32Array(col2Array);
        let col3: Float32Array = new Float32Array(col3Array);
        let col4: Float32Array = new Float32Array(col4Array);
        let colors: Float32Array = new Float32Array(colorsArray);

        let ret: any = {};
        ret.col1 = col1;
        ret.col2 = col2;
        ret.col3 = col3;
        ret.col4 = col4;
        ret.colors = colors;

        return ret;
    }
}

class MapTexture {
    texData: Uint8Array;
    width: number;
    height: number;
    constructor(textureData: Uint8Array, width: number, height: number) {
        this.texData = new Uint8Array(textureData.length);
        for (var i = 0; i < textureData.length; i++) {
            this.texData[i] = textureData[i];
        }
        //this.texData = textureData;
        this.width = width;
        this.height = height;
    }

    getPopulationOld(x: number, y: number) : number {
        //console.log("HERE" + this.texData.length);
        //console.log(x, y);
        let xPos = Math.floor((x));
        let yPos = Math.floor((y) );
        // let xPos = Math.floor(x / 2.0);
        // let yPos = Math.floor(y/2.0);

        let offset = 2;
        let index = yPos * 2000 * 4 + xPos * 4 + offset;
        //console.log(index);
        let result = this.texData[index];
        return result / 255.0;

    }

    getPopulation(x: number, y: number) : number {
        //console.log("HERE" + this.texData.length);
        //console.log(x, y);
         let xPos = Math.floor((x));
         let yPos = Math.floor((y) );
        // let xPos = Math.floor(x / 2.0);
        // let yPos = Math.floor(y/2.0);

        let offset = 0;
        let index = yPos * 2000 * 4 + xPos * 4 + offset;
        //console.log(index);
        let result = this.texData[index];
        return result / 255.0;

    }

    // 1 if is land, 0 if is water
    getElevation(x: number, y: number) : number {
        // let xPos = Math.floor((x + 1.0) / 2 * this.width);
        // let yPos = Math.floor((y + 1.0) / 2 * this.height);
        let xPos = Math.floor((x));
        let yPos = Math.floor((y));
        let offsetWater = 2.0;
        let offsetLand = 1.0;
        let water = this.texData[yPos * this.width * 4 + xPos * 4 + offsetWater]
        let land = this.texData[yPos * this.width * 4 + xPos * 4 + offsetLand]
        if (water >= land) {
            return 0;
        }
        return 1;
    }
}

class Intersection {
    position: vec3;
    size: number;// size of largest sized road intersecting this point

    constructor(pos: vec3, size: number) {
        this.position = pos;
        this.size = size;
    }
}

class Edge {
    startingPoint: vec3;
    endPoint: vec3;
    direction: vec3;
    size: number;

    constructor (start: vec3, end: vec3, size: number) {
        this.startingPoint = start;
        this.endPoint = end;
        this.size = size;
    }

    // checks if ths edge would intersect the edge passed in
    // returns the intersection if intersects, null otherwise
    intersectsEdgeAt(edgeStart: vec3, edgeEnd: vec3, size: number) : Intersection {
        let p0_x = this.startingPoint[0];
        let p0_y = this.startingPoint[2];
        let p1_x = this.endPoint[0];
        let p1_y = this.endPoint[2];

        let p2_x = edgeStart[0];
        let p2_y = edgeStart[2];
        let p3_x = edgeEnd[0];
        let p3_y = edgeEnd[2];

        let s1_x: number = p1_x - p0_x;
        let s1_y: number = p1_y - p0_y;
        let s2_x: number = p3_x - p2_x;
        let s2_y: number = p3_y - p2_y;

        let s: number = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
        let t: number = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

        let eps = 0.0000001;
        if (s >= 0 + eps && s <= 1 - eps && t >= 0 + eps && t <= 1 - eps) {
            let x_result: number = p0_x + (t * s1_x);
            let y_result: number = p0_y + (t * s1_y);
            return new Intersection(vec3.fromValues(x_result, 0, y_result), size);
        } else {
            return null;
        }

    }


    getTransform() {
        let up = vec3.fromValues(0, 0, 1);
        let dir: vec3 = vec3.fromValues(0, 0, 0);
        vec3.subtract(dir, this.endPoint, this.startingPoint);

        // get angle
        let x1 = up[0];
        let y1 = up[2];

        let x2 = dir[0];
        let y2 = dir[2];

        let angleRad = -Math.atan2(x1 * y2 - y1 * x2, x1 * x2 + y1 * y2);
        let rot = vec3.fromValues(0, 1, 0);
        let rotQuat = quat.create();
        quat.setAxisAngle(rotQuat, rot, angleRad);

        // mid point
        let x = this.startingPoint[0] + this.endPoint[0];
        let y = this.startingPoint[1] + this.endPoint[1];
        let z = this.startingPoint[2] + this.endPoint[2];
        let translate = vec3.fromValues(x / 2, y / 2, z / 2);
        let scaleVec = vec3.fromValues(this.size, 1, vec3.length(dir));

        let transformationMat: mat4 = mat4.create();
        mat4.fromRotationTranslationScale(transformationMat, rotQuat, translate, scaleVec);
        return transformationMat;
    }

}

export {LSystemRoad, Edge, Intersection, MapTexture};
