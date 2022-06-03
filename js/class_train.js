class train {
	
	// trainCompositionInitial: [["Name", heading]]
	constructor(trainCompositionInitial, layout, segment, subsegment, movingDirection, speed, scene) {
		
		this.trainCompositionInitial = trainCompositionInitial;
		this.layout = layout;
		this.segment = segment;
		this.subsegment = subsegment;
		this.speed = speed;
		this.movingDirection = movingDirection;
		this.initialized = false;
		
		this.rollingStock3DModels = [];
		this.trainComposition = [];
		
		this.rollingStock3DModelsInitializedCounter = 0;
		
		// Load all 3D models first
		for (let i = 0; i < this.trainCompositionInitial.length; i++) {
			
			// Asynchronous asset loading function
			const resultPromise = BABYLON.SceneLoader.ImportMeshAsync("", "https://raw.githubusercontent.com/BE3dARt/RAILBLAZER/main/assets/glb/", this.trainCompositionInitial[i][0] + ".glb", scene);
			
			// Promise of the asset loading function
			resultPromise.then((load3D) => {
				
				// Declare 3D-objects
				var hull_3D;
				var bogies_3D = [];
				var couplers_3D = [];
				
				// Assign 3D-objects to correct group
				for (let i = 0; i < load3D.meshes.length; i++) {
                    
                    //Formalities
                    load3D.meshes[i].rotationQuaternion = null;
                    load3D.meshes[i].rotation = BABYLON.Vector3.Zero();
					
					// Retrieve mesh for train hull
					if (load3D.meshes[i].name.includes("Hull")) {
						hull_3D = load3D.meshes[i];
					}
					
					// Retrieve mesh for bogies
					if (load3D.meshes[i].name.includes("Bogie")) {
						bogies_3D.push(load3D.meshes[i]);
					}
					
					// Retrieve mesh for couplers
					if (load3D.meshes[i].name.includes("Coupler")) {
						couplers_3D.push(load3D.meshes[i]);
					}
				}
				
				this.rollingStock3DModels.push([hull_3D, bogies_3D, couplers_3D]);
				this.rollingStock3DModelsInitializedCounter += 1;
			})
		}
	}
	
	update() {
		
		// Continue with script only if all 3d models have been loaded
		if (this.trainCompositionInitial.length != this.rollingStock3DModelsInitializedCounter) {
			return;
		}
		
		// Initialized all units
		if (this.initialized == false) {
			for (let i = 0; i < this.trainCompositionInitial.length; i++) {
				
				// First model is special because here the position is provided by the user
				if (i == 0) {
					
					// Convert the first track-index-position to coordinates
					var coordinates = this.layout.layout[this.segment].curvature.getPoints()[this.subsegment];
					this.trainComposition.push(new locomotive(coordinates, this.layout, this.segment, this.subsegment, this.movingDirection, this.speed, this.trainCompositionInitial[0][1], this.rollingStock3DModels[i], this.scene));
				
				} else {
					
					var coordinatesReferenceBogie_previous = this.trainComposition[this.trainComposition.length-1].bogies[this.trainComposition[this.trainComposition.length-1].bogies.length-1].mesh.position;
					var layout_previous = this.trainComposition[this.trainComposition.length-1].bogies[this.trainComposition[this.trainComposition.length-1].bogies.length-1].layout;
					var segment_previous = this.trainComposition[this.trainComposition.length-1].bogies[this.trainComposition[this.trainComposition.length-1].bogies.length-1].segment;
					var subsegment_previous = this.trainComposition[this.trainComposition.length-1].bogies[this.trainComposition[this.trainComposition.length-1].bogies.length-1].subsegment;
					var movingDirection_previous = this.trainComposition[this.trainComposition.length-1].bogies[this.trainComposition[this.trainComposition.length-1].bogies.length-1].movingDirection;
	
					// Furthest point away of center first locomotive
					var first_coupler = new BABYLON.Vector3(this.rollingStock3DModels[i-1][2][1].getBoundingInfo().boundingBox.minimumWorld.x + couplerLockDistance, 0, 0);
					
					// Position back bogie of first locomotive
					var first_bogie = this.trainComposition[i-1].posBogieBack_init;
					
					// Furthest point away of center second locomotive (Maximum because mirrored)
					var second_coupler = new BABYLON.Vector3(this.rollingStock3DModels[i][2][0].getBoundingInfo().boundingBox.maximumWorld.x - couplerLockDistance, 0, 0);
					
					// Position front bogie of second locomotive
					var second_bogie = this.trainComposition[i-1].posBogieFront_init;
					
					// Distance to the first bogie of the next locomotive
					var distanceToNext = BABYLON.Vector3.Distance(first_coupler, first_bogie) + BABYLON.Vector3.Distance(second_coupler, second_bogie);
					
					// NEXT BUILD FUNCTION TO GET DISTANCE BETWEEN UNITS, now for debug set to 0.65
					var result = getBogiePositionNextMember(coordinatesReferenceBogie_previous, layout_previous, segment_previous, subsegment_previous, movingDirection_previous, distanceToNext, scene);
					
					this.trainComposition.push(new locomotive(result[0], this.layout, result[1], result[2], this.movingDirection, this.speed, this.trainCompositionInitial[this.trainComposition.length][1], this.rollingStock3DModels[i], scene))
				
				}
			}
			
			// Initialisation of all units successfully finished
			this.initialized = true;
		}

		this.move();
	}
	
	// Move train as a whole
	move() {
		
		// Loop over every locomotive and wagon and update their position
		for (let i = 0; i < this.trainComposition.length; i++) {
			
			// Before calling move() update the coupler positions of the previous and next unit			
			if (i == 0 && i == this.trainComposition.length - 1) {
				this.trainComposition[i].posCouplerBackPreviousUnit = null;
				this.trainComposition[i].posCouplerFrontNextUnit = null;
			} else if (i == 0) {
				this.trainComposition[i].posCouplerBackPreviousUnit = null;
				this.trainComposition[i].posCouplerFrontNextUnit = this.trainComposition[i+1].couplers_3D[0].position;
			}else if (i == this.trainComposition.length -1) {
				this.trainComposition[i].posCouplerBackPreviousUnit = this.trainComposition[i-1].couplers_3D[1].position;
				this.trainComposition[i].posCouplerFrontNextUnit = null;
			} else {
				this.trainComposition[i].posCouplerBackPreviousUnit = this.trainComposition[i-1].couplers_3D[1].position;
				this.trainComposition[i].posCouplerFrontNextUnit = this.trainComposition[i+1].couplers_3D[0].position;
			}
			
			// Move train composition
			this.trainComposition[i].move();
		}
	}
}