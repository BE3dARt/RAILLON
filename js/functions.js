//Convert degrees into radian (Will be replaced by BABYLON native angles)
function radian (deg) {
	return deg * (Math.PI/180);
}

//Convert angle in degrees to a direction vector
function angleTo2DVector (angle, precision) {
	
	var x = Math.cos(radian(angle)) * Math.pow(10, precision);
	var y = Math.sin(radian(angle)) * Math.pow(10, precision);
		
	return [Math.round(x) / Math.pow(10, precision), Math.round(y) / Math.pow(10, precision)];
}

// Track layout is devided into segments. If out of bounds, set index to next segement.
function verifyIndex (moveDir, track, segment, subsegment) {
	
	// Distinguish between forwards and backwards
	if (moveDir == true) {
		
		// Prevent it from going out of bounds
		if (subsegment != track.layout[segment].curvature.getPoints().length - 1) {
			subsegment += 1;
		}
		
		// Check if segment is finished
		if (subsegment == track.layout[segment].curvature.getPoints().length - 1) {
			segment += 1;
			subsegment = 1; // I believe it gives error when last point of previous segement is the same as 0th index of current segment. So we target the first index instead.
			
			// Check if track is finished
			if (segment == track.layout.length) {
				segment = 0;
			}
		}
	} else {
		
		// Prevent it from going to -1
		if (subsegment != 0) {
			subsegment -= 1;
		}
		
		// If segment is at start move it to the end
		if (subsegment == 0) {
			if (segment == 0) {
				segment = track.layout.length - 1;
			} else {
				segment -= 1;
			}
			
			subsegment = track.layout[segment].curvature.getPoints().length - 2; // Stupid error with -1: In some rare cases the last index of the previous segment was equal to the 0th of the new one. 'intersection' would not work
		}
	}
	
	return [segment, subsegment];
}

/*

// Return a vector of the point which is on the line between pt1 and pt2 but also a given len away from home.
function intersection (home, pt1, pt2, len, scene) { // DELETE SCENE
	
	// Throw error if no point can be found
	if (BABYLON.Vector3.Distance(home, pt2) > len) {
		throw "No point found with given length!"
	}
	
	//Build orthogonal triangle
	var distance_home_to_pt2  = BABYLON.Vector3.Distance(home, pt2);
	var angle_orthogonal_triangle = new BABYLON.Angle (BABYLON.Angle.BetweenTwoPoints(pt2, home).radians() - BABYLON.Angle.BetweenTwoPoints(pt2, pt1).radians()) // Wired behaviour if this is zero
	var distance_line_to_home = Math.sin(angle_orthogonal_triangle.radians()) * distance_home_to_pt2;
	
	// Had to fix bug where cos returned 1 if angle is set to 0. It would always give back -1. (Problem could be seen at e.g. (7, 15) or (1, 3))
	var len_orthogonal_triangle_on_line = Math.abs(Math.cos(angle_orthogonal_triangle.radians())) * -1 * distance_home_to_pt2;

	//Pythagorean theorem
	var adder = Math.sqrt(Math.pow(len, 2) - Math.pow(distance_line_to_home, 2));
	
	//Direction vector
	var dirVec = new BABYLON.Vector3(pt1.x - pt2.x, pt1.y - pt2.y, pt1.z - pt2.z);
	var coefficient = (len_orthogonal_triangle_on_line + adder) / (Math.sqrt(Math.pow( dirVec.x, 2) + Math.pow( dirVec.y, 2) + Math.pow( dirVec.z, 2)));
	var dirVecUnit = new BABYLON.Vector3(dirVec.x * coefficient, dirVec.y * coefficient, dirVec.z * coefficient);
	
	//Apply direction vector to pt2 to get the intersection point
	var ptRes = new BABYLON.Vector3(pt2.x + dirVecUnit.x, pt2.y + dirVecUnit.y, pt2.z + dirVecUnit.z);
	
	// Display first position of Bogie for debug
	if (activeDebug == true) {
		
		console.log("(" + home.x + ", " + home.z + ")");
		console.log("(" + pt1.x + ", " + pt1.z + ")");
		console.log("(" + pt2.x + ", " + pt2.z + ")");
		console.log("(" + ptRes.x + ", " + ptRes.z + ")");
		
		var Debug = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
		Debug.position = home;
		Debug.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
		
		Debug = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
		Debug.position = pt1;
		Debug.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
		
		Debug = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
		Debug.position = pt2;
		Debug.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
		
		Debug = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
		Debug.position = ptRes;
		Debug.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
	}
	
	return ptRes;
}

// Function receives position of one bogie and the distance to the next bogie. Returns position of next bogie along with at which segment and subsegment it currently is.
function getBogiePositionNextMember(coordinatesReferenceBogie, layout, segment, subsegment, movingDirection, distance, scene) {
	
	//Loop over all points in rail segement to find the starting position with correct range to first bogie
	while (true) {
		
		var posSecondBogie = layout.layout[segment].curvature.getPoints()[subsegment];
		var distanceVec = BABYLON.Vector3.Distance(coordinatesReferenceBogie, posSecondBogie);
		
		if (distanceVec >= distance) {
			
			// We modify the index so we need to check the index's validity first
			var index = verifyIndex (movingDirection, layout, segment, subsegment);
			segment = index[0];
			subsegment = index[1];
			
			// Get previous position to build a line between present and previous point
			posSecondBogiePrevious = layout.layout[segment].curvature.getPoints()[subsegment];
			
			var ptintersection = intersection(coordinatesReferenceBogie, posSecondBogie, posSecondBogiePrevious, distance, scene);
			

			return [ptintersection, segment, subsegment];
		}
		
		//Verify if index is still correct
		var updateIndex = verifyIndex (!movingDirection, layout, segment, subsegment);
		segment = updateIndex[0];
		subsegment = updateIndex[1];
	}
}

*/

