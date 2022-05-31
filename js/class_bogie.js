class bogie {
	
	constructor(coordinates, layout, segment, subsegment, movingDirection, mesh) {
		
		// Mesh
		this.mesh = mesh;
		this.mesh.position = coordinates;
		
		// Where the bogie is in track-index-position
		this.layout = layout;
		this.segment = segment;
		this.subsegment = subsegment; // If 0 and reverese, it will throw error because index out of bounds && If 1 and first position is equal to current mesh position, we will devide through 0
		this.movingDirection = movingDirection;
		
		//Formalities
		this.mesh.rotationQuaternion = null;
		this.mesh.rotation = BABYLON.Vector3.Zero();
	}
	
	// Move the bogie along the spline defined in railSegment at a given speed. (Somehow increases distance between two bogies!)
	move(speed) {
		
		// Every 'CreateCubicBezier' creates a list of Vector3s. Dependent on direction, chose to get the next or the previous Vector3.
		if (this.movingDirection == true) {
			var ptDestination = this.layout.layout[this.segment].curvature.getPoints()[this.subsegment+1];
		} else {
			var ptDestination = this.layout.layout[this.segment].curvature.getPoints()[this.subsegment-1];
		}
		
		// Vector calculations to get eventually get the next position of the bogie.
		var dirVec = new BABYLON.Vector3(ptDestination.x - this.mesh.position.x, ptDestination.y - this.mesh.position.y, ptDestination.z - this.mesh.position.z);
		var coefficient = speed / (Math.sqrt(Math.pow( dirVec.x, 2) + Math.pow( dirVec.y, 2) + Math.pow( dirVec.z, 2)));
		var dirVecUnit = new BABYLON.Vector3(dirVec.x * coefficient, dirVec.y * coefficient, dirVec.z * coefficient);
		var ptRes = new BABYLON.Vector3(this.mesh.position.x + dirVecUnit.x, this.mesh.position.y + dirVecUnit.y, this.mesh.position.z + dirVecUnit.z);
		
		// Rotate bogie (Only on x-z plane at the moment)
		var angle = BABYLON.Angle.BetweenTwoPoints(new BABYLON.Vector2(this.mesh.position.x, this.mesh.position.z), new BABYLON.Vector2(ptRes.x, ptRes.z));
		
		// Set ptRes to be the new position
		this.mesh.rotation.y = (angle.radians() *-1) + Math.PI/2;
		this.mesh.position = ptRes;
		
		// Check whether we overshoot the last (or the first) Vector3 entry in the segment.
		if (dirVec.length() <= dirVecUnit.length()) {
			
			var updateIndex = verifyIndex (this.movingDirection, this.layout, this.segment, this.subsegment);
			this.segment = updateIndex[0];
			this.subsegment = updateIndex[1];
		}
	}
}