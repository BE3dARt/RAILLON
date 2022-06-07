class rollingStock {
	
	constructor(coordinates, layout, segment, subsegment, direction, facing, rollingStock3D, scene) {
		
		// Every significant variable for the unit's MOVEMENT
		this.movement = {
			direction: direction,
			facing: facing,
		};
		
		// Every significant general variable
		this.general = {
			id : this.collectMeshIds(rollingStock3D),
		};

		// Every significant variable for HULL
		this.hull = {
			mesh: rollingStock3D[0][0],
		};
		
		// Every significant variable for BOGIES
		this.bogies = {
			mesh: rollingStock3D[1],
			object: null, // Will be initialized further down
			
			// Position before being moved for the first time
			posInitFront: rollingStock3D[1][0].position, 
			posInitBack: rollingStock3D[1][rollingStock3D[1].length-1].position,
		};
		this.bogies.object = this.setupBogies(coordinates, layout, segment, subsegment);
		
		// Every significant variable for COUPLERS
		this.coupler = {
			front: {
				mesh: rollingStock3D[2][0], 
				posNextUnit: null, // Position of coupler of next unit
				disInitToFrontBogie: BABYLON.Vector3.Distance(new BABYLON.Vector3(rollingStock3D[2][0].position.x, 0, 0), this.bogies.posInitFront)
			},
			
			back: {
				mesh: rollingStock3D[2][1], 
				posNextUnit: null, // Position of coupler of next unit
				disInitToBackBogie: BABYLON.Vector3.Distance(new BABYLON.Vector3(rollingStock3D[2][1].position.x, 0, 0), this.bogies.posInitBack)
			},
		};
	}
	
	// Bogie setup
	setupBogies (coordinates, layout, segment, subsegment) {
		
		var arrBogies = [new bogie(coordinates, layout, segment, subsegment, this.bogies.mesh[0])]; // Initialize first bogie
			
		// Initialize every other bogie (Start with 3 because 0th is 'root', 1st 'hull' and 2nd 'bogie 1')
		for (let i = 1; i < this.bogies.mesh.length; i++) {
			
			var distanceVec = BABYLON.Vector3.Distance(this.bogies.posInitFront, this.bogies.mesh[i].position);
			// Firstly we need to calculate the distance to the first bogie.
			
			// Debug distance between bogies of rolling stock unit.
			if (activeDebug == true) {
				console.log(distanceVec);
			}
			
			
			// Plug it into the function which will determine the bogie's position along the track.
			var result = getPosNextBogie(this.bogies.mesh[arrBogies.length-1].position, layout, segment, subsegment, this.movement.direction, distanceVec, scene)
			
			// Initialize every other bogie
			arrBogies.push(new bogie(result[0], layout, result[1], result[2], this.bogies.mesh[i]));
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
		
		// Move the bogies
		for (let i = 0; i < this.bogies.object.length; i++) {
			this.bogies.object[i].move(deltaDisplacement, this.movement.direction, this.movement.facing);
		}
		
		// Debug distance between bogies of rolling stock unit.
		if (activeDebug == true) {
			console.log(BABYLON.Vector3.Distance(this.bogies.object[0].mesh.position, this.bogies.object[this.bogies.object.length-1].mesh.position));
		}
		
		// Move the hull
		var posFirstBogie = this.bogies.object[0].mesh.position;
		var posLastBogie = this.bogies.object[this.bogies.object.length-1].mesh.position;
		
		// Direction Vector
		var dirVec = new BABYLON.Vector3((posLastBogie.x - posFirstBogie.x) / 2, (posLastBogie.y - posFirstBogie.y) / 2, (posLastBogie.z - posFirstBogie.z) / 2);
		var ptRes = new BABYLON.Vector3(posFirstBogie.x + dirVec.x, posFirstBogie.y + dirVec.y, posFirstBogie.z + dirVec.z)
		
		// Rotate mesh (Only on x-z plane at the moment)
		var angle = BABYLON.Angle.BetweenTwoPoints(new BABYLON.Vector2(posFirstBogie.x, posFirstBogie.z), new BABYLON.Vector2(posLastBogie.x, posLastBogie.z));
		
		// Set direction (Currently only turns around hull; meaning bogies cannot be different)
		if (this.movement.facing == true) {
			this.hull.mesh.rotation.y = (angle.radians() *-1) + (Math.PI * (5/2));
		} else {
			this.hull.mesh.rotation.y = (angle.radians() *-1) + (Math.PI * (3/2));
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