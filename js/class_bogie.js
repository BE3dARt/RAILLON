class bogie {
	
	constructor(coordinates, map, section, segment, subsegment, mesh) {
		
		// Initial Position
		this.posInitial = mesh.position;
		
		// Mesh
		this.mesh = mesh;
		this.mesh.position = coordinates;
		
		// Where the bogie is in map-index-position
		this.map = map;
        this.section = section;
		this.segment = segment;
		this.subsegment = subsegment; // If 0 and reverese, it will throw error because index out of bounds && If 1 and first position is equal to current mesh position, we will devide through 0
	}
	
	// Move the bogie along the spline defined in railSegment at a given speed. (Somehow increases distance between two bogies!)
	move(deltaDisplacement, movingDirection, heading) {
		
		// Every 'CreateCubicBezier' creates a list of Vector3s. Dependent on direction, chose to get the next or the previous Vector3.
		var ptStart = this.map.railnetwork[this.section][this.segment].rails.curvature.getPoints()[this.subsegment];
		if (movingDirection == true) {
			var destinationIndex = verifyIndex (movingDirection, this.map, this.section, this.segment, this.subsegment);
			var ptDestination = this.map.railnetwork[destinationIndex[0]][destinationIndex[1]].rails.curvature.getPoints()[destinationIndex[2]];
    
		} else {
			var destinationIndex = verifyIndex (movingDirection, this.map, this.section, this.segment, this.subsegment);
			var ptDestination = this.map.railnetwork[destinationIndex[0]][destinationIndex[1]].rails.curvature.getPoints()[destinationIndex[2]];
		}

		// Vector calculations to get eventually get the next position of the bogie.
		var dirVec = new BABYLON.Vector3(ptDestination.x - this.mesh.position.x, ptDestination.y - this.mesh.position.y, ptDestination.z - this.mesh.position.z);
		var coefficient = deltaDisplacement / (Math.sqrt(Math.pow( dirVec.x, 2) + Math.pow( dirVec.y, 2) + Math.pow( dirVec.z, 2)));
		var dirVecUnit = new BABYLON.Vector3(dirVec.x * coefficient, dirVec.y * coefficient, dirVec.z * coefficient);
		var ptRes = new BABYLON.Vector3(this.mesh.position.x + dirVecUnit.x, this.mesh.position.y + dirVecUnit.y, this.mesh.position.z + dirVecUnit.z);
		
		// Rotate bogie (Only on x-z plane at the moment)
		var angle = BABYLON.Angle.BetweenTwoPoints(new BABYLON.Vector2(this.mesh.position.x, this.mesh.position.z), new BABYLON.Vector2(ptRes.x, ptRes.z));
		
		// Set rotation (NEEDS FIX: Is not smooth! Must find another way!)
		this.mesh.rotation.y = (angle.radians() *-1) + Math.PI* 3/2;
		
		// If locomotive is facing backwards adjust the rotation
		if (heading == false) {
			this.mesh.rotation.y += Math.PI;
		}
		
		if (BABYLON.Vector3.Distance(this.mesh.position, ptRes) >= BABYLON.Vector3.Distance(this.mesh.position, ptDestination)) {
			var updateIndex = verifyIndex (movingDirection, this.map, this.section, this.segment, this.subsegment);
			this.section = updateIndex[0];
            this.segment = updateIndex[1];
			this.subsegment = updateIndex[2];
			this.move(deltaDisplacement, movingDirection, heading);
		} 
		
		// Set ptRes to be the new position
		this.mesh.position = ptRes;
		
		// Check whether we overshoot the last (or the first) Vector3 entry in the segment.
		if (dirVec.length() <= dirVecUnit.length()) {
			var updateIndex = verifyIndex (movingDirection, this.map, this.section, this.segment, this.subsegment);
			this.section = updateIndex[0];
            this.segment = updateIndex[1];
			this.subsegment = updateIndex[2];
		}
	}
}