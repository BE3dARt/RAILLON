class Diesel {
	
	constructor(power, efficiency) {
		this.power = power;
		this.efficiency = efficiency;
	}
	
}

class Electric {
	
	constructor() {
		
	}
	
}

class Multiple_Unit {
	
	constructor() {
		
	}
	
}

class Steam {
	
	constructor() {
		
	}
	
}

class Flatcar {
	
	constructor() {
		
	}
	
}

class Covered {
	
	constructor() {
		
	}
	
}

class Container {
	
	constructor(load) {
		this.load = load;
	}
	
}

class Hopper {
	
	constructor() {
		
	}
	
}

class Tank {
	
	constructor() {
		
	}
	
}

class Schnabel {
	
	constructor() {
		
	}
	
}

class Passenger {
	
	constructor() {
		
	}
	
}

class Gun {
	
	constructor() {
		
	}
	
}

class rollingStock {
	
	constructor(coordinates, map, section, segment, subsegment, direction, facing, rollingStock3D, name, scene) {

		// Fill in unit configuration from 'units.js' and add a couple of important things.
		var unitsTemp = units[unitNameToIndex(name)]; // Deep copy ('units.js' therefore can't be nested!)
		
		// Dependent on the type, assign a differnt object to 'this.configuration' with special attributes and functions
		if (unitsTemp.type == "Diesel") {
			check(unitsTemp.power, "power", unitsTemp.type);
			check(unitsTemp.efficiency, "efficiency", unitsTemp.type);
			this.configuration = new Diesel(unitsTemp.power, unitsTemp.efficiency);
		} else if (unitsTemp.type == "Container") {
			check(unitsTemp.load, "load", unitsTemp.type);
			this.configuration = new Container(unitsTemp.load);
		}
		
		// Add stuff to every configuration (with a check)
		check(unitsTemp.maxvelocity, "maxvelocity", unitsTemp.type);
		check(unitsTemp.mass, "mass", unitsTemp.type);
		this.configuration.maxvelocity = unitsTemp.maxvelocity / 3.6; // Convert km/h to m/s
		this.configuration.mass = unitsTemp.mass;
		this.configuration.id = this.collectMeshIds(rollingStock3D);
		
		// Add some important stuff to the rolling stock root
		this.name = unitsTemp.name;
		this.type = unitsTemp.type;
		
		// Every significant variable for the unit's MOVEMENT
		this.movement = {
			direction: direction,
			facing: facing,
		};
		
		// Every significant variable for HULL
		this.hull = {
			mesh: rollingStock3D[0][0],
		};
		
		// Every significant variable for BOGIES
		this.bogies = {
			front: null,
			middle: null,
			back: null,
		};

		// Fill if rolling stock has 2 bogies, else it has 3 bogies
		if (rollingStock3D[1].length == 2) {
			[this.bogies.front, this.bogies.back] = this.setupBogies(coordinates, map, section, segment, subsegment, rollingStock3D[1], rollingStock3D[1][0].position);
		} else {
			[this.bogies.front, this.middle, this.bogies.back] = this.setupBogies(coordinates, map, section, segment, subsegment, rollingStock3D[1], rollingStock3D[1][0].position);
		}
		
		// Every significant variable for COUPLERS
		this.coupler = {
			front: {
				mesh: rollingStock3D[2][0], 
				posNextUnit: null, // Position of coupler of next unit
				disInitToFrontBogie: BABYLON.Vector3.Distance(new BABYLON.Vector3(rollingStock3D[2][0].position.x, 0, 0), this.bogies.front.posInitial)
			},
			
			back: {
				mesh: rollingStock3D[2][1], 
				posNextUnit: null, // Position of coupler of next unit
				disInitToBackBogie: BABYLON.Vector3.Distance(new BABYLON.Vector3(rollingStock3D[2][1].position.x, 0, 0), this.bogies.back.posInitial)
			},
		};
	}
	
	// Bogie setup
	setupBogies (coordinates, map, section, segment, subsegment, mesh, posInitial) {
        
		var arrBogies = [new bogie(coordinates, map, section, segment, subsegment, this.movement.direction, mesh[0])]; // Initialize first bogie
			
		// Initialize every other bogie (Start with 3 because 0th is 'root', 1st 'hull' and 2nd 'bogie 1')
		for (let i = 1; i < mesh.length; i++) {
			
			var distanceVec = BABYLON.Vector3.Distance(posInitial, mesh[i].position);
			// Firstly we need to calculate the distance to the first bogie.
			
			// Debug distance between bogies of rolling stock unit.
			if (activeDebug == true) {
				console.log(distanceVec);
			}
			// Plug it into the function which will determine the bogie's position along the railway.
			var result = getPosNextBogie(mesh[arrBogies.length-1].position, map, section, segment, subsegment, this.movement.direction, distanceVec, scene)
            
			// Initialize every other bogie
			arrBogies.push(new bogie(result[0], map, result[1], result[2], result[3], this.movement.direction, mesh[i]));
		}
		
		return arrBogies;
	}
	
