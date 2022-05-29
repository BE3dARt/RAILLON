class railSegment {
	constructor(ptStart, dirStart, ptEnd, dirEnd) {
        
        this.curveModifier = 1; // Adjust how wide the cureves will be
		this.curveSmoothness = 10; // Adjust how smooth the cureves will be (Higher numbers mean more curve points)
		
		// Debug information on/off
		this.activeDebug = false;
		
		// Mirror angle of end joint and adjust for 360°
        dirEnd = dirEnd + 180
        if (dirEnd >= 360) {dirEnd -= 360}
        
		// Start and end points of curve
		this.curveStart = new BABYLON.Vector3(ptStart[0], ptStart[1], ptStart[2]);
		this.curveEnd = new BABYLON.Vector3(ptEnd[0], ptEnd[1], ptEnd[2]);
		
		// Curve control points (Define how wide the curve is)
		this.curveStartControl = new BABYLON.Vector3(ptStart[0] + (angleTo2DVector(dirStart, 5)[0] * this.curveModifier), 0, ptStart[2] + (angleTo2DVector(dirStart, 5)[1] * this.curveModifier));
		this.curveEndControl = new BABYLON.Vector3(ptEnd[0] + (angleTo2DVector(dirEnd, 5)[0] * this.curveModifier), 0, ptEnd[2] + (angleTo2DVector(dirEnd, 5)[1] * this.curveModifier));
		
		// Calculate how many points are needed (Dependent on length)
        this.curvature = BABYLON.Curve3.CreateCubicBezier(this.curveStart, this.curveStartControl, this.curveEndControl, this.curveEnd, 20);
		this.curvePointNumber = Math.round(this.curvature.length() * this.curveSmoothness );
		
		// Execute curve
		this.curvature = BABYLON.Curve3.CreateCubicBezier(this.curveStart, this.curveStartControl, this.curveEndControl, this.curveEnd, this.curvePointNumber);
		
		// Display tracks in 3D.
		BABYLON.Mesh.CreateLines("hermite", this.buildTrack(this.curvature.getPoints(), 1.435, true), scene);
		BABYLON.Mesh.CreateLines("hermite", this.buildTrack(this.curvature.getPoints(), 1.435, false), scene);
		
		// 3D Boxes to debug curve
		if (this.activeDebug == true) {
			this.Debug = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
			this.Debug.position = this.curveStartControl;
			this.Debug.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
			this.Debug = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
			this.Debug.position = this.curveEndControl;
			this.Debug.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
			this.Debug = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
			this.Debug.position = this.curveStart;
			this.Debug.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
			this.Debug = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
			this.Debug.position = this.curveEnd;
			this.Debug.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
		}
	}
	
	// Return spline which is trackGauge apart from the main spline. Used to create the tracks
	buildTrack(original, trackGauge, reverse) {
		
		trackGauge = trackGauge / 19.65; // Don't know; checks out with standard-gauge devided by 10 :D
		
		var path3d = new BABYLON.Path3D(original);
		var curve = path3d.getCurve();
		
		var track = path3d.getNormals();
		var rails = [];
		
		for(var p = 0; p < curve.length; p++) {
			
			if (reverse == true) {
				track[p] = track[p].multiply(new BABYLON.Vector3(trackGauge * -1, trackGauge * -1, trackGauge * -1));
			} else {
				track[p] = track[p].multiply(new BABYLON.Vector3(trackGauge, trackGauge, trackGauge));
			}
			
			// Show debug information
			if (this.activeDebug == true) { 
				var bi = BABYLON.Mesh.CreateLines('bi', [ curve[p], curve[p].add(track[p]) ], scene);
				bi.color = BABYLON.Color3.Green();
			}
			
			rails.push(curve[p].add(track[p]))
		}
		return rails;
	}
}

class bogie {
	
	constructor(position, track, trackIndex, subTrackIndex, moveDir) {
		
		this.track = track;
		this.trackIndex = trackIndex;
		this.moveDir = moveDir;
		
		// Mesh
		this.mesh = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
		this.mesh.position = position
		this.mesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
		
		// Currently there are two problems when starting the process:
		// - If 0 and reverese, it will throw error because index out of bounds
		// - If 1 and first position is equal to current mesh position, we will devide through 0
		this.subTrackIndex = subTrackIndex;
	}
	
