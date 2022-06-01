class train {
	
	// trainCompositionInitial: [["Name", heading]]
	constructor(trainCompositionInitial, layout, segment, subsegment, movingDirection, speed, scene) {
		
		this.trainCompositionInitial = trainCompositionInitial;
		this.layout = layout;
		this.speed = speed;
		this.movingDirection = movingDirection;
		this.initialized = false;
		
		// Convert the first track-index-position to coordinates
		this.coordinates = layout.layout[segment].curvature.getPoints()[subsegment];
		
		// Add first unit to train composition
		this.trainComposition = [new locomotive(this.coordinates, layout, segment, subsegment, movingDirection, speed, trainCompositionInitial[0][1], trainCompositionInitial[0][0], scene)];
	}
	
	update() {
		
		// Move train only if every unit has been initialized
		if (this.trainCompositionInitial.length == this.trainComposition.length) {
			this.move();
			return;
		}
		
		// If before initialized unit is done, add another one
		if (this.trainComposition[this.trainComposition.length-1].initialized == true) {
			
			var coordinatesReferenceBogie_previous = this.trainComposition[this.trainComposition.length-1].bogies[this.trainComposition[this.trainComposition.length-1].bogies.length-1].mesh.position;
			var layout_previous = this.trainComposition[this.trainComposition.length-1].bogies[this.trainComposition[this.trainComposition.length-1].bogies.length-1].layout;
			var segment_previous = this.trainComposition[this.trainComposition.length-1].bogies[this.trainComposition[this.trainComposition.length-1].bogies.length-1].segment;
			var subsegment_previous = this.trainComposition[this.trainComposition.length-1].bogies[this.trainComposition[this.trainComposition.length-1].bogies.length-1].subsegment;
			var movingDirection_previous = this.trainComposition[this.trainComposition.length-1].bogies[this.trainComposition[this.trainComposition.length-1].bogies.length-1].movingDirection;
			
			// NEXT BUILD FUNCTION TO GET DISTANCE BETWEEN UNITS, now for debug set to 0.65
			
			var result = getBogiePositionNextMember(coordinatesReferenceBogie_previous, layout_previous, segment_previous, subsegment_previous, movingDirection_previous, 0.65, scene);
			
			this.trainComposition.push(new locomotive(result[0], this.layout, result[1], result[2], this.movingDirection, this.speed, this.trainCompositionInitial[this.trainComposition.length][1], this.trainCompositionInitial[this.trainComposition.length][0], scene))
			
		}
	}
	
	// Move train as a whole
	move() {
		
		/*
		// Loop over every locomotive and wagon to find out if it's already ready to move
		for (let i = 0; i < this.trainComposition.length; i++) {
			if (this.trainComposition[i].initialized == false) {
				return;
			}
		}
		*/
		
		// Loop over every locomotive and wagon and update their position
		for (let i = 0; i < this.trainComposition.length; i++) {
			this.trainComposition[i].move();
		}
	}
	
	// Position is defined as:
	// [layout, segment, subsegment, interpolation]
	
	// Return array 
	getBogiePositionNextMember() {
		
		// Return [layout, segment, subsegment, interpolation]
	}
}