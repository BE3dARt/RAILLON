function radian (deg) {
	return deg * (Math.PI/180);
}

function degrees (rad) {
	return rad * (180/Math.PI);
}

//Convert angle in degrees to a direction vector ()
function angleTo2DVector (angle, precision) {
	
	var x = Math.cos(radian(angle)) * Math.pow(10, precision);
	var y = Math.sin(radian(angle)) * Math.pow(10, precision);
		
	return [Math.round(x) / Math.pow(10, precision), Math.round(y) / Math.pow(10, precision)];
}

// Return a vector of the point which is on the line between pt1 and pt2 but also a given len away from home.
function intersection (home, pt1, pt2, len) {
	
	//Build orthogonal triangle
	var distance_home_to_pt2  = BABYLON.Vector3.Distance(home, pt2);
	var angle_orthogonal_triangle = new BABYLON.Angle (BABYLON.Angle.BetweenTwoPoints(pt2, home).radians() - BABYLON.Angle.BetweenTwoPoints(pt2, pt1).radians())
	var distance_line_to_home = Math.sin(angle_orthogonal_triangle.radians()) * distance_home_to_pt2;
	var len_orthogonal_triangle_on_line = Math.cos(angle_orthogonal_triangle.radians()) * distance_home_to_pt2;
	
	//Pythagorean theorem
	var adder = Math.sqrt(Math.pow(len, 2) - Math.pow(distance_line_to_home, 2));
	
	//Direction vector
	var dirVec = new BABYLON.Vector3(pt1.x - pt2.x, pt1.y - pt2.y, pt1.z - pt2.z);
	var coefficient = (len_orthogonal_triangle_on_line + adder) / (Math.sqrt(Math.pow( dirVec.x, 2) + Math.pow( dirVec.y, 2) + Math.pow( dirVec.z, 2)));
	var dirVecUnit = new BABYLON.Vector3(dirVec.x * coefficient, dirVec.y * coefficient, dirVec.z * coefficient);
	
	//Apply direction vector to pt2 to get the intersection point
	var ptRes = new BABYLON.Vector3(pt2.x + dirVecUnit.x, pt2.y + dirVecUnit.y, pt2.z + dirVecUnit.z);

	return ptRes;
}

// Track layout is devided into segments. If out of bounds, set index to next segement.
function verifyIndex (moveDir, track, trackIndex, subTrackIndex) {
	
	// Distinguish between forwards and backwards
	if (moveDir == true) {
		subTrackIndex += 1;
	
		// Check if segment is finished
		if (subTrackIndex == track.layout[trackIndex].curvature.getPoints().length -1) {
			trackIndex += 1;
			subTrackIndex = 0;
			
			// Check if track is finished
			if (trackIndex == track.layout.length) {
				trackIndex = 0;
			}
		}
	} else {
		subTrackIndex -= 1;
		
		// Check if segment is at start, so move it to the end
		if (subTrackIndex == 0) {
			if (trackIndex == 0) {
				trackIndex = track.layout.length -1;
			} else {
				trackIndex -= 1;
			}
			
			subTrackIndex = track.layout[trackIndex].curvature.getPoints().length -1;
		}
	}
	
	return [trackIndex, subTrackIndex];
}