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

// Provide current position on railway network and get the destination of the next segment back
function verifyIndex (moveDir, map, section, segment, subsegment) {

	// Store position information before being modifed
	var sectionInit = section;
	var segmentInit = segment;
	
	// Store moving direction before being modifed
	var moveDirPrev = moveDir;
	
	// Number of interpolation points in a segment
	var nbPointsOfSegment = map.railnetwork[sectionInit][segmentInit].rails.curvature.getPoints().length;
	// Fowards (move from 'start' to 'end')
	if (moveDir == true) {
		
		// Alert when train has moved over a switch from the 'destination'-side
		if (subsegment == 1) {
			if (map.railnetwork[sectionInit][segmentInit].switch.object != null && map.railnetwork[sectionInit][segmentInit].switch.start.length >= 2) {
				// console.log("Change Switch Forwards");
			}
		}
		
		// Increse subsegment index (interpolation in a segment) and simultaneously prevent it from going over the segment length
		if (subsegment != nbPointsOfSegment - 1) {subsegment += 1}
		
		// Check if 'end' of segment has been reached
		if (subsegment == nbPointsOfSegment - 1) {
			
			// At this switch the direction must actively be decided
			if (map.railnetwork[sectionInit][segmentInit].switch.object != null && map.railnetwork[sectionInit][segmentInit].switch.start.length == 1) {
				[section, segment, moveDir] = map.railnetwork[sectionInit][segmentInit].switch.object.getDestination();
			} else {
				section = map.railnetwork[sectionInit][segmentInit].switch.end[0].section;
				segment = map.railnetwork[sectionInit][segmentInit].switch.end[0].segment;
				moveDir = map.railnetwork[sectionInit][segmentInit].switch.end[0].direction;

			}
			
			// If direction has changed, so must the susegment
			if (moveDirPrev != moveDir) {
				subsegment = map.railnetwork[section][segment].rails.curvature.getPoints().length - 2;
			} else {
				subsegment = 1;
			}
			
		}
		
	// Backwards (move from 'end' to 'start')
	} else {
		
		// Alert when train has moved over a switch from the 'destination'-side
		if (subsegment == map.railnetwork[section][segment].rails.curvature.getPoints().length - 2) {
			if (map.railnetwork[sectionInit][segmentInit].switch.object != null && map.railnetwork[sectionInit][segmentInit].switch.end.length >= 2) {
				// console.log("Change Switch Backwards");
			}
		}
		
		// Decrease subsegment index (interpolation in a segment) and simultaneously prevent it from going -1
		if (subsegment != 0) {subsegment -= 1}
		
		// Check if 'start' of segment has been reached
		if (subsegment == 0) {
			
			// At this switch the direction must actively be decided
			if (map.railnetwork[sectionInit][segmentInit].switch.object != null && map.railnetwork[sectionInit][segmentInit].switch.end.length == 1) {
				[section, segment, moveDir] = map.railnetwork[sectionInit][segmentInit].switch.object.getDestination();
			} else {
				section = map.railnetwork[sectionInit][segmentInit].switch.start[0].section;
				segment = map.railnetwork[sectionInit][segmentInit].switch.start[0].segment;
				moveDir = map.railnetwork[sectionInit][segmentInit].switch.start[0].direction;
			}
			
			// If direction has changed, so must the susegment
			if (moveDirPrev != moveDir) {
				subsegment = 1;
			} else {
				subsegment = map.railnetwork[section][segment].rails.curvature.getPoints().length - 2;
			}
			
		}
	}
	
	return [section, segment, subsegment, moveDir];
}

// I might regret it but I need to test it ... 
function getPosNextBogie(coordinatesReferenceBogie, map, section, segment, subsegment, movingDirection, distance, scene) {
	
	var ptPrevious = map.railnetwork[section][segment].rails.curvature.getPoints()[subsegment];
	var indexPrevious = [segment, subsegment];
	var ptNext;
	
	var disSum = BABYLON.Vector3.Distance(coordinatesReferenceBogie, ptPrevious) * -1;
	
	while (true) {
		
		// Verify if index is still correct
		var updateIndex = verifyIndex (!movingDirection, map, section, segment, subsegment);
		section = updateIndex[0];
        segment = updateIndex[1];
		subsegment = updateIndex[2];
        
		// Get current pt
		ptNext = map.railnetwork[section][segment].rails.curvature.getPoints()[subsegment];
		
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
	for (let i = 0; i < railwayNetworkConfiguration.length; i++) {
		if (railwayNetworkConfiguration[i].name == match) {
			return i;
		}
	}
	return -1;
}

function switchMeshToIndex (match) {
	for (let i = 0; i < switches.length; i++) {
		if (switches[i].boundingBox.uniqueId == match) {
			return i;
		}
	}
	return null;
}

// Check if provided variable does not exists
function check (variable, name, type) {
	if (variable === undefined) {throw("You forget to set '" + name + "' for rolling stock type '" + type + "' in 'units.js'")} // Throw error if not defined
}