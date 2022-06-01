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
				this.rollingStock3DModels.push(load3D);
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
					
					// NEXT BUILD FUNCTION TO GET DISTANCE BETWEEN UNITS, now for debug set to 0.65
					var result = getBogiePositionNextMember(coordinatesReferenceBogie_previous, layout_previous, segment_previous, subsegment_previous, movingDirection_previous, 0.69, scene);
					
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
			this.trainComposition[i].move();
		}
	}
}