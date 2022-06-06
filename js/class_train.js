class train {
	
	// trainCompositionInitial: [["Name", heading]]
	constructor(trainCompositionInitial, layout, segment, subsegment, movingDirection, speed, scene) {
		
		this.trainCompositionInitial = trainCompositionInitial;
		this.layout = layout;
		this.segment = segment;
		this.subsegment = subsegment;
		this.speed = speed;
		this.deltaDisplacement = null;
		this.movingDirection = movingDirection;
		this.initialized = false;
		
		this.status = 1; // 0: stop, 1: drive
		
		this.rollingStock3DModels = [];
		this.trainComposition = [];
		
		this.rollingStock3DModelsInitializedCounter = 0;
		
		// Check if provided segment exists
		if (this.segment < 0) {
			this.segment = 0;
		} else if (segment >= this.layout.layout.length) {
			this.segment = this.layout.layout.length - 1;
		}
		
		// Check if provided subsegment exists
		if (this.subsegment < 0) {
			this.subsegment = 0;
		} else if (this.subsegment >= this.layout.layout[this.segment].curvature.getPoints().length) {
			this.subsegment = this.layout.layout[this.segment].curvature.getPoints().length - 1;
		}
		
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
				
				// Assign 3D-objects to correct group (Forward-Heading)
				if (this.trainCompositionInitial[i][1] == true) {
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
				}
				
				// Assign 3D-objects to correct group (Backward-Heading)
				if (this.trainCompositionInitial[i][1] == false) {
					for (let i = load3D.meshes.length-1; i >= 0; i--) {
                    
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
					
					var posTemporary;
					
					// Adjust bogie position when facing backwards (two bogies)
					if (bogies_3D.length == 2) {
						posTemporary = bogies_3D[0].position;
						bogies_3D[0].position = bogies_3D[1].position;
						bogies_3D[1].position = posTemporary;
					}
					
					// Adjust coupler position when facing backwards
					posTemporary = couplers_3D[0].position;
					couplers_3D[0].position = couplers_3D[1].position;
					couplers_3D[1].position = posTemporary;
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
					this.trainComposition.push(new locomotive(coordinates, this.layout, this.segment, this.subsegment, this.movingDirection, this.deltaDisplacement, this.trainCompositionInitial[0][1], this.rollingStock3DModels[i], this.scene));
				
				} else {
					
					var coordinatesReferenceBogie_previous = this.trainComposition[this.trainComposition.length-1].bogies[this.trainComposition[this.trainComposition.length-1].bogies.length-1].mesh.position;
					var layout_previous = this.trainComposition[this.trainComposition.length-1].bogies[this.trainComposition[this.trainComposition.length-1].bogies.length-1].layout;
					var segment_previous = this.trainComposition[this.trainComposition.length-1].bogies[this.trainComposition[this.trainComposition.length-1].bogies.length-1].segment;
					var subsegment_previous = this.trainComposition[this.trainComposition.length-1].bogies[this.trainComposition[this.trainComposition.length-1].bogies.length-1].subsegment;
					var movingDirection_previous = this.trainComposition[this.trainComposition.length-1].bogies[this.trainComposition[this.trainComposition.length-1].bogies.length-1].movingDirection;
	
					// Furthest point away of center first locomotive
					var first_coupler;
					if (this.trainCompositionInitial[i-1][1] == true) {
						first_coupler = new BABYLON.Vector3(this.rollingStock3DModels[i-1][2][1].getBoundingInfo().boundingBox.minimumWorld.x + couplerLockDistance, 0, 0);
					} else {
						first_coupler = new BABYLON.Vector3(this.rollingStock3DModels[i-1][2][1].getBoundingInfo().boundingBox.maximumWorld.x * -1 + couplerLockDistance, 0, 0);
					}
					
					// Position back bogie of first locomotive
					var first_bogie = this.trainComposition[i-1].posBogieBack_init; //OK
					
					// Furthest point away of center second locomotive (Maximum because mirrored)
					var second_coupler;
					if (this.trainCompositionInitial[i][1] == true) {
						second_coupler = new BABYLON.Vector3(this.rollingStock3DModels[i][2][0].getBoundingInfo().boundingBox.maximumWorld.x - couplerLockDistance, 0, 0);
					} else {
						second_coupler = new BABYLON.Vector3(this.rollingStock3DModels[i][2][0].getBoundingInfo().boundingBox.minimumWorld.x * -1 - couplerLockDistance, 0, 0);
					}
					
					// Position front bogie of second locomotive
					var second_bogie = this.trainComposition[i-1].posBogieFront_init; //OK
					
					// Distance to the first bogie of the next locomotive
					var distanceToNext = BABYLON.Vector3.Distance(first_coupler, first_bogie) + BABYLON.Vector3.Distance(second_coupler, second_bogie);
					
					// Debug distance between back bogie of first rolling stock unit and front bogie of second rolling stock unit.
					if (activeDebug == true) {
						console.log(distanceToNext);
					}
					
					// NEXT BUILD FUNCTION TO GET DISTANCE BETWEEN UNITS, now for debug set to 0.65
					var result = getPosNextBogie(coordinatesReferenceBogie_previous, layout_previous, segment_previous, subsegment_previous, movingDirection_previous, distanceToNext, scene);
					
					this.trainComposition.push(new locomotive(result[0], this.layout, result[1], result[2], this.movingDirection, this.deltaDisplacement, this.trainCompositionInitial[this.trainComposition.length][1], this.rollingStock3DModels[i], scene))
				
				}
			}
			
			// Initialisation of all units successfully finished
			this.initialized = true;
		}
			
		if (this.status == 1) {
			this.move();
		}
	}
	
	// Move train as a whole
	move() {
		
		// Debug distance between back bogie of first rolling stock unit and front bogie of second rolling stock unit.
		if (activeDebug == true) {
			console.log(BABYLON.Vector3.Distance(this.trainComposition[0].bogies_3D[1].position, this.trainComposition[1].bogies_3D[0].position));
		}
		
		var frametime; // Render time passed to speed function in ms
		
		// Decided between 3 cases
		if (engine.getDeltaTime() - blurTimeElapsed < 0) {
			
			// Case 1: engine.getDeltaTime() is 'normal', we don't need to adjust it
			blurTimeElapsed = 0;
			frametime = engine.getDeltaTime();
			if (engine.getDeltaTime() > (1000 / engine.getFps()) + 50) {
				
				// Case 2: engine.getDeltaTime() is absurdly high but we can't control it using 'blurTimeElapsed'. Happens when browser gets focus without actively chosing so: E.g. closing another programm and browser window is next in queue.
				frametime = previousFrameTime;
			}
		} else {
			
			// Case 3: Default case where engine.getDeltaTime() is being adjusted by 'blurTimeElapsed', which is the time this window spent without focus.
			frametime = engine.getDeltaTime() - blurTimeElapsed;
		}
		
		// Set displacement in relation to speed and render time so that speed is always the same no matter the fps.
		this.deltaDisplacement = speedToDistance(this.speed, frametime); 
		
		previousFrameTime = frametime; // Set previous frame in cases the current one can't be used
		
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
			this.trainComposition[i].deltaDisplacement = this.deltaDisplacement;
			this.trainComposition[i].move();
		}
	}
}