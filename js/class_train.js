class train {
	
	// trainCompositionInitial: [["Name", heading]]
	constructor(trainCompositionInitial, layout, segment, subsegment, movingDirection, speed, scene) {
		
		this.speed = speed;
		this.movingDirection = movingDirection;
		this.initialized = false;
		
		// Convert the first track-index-position to coordinates
		this.coordinates = layout.layout[segment].curvature.getPoints()[subsegment];
		
		// Add first unit to train composition
		this.trainComposition = [new locomotive(this.coordinates, layout, segment, subsegment, movingDirection, speed, trainCompositionInitial[0][1], trainCompositionInitial[0][0], scene)];
		
		/*
		
		for (let i = 1; i < trainCompositionInitial.length; i++) {
			
			console.log(this.trainComposition[this.trainComposition.length-1].initialized)
			
			// while (this.trainComposition[this.trainComposition.length-1].initialized == false) {console.log("Waiting...")}
			
			// NOW FIND WHERE TO SPAWN THE NEXT ROLLING STOCK!!!
			
			this.coordinates = layout.layout[segment+1].curvature.getPoints()[4];
			
			console.log(this.trainComposition[0].bogies)
			
			var previousBogiePosition = this.trainComposition[this.trainComposition.lenght-1].bogies[this.trainComposition[this.trainComposition.lenght-1].bogies.lenght-1].mesh.position;
			
			
			
			// var result = getBogiePositionNextMember(, layout, segment, subsegment, movingDirection, distance, scene) 
			
			this.trainComposition.push(new locomotive(this.coordinates, layout, segment+1, 4, movingDirection, speed, trainCompositionInitial[i][1], trainCompositionInitial[i][0], scene))
		}
		
		*/
	}
	
	initialize() {
		
		if (this.trainComposition[this.trainComposition.length-1].initialized == true) {
			
			// Add new unit here until trainCompositionInitial is finished
			
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
		
		if (this.initialized == false) {
			return
		}
		
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