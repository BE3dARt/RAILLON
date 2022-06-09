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
function verifyIndex (moveDir, track, section, segment, subsegment) {

	// Distinguish between forwards and backwards
	if (moveDir == true) {
		
		// Prevent it from going out of bounds
		if (subsegment != track.network.rails[section][segment].curvature.getPoints().length - 1) {
			subsegment += 1;
		}
		
		// Check if segment is finished
		if (subsegment == track.network.rails[section][segment].curvature.getPoints().length - 1) {
			segment += 1;
			subsegment = 1; // I believe it gives error when last point of previous segement is the same as 0th index of current segment. So we target the first index instead.
		
			// Check if track is finished
			if (segment == track.network.rails[section].length) {
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
				segment = track.network.rails[section].length - 1;
			} else {
				segment -= 1;
			}
			
			subsegment = track.network.rails[section][segment].curvature.getPoints().length - 2; // Stupid error with -1: In some rare cases the last index of the previous segment was equal to the 0th of the new one. 'intersection' would not work
		}
	}
	
	return [section, segment, subsegment];
}

// I might regret it but I need to test it ... 
function getPosNextBogie(coordinatesReferenceBogie, track, section, segment, subsegment, movingDirection, distance, scene) {
    
	var ptPrevious = track.network.rails[section][segment].curvature.getPoints()[subsegment];
	var indexPrevious = [segment, subsegment];
	var ptNext;
	
	var disSum = BABYLON.Vector3.Distance(coordinatesReferenceBogie, ptPrevious) * -1;
	
	while (true) {
		
		// Verify if index is still correct
		var updateIndex = verifyIndex (!movingDirection, track, section, segment, subsegment);
		section = updateIndex[0];
        segment = updateIndex[1];
		subsegment = updateIndex[2];
        
		// Get current pt
		ptNext = track.network.rails[section][segment].curvature.getPoints()[subsegment];
		
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
			
			return [ptRes, indexPrevious[0], indexPrevious[1], indexPrevious[2]]
			
		}
		
		// Reset ptPrevious
		ptPrevious = ptNext;
		
		// Reset previous index
        indexPrevious[0] = updateIndex[0];
		indexPrevious[1] = updateIndex[1];
		indexPrevious[2] = updateIndex[2];
		
		// Add to sum
		disSum += disBetweenPoints;
		
	}
}

// Provide array containing every train composition and a mesh id to receive the index of the train and the index of the locomotive
function idToIndex(compositions, meshIdentification) {
	
	// Loop over all compositions
	for (let cIndex = 0; cIndex < compositions.length; cIndex++) {
		
		// Loop over every rolling stock unit in this specific composition
		for (let rsIndex = 0; rsIndex < compositions[cIndex].composition.length; rsIndex++) {
			
			// Loop over every sub mesh of this specific rolling stock unit
			for (let sbIndex = 0; sbIndex < compositions[cIndex].composition[rsIndex].configuration.id.length; sbIndex++) {
				if (compositions[cIndex].composition[rsIndex].configuration.id[sbIndex] == meshIdentification) {
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
}

function unitNameToIndex (match) {
	for (let i = 0; i < units.length; i++) {
		if (units[i].name == match) {
			return i;
		}
	}
	return -1;
}

function railwayNetworkNameToIndex (match) {
	for (let i = 0; i < railnetwork.length; i++) {
		if (railnetwork[i].name == match) {
			return i;
		}
	}
	return -1;
}

// Check if provided variable does not exists
function check (variable, name, type) {
	if (variable === undefined) {throw("You forget to set '" + name + "' for rolling stock type '" + type + "' in 'units.js'")} // Throw error if not defined
}