// I might regret it but I need to test it ... 
function getPosNextBogie(coordinatesReferenceBogie, layout, segment, subsegment, movingDirection, distance, scene) {
	
	var ptPrevious = layout.layout[segment].curvature.getPoints()[subsegment];
	var indexPrevious = [segment, subsegment];
	var ptNext;
	
	var disSum = BABYLON.Vector3.Distance(coordinatesReferenceBogie, ptPrevious) * -1;
	
	while (true) {
		
		// Verify if index is still correct
		var updateIndex = verifyIndex (!movingDirection, layout, segment, subsegment);
		segment = updateIndex[0];
		subsegment = updateIndex[1];
		
		// Get current pt
		ptNext = layout.layout[segment].curvature.getPoints()[subsegment];
		
		// Calculate distance between previous and next point (pt)
		var disBetweenPoints = BABYLON.Vector3.Distance(ptPrevious, ptNext);
		
		// Check if we are in correct subsegment
		if (disSum + disBetweenPoints >= distance) {
			
			// Get distance from last point on curve to target
			var disTemporary = Math.abs(distance - disSum);
			
			// Form direction vector
			var dirVec = new BABYLON.Vector3(ptNext.x - ptPrevious.x, ptNext.y - ptPrevious.y, ptNext.z - ptPrevious.z);
			var coefficient = disTemporary / (Math.sqrt(Math.pow(dirVec.x, 2) + Math.pow(dirVec.y, 2) + Math.pow(dirVec.z, 2)));
			var dirVecUnit = new BABYLON.Vector3(dirVec.x * coefficient, dirVec.y * coefficient, dirVec.z * coefficient);
			
			var ptRes = new BABYLON.Vector3(ptPrevious.x + dirVecUnit.x, ptPrevious.y + dirVecUnit.y, ptPrevious.z + dirVecUnit.z);
			
			return [ptRes, indexPrevious[0], indexPrevious[1]]
			
		}
		
		// Reset ptPrevious
		ptPrevious = ptNext;
		
		// Reset previous index
		indexPrevious[0] = updateIndex[0];
		indexPrevious[1] = updateIndex[1];
		
		// Add to sum
		disSum += disBetweenPoints;
		
	}
}

// Provide array containing every train composition and a mesh id to receive the index of the train and the index of the locomotive
function idToIndex(compositions, meshIdentification) {
	
	// Loop over all compositions
	for (let cIndex = 0; cIndex < compositions.length; cIndex++) {
		
		// Loop over every rolling stock unit in this specific composition
		for (let rsIndex = 0; rsIndex < compositions[cIndex].trainComposition.length; rsIndex++) {
			
			// Loop over every sub mesh of this specific rolling stock unit
			for (let sbIndex = 0; sbIndex < compositions[cIndex].trainComposition[rsIndex].meshIDs.length; sbIndex++) {
				if (compositions[cIndex].trainComposition[rsIndex].meshIDs[sbIndex] == meshIdentification) {
					return [cIndex, rsIndex, sbIndex];
				}
			}
		}
	}
	
	return null
}

// Provide speed and time between frames and receive displacement
function speedToDistance(speed, time) {
	return (speed * (time/1000))/10;
	// console.log((this.speed / (engine.getDeltaTime() / 1000)) * 10); // In m/s
}