	// Move the bogie along the spline defined in railSegment at a given speed.
	move(speed) {
		
		// Every 'CreateCubicBezier' creates a list of Vector3s. Dependent on direction, chose to get the next or the previous Vector3.
		if (this.moveDir == true) {
			var ptDestination = this.track.layout[this.trackIndex].curvature.getPoints()[this.subTrackIndex+1];
		} else {
			var ptDestination = this.track.layout[this.trackIndex].curvature.getPoints()[this.subTrackIndex-1];
		}
		
		// Vector calculations to get eventually get the next position of the bogie.
		var dirVec = new BABYLON.Vector3(ptDestination.x - this.mesh.position.x, ptDestination.y - this.mesh.position.y, ptDestination.z - this.mesh.position.z);
		var coefficient = speed / (Math.sqrt(Math.pow( dirVec.x, 2) + Math.pow( dirVec.y, 2) + Math.pow( dirVec.z, 2)));
		var dirVecUnit = new BABYLON.Vector3(dirVec.x * coefficient, dirVec.y * coefficient, dirVec.z * coefficient);
		var ptRes = new BABYLON.Vector3(this.mesh.position.x + dirVecUnit.x, this.mesh.position.y + dirVecUnit.y, this.mesh.position.z + dirVecUnit.z);
		
		// Rotate bogie (Only on x-z plane at the moment)
		var angle = BABYLON.Angle.BetweenTwoPoints(new BABYLON.Vector2(this.mesh.position.x, this.mesh.position.z), new BABYLON.Vector2(ptRes.x, ptRes.z));
		
		// Set ptRes to be the new position
		
		this.mesh.rotation.y = angle.radians() *-1;
		this.mesh.position = ptRes;
		
		
		// Check whether we overshoot the last (or the first) Vector3 entry in the segment.
		if (dirVec.length() <= dirVecUnit.length()) {
			
			var updateIndex = verifyIndex (this.moveDir, this.track, this.trackIndex, this.subTrackIndex);
			this.trackIndex = updateIndex[0];
			this.subTrackIndex = updateIndex[1];
			
		}
	}
}

// A locomotive consists of at least two bogies
class locomotive {
	
	//bogie: [[type, distance to first]]
	// position: [track, trackIndex, subTrackIndex]
	constructor(bogies, speed, position, moveDir, scene) {
		this.speed = speed;
		this.position = position;
		this.moveDir = moveDir;
		this.initialized = false;
		this.mesh;
		
		// Asynchronous asset loading function. We have to wait for it to finish before we can do stuff with it.
		const resultPromise = BABYLON.SceneLoader.ImportMeshAsync("", "https://raw.githubusercontent.com/BE3dARt/RAILBLAZER/main/assets/obj/", "Locomotive_USA_tex.obj", scene);
		resultPromise.then((result) => {
			this.mesh = result.meshes[1];
			this.mesh.position.x = 2;
		})
		
		//Bogie setup
		this.bogies = [new bogie(this.position[0].layout[position[1]].curvature.getPoints()[position[2]], position[0], position[1], position[2], moveDir)];
		for (let i = 1; i < bogies.length; i++) {
			var result = this.bogieIndex(bogies[i][1]);
			
			this.bogies.push(new bogie(result[0], position[0], result[1], result[2], moveDir))
		}
	}
	
	// Given the distance apart from the first bogie, calcaulte the position of the next one.
	bogieIndex(range) {
		
		var subTrackIndex = this.position[2];
		var trackIndex = this.position[1];
		var posFirstBogie = this.position[0].layout[trackIndex].curvature.getPoints()[subTrackIndex];
		
		//Loop over all points in rail segement to find the starting position with correct range to first bogie
		while (true) {
			
			var posSecondBogie = this.position[0].layout[trackIndex].curvature.getPoints()[subTrackIndex];
			var distanceVec = BABYLON.Vector3.Distance(posFirstBogie, posSecondBogie);
			
			if (distanceVec >= range) {
				
				var posSecondBogiePrevious = this.position[0].layout[trackIndex].curvature.getPoints()[subTrackIndex-1];
				
				var testus = intersection(posFirstBogie, posSecondBogie, posSecondBogiePrevious, range);
				
				return [testus, trackIndex, subTrackIndex-1];
				
			}
			
			//Verify if index is still correct
			var updateIndex = verifyIndex (this.moveDir, this.position[0], trackIndex, subTrackIndex);
			trackIndex = updateIndex[0];
			subTrackIndex = updateIndex[1];
		}
	}
	
	// Move hull and all bogies
	move() {
		for (let i = 0; i < this.bogies.length; i++) {
			this.bogies[i].move(this.speed);
		}
	}
}

class wagon {
	
}

// A train consists of a couple of wagons
class train {
	
}

class track {
	constructor(layout) {
		this.layout = layout;
	}
}
