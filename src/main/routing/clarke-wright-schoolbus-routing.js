// Implements a varition of the Clarke and Wright algorithm (1964) based on:
// SCHOOL BUS ROUTING BY COMPUTER
// By: Brian T. Bennet and Denos C. Gazis
// See: https://www.sciencedirect.com/science/article/abs/pii/004116477290072X
//      https://doi.org/10.1016/0041-1647(72)90072-X

const Heap = require("heap");
const RoutingGraph = require("./routing-graph.js");
const BusRoute = require("./busroute.js");
const Saving = require("./saving.js");

class ClarkeWrightSchoolBusRouting {
    constructor(inputData, spatialiteDB) {
        // Database Parameters
        this.spatialiteDB = spatialiteDB;

        // Algorithm Parameters
        this.maxTravDist = inputData["maxTravDist"];
        this.maxTravTime = inputData["maxTravTime"];
        this.optTarget   = inputData["optTarget"];
        this.numVehicles = inputData["numVehicles"];
        this.maxCapacity = inputData["maxCapacity"];
        this.busSpeed    = 11.11; // 11.11 m/s ~= 40 km/h

        // Garage
        this.garage = inputData["garage"];

        // Bus Stops (if not using one, each student represent a bus stop)
        this.stops = inputData["stops"];

        // Schools (if using more than one, get the one that is closest to the stops)
        this.schools = inputData["schools"];

        // Create and prepare the routing Graph
        // FIXME: put argument in inputData
        this.graph = new RoutingGraph(this.spatialiteDB, true);

        // Add Garage to the Graph
        // FIXME: Only using a single garage!
        this.graph.addGarageVertex(this.garage["key"], this.garage["lat"], this.garage["lng"]);

        // Add Stops
        this.stops.forEach((s) => {
            this.graph.addStopVertex(s["key"], s["lat"], s["lng"], s["passengers"]);
        });

        // Get the distance to the first school
        // FIXME: Fix this
        this.schools.forEach((s) => {
            this.graph.addSchoolVertex(s["key"], s["lat"], s["lng"]);
        });

        // Map of Bus Routes
        this.routes = new Map();

        // Map of Bus Stops to Routes
        this.stopsToRouteMap = new Map();
    }

    buildSpatialIndex() {
        return Promise.all(this.graph.buildSpatialVertex());
    }

    buildSpatialMatrix() {
        return Promise.all(this.graph.buildSpatialMatrix());
    }

    buildInitialRoute() {
        this.stops.forEach((s) => {
            let busPath = ["garage", s["key"], "school"];
            let busRoute = new BusRoute({ path: busPath });

            this.routes.set(busRoute.id, busRoute);
            this.stopsToRouteMap.set(s["key"], busRoute.id);
        });
    }

    processSavings(savingsQueue) {
        while (!savingsQueue.empty()) {
            let saving = savingsQueue.pop();
            console.log(saving);
            let cRoute = this.getRoute(saving.c);
            let dRoute = this.getRoute(saving.d);

            // Check if it is possible to join the two routes
            if (cRoute.id != dRoute.id && cRoute.lastStop() == saving.c && dRoute.firstStop() == saving.d) {
                // Create merge route
                let firstPath  = cRoute.route.slice(0, cRoute.route.length - 1);
                let secondPath = dRoute.route.slice(1, dRoute.route.length);
                let mergePath  = firstPath.concat(secondPath);
                let mergeRoute = new BusRoute({ path: mergePath });

                // Check if a merge violate constraints
                let totalPassengers = mergeRoute.numPassengers(this.graph);
                let totalTravDistance = mergeRoute.travDistance(this.graph);

                // We can merge!
                if (totalPassengers <= this.maxCapacity && totalTravDistance <= this.maxTravDist) {
                    // Delete old routes
                    this.routes.delete(cRoute.id);
                    this.routes.delete(dRoute.id);
                    
                    // Put new route
                    this.routes.set(mergeRoute.id, mergeRoute);
                    for (let stopID = 1; stopID < mergePath.length - 1; stopID++) {
                        this.setRoute(mergePath[stopID], mergeRoute);    
                    }
                }
            }
        }
    }
    
    getRoute(stopID) {
        return this.routes.get(this.stopsToRouteMap.get(stopID));
    }

    setRoute(stopID, busRoute) {
        this.stopsToRouteMap.set(stopID, busRoute.id);
    }

    spatialRoute() {
        // First, build spatial index
        return this.buildSpatialIndex()
                  .then(() => this.buildSpatialMatrix()) // Second, build spatial matrix
                  .then(() => {
                      // Third, run clark
                      return new Promise((resolve, reject) => {
                          // Build initial rotes for each bus stop (or student)
                          this.buildInitialRoute();

                          // Build savings and put it on a priority queue
                          let savings = this.graph.buildSavings();

                          // Process savings
                          this.processSavings(savings);

                          // Print Routes
                          this.routes.forEach((r) => {
                              console.log(r.toLatLongRoute(this.graph));
                              console.log("-------")
                          });

                          resolve(this.routes);
                      });
                  });
    }

    route() {
        // First, build dist matrix
        this.graph.buildDistMatrix();

        // Second, build initial rotes for each bus stop (or student)
        this.buildInitialRoute();

        // Third, build savings and put it on a priority queue
        let savings = this.graph.buildSavings();

        // Process savings
        this.processSavings(savings);
        
        // Print Routes
        this.routes.forEach((r) => {
            console.log(r.toLatLongRoute(this.graph));
            console.log("-------")
        });

        return this.routes;
    }

}

module.exports = ClarkeWrightSchoolBusRouting;