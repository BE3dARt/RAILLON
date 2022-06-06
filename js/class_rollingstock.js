class locomotive {
	
	constructor(coordinates, layout, segment, subsegment, movingDirection, deltaDisplacement, heading, rollingStock3D, scene) {
		
		// Pass-on-variables
		this.layout = layout;
		this.segment = segment;
		this.subsegment = subsegment;
		this.movingDirection = movingDirection;
		this.deltaDisplacement = deltaDisplacement;
		this.heading = heading;
		this.scene = scene;
		
		// Array holding bogie objects
		this.bogies;
		
		// Declare 3D-objects
		this.hull_3D = rollingStock3D[0];
		this.bogies_3D = rollingStock3D[1];
		this.couplers_3D = rollingStock3D[2];
		
		// Array holding all mesh identifications (Used to tell if user clicked mesh belongs to this rolling stock or not)
		this.meshIDs = [];
	
		// Get hull mesh id
		this.meshIDs.push(this.hull_3D.uniqueId);
		
		// Get bogie mesh ids
		for (let i = 0; i < this.bogies_3D.length; i++) {
			this.meshIDs.push(this.bogies_3D[i].uniqueId);
		}
		
		// Get coupler mesh ids
		for (let i = 0; i < this.couplers_3D.length; i++) {
			this.meshIDs.push(this.couplers_3D[i].uniqueId);
		}
		
		// Initial Position of couplers before moving (const)
		this.posCouplerFront_init = new BABYLON.Vector3(this.couplers_3D[0].position.x, 0, 0);
		this.posCouplerBack_init = new BABYLON.Vector3(this.couplers_3D[1].position.x, 0, 0);
		
		// Retrieve position of first bogie before it is being moved when initializing (const)
		this.posBogieFront_init = this.bogies_3D[0].position;
		this.posBogieBack_init = this.bogies_3D[this.bogies_3D.length-1].position;
		
		// Calculate spaing between couplers and bogies (const)
		this.disCouplerToBogieFront_init = BABYLON.Vector3.Distance(this.posCouplerFront_init, this.posBogieFront_init);
		this.disCouplerToBogieBack_init = BABYLON.Vector3.Distance(this.posCouplerBack_init, this.posBogieBack_init);
		
		// Coupler's position of before and after unit (Needs to be updated in "class_train.js")
		this.posCouplerBackPreviousUnit = null;
		this.posCouplerFrontNextUnit = null;
		
		// Bogie setup
		this.bogies = [new bogie(coordinates, layout, segment, subsegment, movingDirection, deltaDisplacement, heading, this.bogies_3D[0])]; // Initialize first bogie
			
		// Initialize every other bogie (Start with 3 because 0th is 'root', 1st 'hull' and 2nd 'bogie 1')
		for (let i = 1; i < this.bogies_3D.length; i++) {
			
			// Firstly we need to calculate the distance to the first bogie.
			var distanceVec = BABYLON.Vector3.Distance(this.posBogieFront_init, this.bogies_3D[i].position);
			
			// Debug distance between bogies of rolling stock unit.
			if (activeDebug == true) {
				console.log(distanceVec);
			}
			
			// Plug it into the function which will determine the bogie's position along the track.
			var result = getPosNextBogie(this.bogies[this.bogies.length-1].mesh.position, this.layout, this.segment, this.subsegment, this.movingDirection, distanceVec, scene)
			
			// Initialize every other bogie
			this.bogies.push(new bogie(result[0], layout, result[1], result[2], movingDirection, deltaDisplacement, heading, this.bogies_3D[i]));
		}

	}
	
	// Move hull and all bogies
	move() {
		
		// Move the bogies
		for (let i = 0; i < this.bogies.length; i++) {
			this.bogies[i].deltaDisplacement = this.deltaDisplacement;
			this.bogies[i].move();
		}
		
		// Debug distance between bogies of rolling stock unit.
		if (activeDebug == false) {
			console.log(BABYLON.Vector3.Distance(this.bogies[0].mesh.position, this.bogies[this.bogies.length-1].mesh.position));
		}
		
		// Move the hull
		var posFirstBogie = this.bogies[0].mesh.position;
		var posLastBogie = this.bogies[this.bogies.length-1].mesh.position;
		
		// Direction Vector
		var dirVec = new BABYLON.Vector3((posLastBogie.x - posFirstBogie.x) / 2, (posLastBogie.y - posFirstBogie.y) / 2, (posLastBogie.z - posFirstBogie.z) / 2);
		var ptRes = new BABYLON.Vector3(posFirstBogie.x + dirVec.x, posFirstBogie.y + dirVec.y, posFirstBogie.z + dirVec.z)
		
		// Rotate mesh (Only on x-z plane at the moment)
		var angle = BABYLON.Angle.BetweenTwoPoints(new BABYLON.Vector2(posFirstBogie.x, posFirstBogie.z), new BABYLON.Vector2(posLastBogie.x, posLastBogie.z));
		
		// Set direction (Currently only turns around hull; meaning bogies cannot be different)
		if (this.heading == true) {
			this.hull_3D.rotation.y = (angle.radians() *-1) + (Math.PI * (5/2));
		} else {
			this.hull_3D.rotation.y = (angle.radians() *-1) + (Math.PI * (3/2));
		}
		
		// Set new position
		this.hull_3D.position = ptRes;
		
		// Move coupler
		var coefficient;
		var dirVecUnit;
		var ptCoupler;
		
		// Set position of back coupler
		coefficient = this.disCouplerToBogieBack_init / (Math.sqrt(Math.pow(dirVec.x, 2) + Math.pow(dirVec.y, 2) + Math.pow(dirVec.z, 2)));
		dirVecUnit = new BABYLON.Vector3(dirVec.x * coefficient, dirVec.y * coefficient, dirVec.z * coefficient);
		ptCoupler = new BABYLON.Vector3(posLastBogie.x + dirVecUnit.x, posLastBogie.y + dirVecUnit.y, posLastBogie.z + dirVecUnit.z);
		this.couplers_3D[1].position = ptCoupler;
		
		// Set position of front coupler
		coefficient = this.disCouplerToBogieFront_init / (Math.sqrt(Math.pow(dirVec.x * -1, 2) + Math.pow(dirVec.y * -1, 2) + Math.pow(dirVec.z * -1, 2)));
		dirVecUnit = new BABYLON.Vector3(dirVec.x * -1 * coefficient, dirVec.y * -1 * coefficient, dirVec.z * -1 * coefficient);
		ptCoupler = new BABYLON.Vector3(posFirstBogie.x + dirVecUnit.x, posFirstBogie.y + dirVecUnit.y, posFirstBogie.z + dirVecUnit.z);
		this.couplers_3D[0].position = ptCoupler;
		
		// Rotate front coupler
        if (this.posCouplerBackPreviousUnit != null) {
            var angletemp = BABYLON.Angle.BetweenTwoPoints(new BABYLON.Vector2(this.couplers_3D[0].position.x, this.couplers_3D[0].position.z), new BABYLON.Vector2(this.posCouplerBackPreviousUnit.x, this.posCouplerBackPreviousUnit.z)).radians();
            this.couplers_3D[0].rotation.y = angletemp *-1;
        } else {
            this.couplers_3D[0].rotation.y = (angle.radians() *-1) + (Math.PI);
        }
        
        // Rotate back coupler
        if (this.posCouplerFrontNextUnit != null) {
            var angletemp = BABYLON.Angle.BetweenTwoPoints(new BABYLON.Vector2(this.couplers_3D[1].position.x, this.couplers_3D[1].position.z), new BABYLON.Vector2(this.posCouplerFrontNextUnit.x, this.posCouplerFrontNextUnit.z)).radians();
            this.couplers_3D[1].rotation.y = angletemp *-1;
        } else {
            this.couplers_3D[1].rotation.y = (angle.radians() *-1);
        }
	}
}

class coach {
	
}