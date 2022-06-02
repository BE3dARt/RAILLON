class locomotive {
	
	constructor(coordinates, layout, segment, subsegment, movingDirection, speed, heading, rollingStock3D, scene) {
		
		this.layout = layout;
		this.segment = segment;
		this.subsegment = subsegment;
		this.movingDirection = movingDirection;
		this.speed = speed;
		this.heading = heading;
		this.scene = scene;
		
		this.initialized = false;
		this.bogies;
		
		// Declare 3D-objects
		this.hull_3D = rollingStock3D[0];
		this.bogies_3D = rollingStock3D[1];
		this.couplers_3D = rollingStock3D[2];
		
		// Initial Position of couplers before moving
		this.posCounplerFront = new BABYLON.Vector3(this.couplers_3D[0].position.x, 0, 0);
		this.posCounplerBack = new BABYLON.Vector3(this.couplers_3D[1].position.x, 0, 0);
		
		// Coupler's position of before and after unit (Needs to be updated in "class_train.js")
		this.posCounplerPreviousUnit = null;
		this.posCounplerNextUnit = null;
		
		// Retrieve position of first bogie now before it is being moved when initializing
		this.posFirstBogieIn3DEditor = this.bogies_3D[0].position;
		this.posLastBogieIn3DEditor = this.bogies_3D[this.bogies_3D.length-1].position;
		
		// Calculate spaing between couplers and bogies
		this.disCouplerBogieFront = BABYLON.Vector3.Distance(this.posCounplerFront, this.posFirstBogieIn3DEditor);
		this.disCouplerBogieBack = BABYLON.Vector3.Distance(this.posCounplerBack, this.posLastBogieIn3DEditor);
			
		// Enable rotation for train hull
		this.hull_3D.rotationQuaternion = null;
		this.hull_3D.rotation = BABYLON.Vector3.Zero();
			
		// Bogie setup
		this.bogies = [new bogie(coordinates, layout, segment, subsegment, movingDirection, this.bogies_3D[0])]; // Initialize first bogie
			
		// Initialize every other bogie (Start with 3 because 0th is 'root', 1st 'hull' and 2nd 'bogie 1')
		for (let i = 1; i < this.bogies_3D.length; i++) {
			
			// Firstly we need to calculate the distance to the first bogie.
			var distanceVec = BABYLON.Vector3.Distance(this.posFirstBogieIn3DEditor, this.bogies_3D[i].position);
			
			// Plug it into the function which will determine the bogie's position along the track.
			var result = getBogiePositionNextMember(this.bogies[this.bogies.length-1].mesh.position, this.layout, this.segment, this.subsegment, this.movingDirection, distanceVec, scene)
			
			// Initialize every other bogie
			this.bogies.push(new bogie(result[0], layout, result[1], result[2], movingDirection, this.bogies_3D[i]));
		}
			
		// Green light to all other functions
		this.initialized = true;
	}
	
	// Move hull and all bogies
	move() {
		
		// If meshes haven't been loaded
		if (this.initialized == false) {return}
		
		// Move the bogies
		for (let i = 0; i < this.bogies.length; i++) {
			this.bogies[i].move(this.speed);
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
		coefficient = this.disCouplerBogieBack / (Math.sqrt(Math.pow(dirVec.x, 2) + Math.pow(dirVec.y, 2) + Math.pow(dirVec.z, 2)));
		dirVecUnit = new BABYLON.Vector3(dirVec.x * coefficient, dirVec.y * coefficient, dirVec.z * coefficient);
		ptCoupler = new BABYLON.Vector3(posLastBogie.x + dirVecUnit.x, posLastBogie.y + dirVecUnit.y, posLastBogie.z + dirVecUnit.z);
		this.couplers_3D[1].position = ptCoupler;
		
		// Set position of front coupler
		coefficient = this.disCouplerBogieFront / (Math.sqrt(Math.pow(dirVec.x * -1, 2) + Math.pow(dirVec.y * -1, 2) + Math.pow(dirVec.z * -1, 2)));
		dirVecUnit = new BABYLON.Vector3(dirVec.x * -1 * coefficient, dirVec.y * -1 * coefficient, dirVec.z * -1 * coefficient);
		ptCoupler = new BABYLON.Vector3(posFirstBogie.x + dirVecUnit.x, posFirstBogie.y + dirVecUnit.y, posFirstBogie.z + dirVecUnit.z);
		this.couplers_3D[0].position = ptCoupler;
		
		// Rotate front coupler
        if (this.posCounplerPreviousUnit != null) {
            
            // As you can see, distance between points increases while in curve, we need to adjust for that with the position!
            //console.log(BABYLON.Vector3.Distance(this.couplers_3D[0].position, this.posCounplerPreviousUnit))
            
            var angletemp = BABYLON.Angle.BetweenTwoPoints(new BABYLON.Vector2(this.couplers_3D[0].position.x, this.couplers_3D[0].position.z), new BABYLON.Vector2(this.posCounplerPreviousUnit.x, this.posCounplerPreviousUnit.z)).radians();
            this.couplers_3D[0].rotation.y = angletemp *-1;
        } else {
            this.couplers_3D[0].rotation.y = (angle.radians() *-1) + (Math.PI);
        }
        
        // Rotate back coupler
        if (this.posCounplerNextUnit != null) {
            var angletemp = BABYLON.Angle.BetweenTwoPoints(new BABYLON.Vector2(this.couplers_3D[1].position.x, this.couplers_3D[1].position.z), new BABYLON.Vector2(this.posCounplerNextUnit.x, this.posCounplerNextUnit.z)).radians();
            this.couplers_3D[1].rotation.y = angletemp *-1;
        } else {
            this.couplers_3D[1].rotation.y = (angle.radians() *-1);
        }
        
        
        
        
        
	}
}

class coach {
	
}