	// Collect all mesh ids for easier identification in the future
	collectMeshIds (meshes) {
		var arrCollectMeshIds = [];
		for (let types = 0; types < meshes.length; types++) {
			for (let number = 0; number < meshes[types].length; number++) {
				arrCollectMeshIds.push(meshes[types][number].uniqueId);
			}
		}
		return arrCollectMeshIds;
	}
	
	// Move hull and all bogies
	move(deltaDisplacement) {
		
		// Move front bogie
		if (this.bogies.front != null) {
			this.bogies.front.move(deltaDisplacement, this.movement.facing);
		}
		
		// Move middle bogie
		if (this.bogies.middle != null) {
			this.bogies.middle.move(deltaDisplacement, this.movement.facing);
		}
		
		// Move back bogie
		if (this.bogies.back != null) {
			this.bogies.back.move(deltaDisplacement, this.movement.facing);
		}
		
		// Debug distance between bogies of rolling stock unit.
		if (activeDebug == true) {
			console.log(BABYLON.Vector3.Distance(this.bogies.front.mesh.position, this.bogies.back.mesh.position));
		}
		
		// Move the hull
		var posFirstBogie = this.bogies.front.mesh.position;
		var posLastBogie = this.bogies.back.mesh.position;
		
		// Direction Vector
		var dirVec = new BABYLON.Vector3((posLastBogie.x - posFirstBogie.x) / 2, (posLastBogie.y - posFirstBogie.y) / 2, (posLastBogie.z - posFirstBogie.z) / 2);
		var ptRes = new BABYLON.Vector3(posFirstBogie.x + dirVec.x, posFirstBogie.y + dirVec.y, posFirstBogie.z + dirVec.z)
		
		// Rotate mesh (Only on x-z plane at the moment)
		var angle = BABYLON.Angle.BetweenTwoPoints(new BABYLON.Vector2(posFirstBogie.x, posFirstBogie.z), new BABYLON.Vector2(posLastBogie.x, posLastBogie.z));
		
		// Set direction (Currently only turns around hull; meaning bogies cannot be different)
		if (this.movement.facing == true) {
			this.hull.mesh.rotation.y = (angle.radians() *-1) + Math.PI;
		} else {
			this.hull.mesh.rotation.y = (angle.radians() *-1) + Math.PI * 2;
		}
		
		// Set new position
		this.hull.mesh.position = ptRes;
		
		// Move coupler
		var coefficient;
		var dirVecUnit;
		var ptCoupler;
		
		// Set position of back coupler
		coefficient = this.coupler.back.disInitToBackBogie / (Math.sqrt(Math.pow(dirVec.x, 2) + Math.pow(dirVec.y, 2) + Math.pow(dirVec.z, 2)));
		dirVecUnit = new BABYLON.Vector3(dirVec.x * coefficient, dirVec.y * coefficient, dirVec.z * coefficient);
		ptCoupler = new BABYLON.Vector3(posLastBogie.x + dirVecUnit.x, posLastBogie.y + dirVecUnit.y, posLastBogie.z + dirVecUnit.z);
		this.coupler.back.mesh.position = ptCoupler;
		
		// Set position of front coupler
		coefficient = this.coupler.front.disInitToFrontBogie / (Math.sqrt(Math.pow(dirVec.x * -1, 2) + Math.pow(dirVec.y * -1, 2) + Math.pow(dirVec.z * -1, 2)));
		dirVecUnit = new BABYLON.Vector3(dirVec.x * -1 * coefficient, dirVec.y * -1 * coefficient, dirVec.z * -1 * coefficient);
		ptCoupler = new BABYLON.Vector3(posFirstBogie.x + dirVecUnit.x, posFirstBogie.y + dirVecUnit.y, posFirstBogie.z + dirVecUnit.z);
		this.coupler.front.mesh.position = ptCoupler;
		
		// Rotate front coupler
        if (this.coupler.front.posNextUnit != null) {
            var angletemp = BABYLON.Angle.BetweenTwoPoints(new BABYLON.Vector2(this.coupler.front.mesh.position.x, this.coupler.front.mesh.position.z), new BABYLON.Vector2(this.coupler.front.posNextUnit.x, this.coupler.front.posNextUnit.z)).radians();
            this.coupler.front.mesh.rotation.y = angletemp *-1;
        } else {
            this.coupler.front.mesh.rotation.y = (angle.radians() *-1) + (Math.PI);
        }
        
        // Rotate back coupler
        if (this.coupler.back.posNextUnit != null) {
            var angletemp = BABYLON.Angle.BetweenTwoPoints(new BABYLON.Vector2(this.coupler.back.mesh.position.x, this.coupler.back.mesh.position.z), new BABYLON.Vector2(this.coupler.back.posNextUnit.x, this.coupler.back.posNextUnit.z)).radians();
            this.coupler.back.mesh.rotation.y = angletemp *-1;
        } else {
            this.coupler.back.mesh.rotation.y = (angle.radians() *-1);
        }
	}
}