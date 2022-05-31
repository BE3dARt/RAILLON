class railSegment {
	constructor(ptStart, dirStart, ptEnd, dirEnd) {
        
        this.curveModifier = 1; // Adjust how wide the cureves will be
		this.curveSmoothness = 10; // Adjust how smooth the cureves will be (Higher numbers mean more curve points)
		
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
		if (activeDebug == true) {
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
		
		trackGauge = trackGauge / 19.65; // Don't know; checks out standard-gauge devided by 10 :D
		
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
			if (activeDebug == true) { 
				var bi = BABYLON.Mesh.CreateLines('bi', [ curve[p], curve[p].add(track[p]) ], scene);
				bi.color = BABYLON.Color3.Green();
			}
			
			rails.push(curve[p].add(track[p]))
		}
		return rails;
	}
}

class bogie {
	
	constructor(position, track, trackIndex, subTrackIndex, moveDir, mesh) {
		
		this.track = track;
		this.trackIndex = trackIndex;
		this.moveDir = moveDir;
		
		// Mesh
		this.mesh = mesh;
		this.mesh.position = position
		
		//Formalities
		this.mesh.rotationQuaternion = null;
		this.mesh.rotation = BABYLON.Vector3.Zero();
		
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
		this.mesh.rotation.y = (angle.radians() *-1) + Math.PI/2;
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
	
	// Implement interpolation!! So that position inbetween sub-track-indexes are also supported!
	
	// position: [track, trackIndex, subTrackIndex, interpolation]
	constructor(meshName, speed, position, moveDir, heading, scene) {
		this.speed = speed;
		this.position = position;
		this.moveDir = moveDir;
		this.heading = heading;
		this.initialized = false;
		
		this.mesh; // Will hold the hull mesh
		
		this.scene = scene; // DELETE AFTER DEBUG
		
		// Asynchronous asset loading function. We have to wait for it to finish before we can do stuff with it.
		const resultPromise = BABYLON.SceneLoader.ImportMeshAsync("", "https://raw.githubusercontent.com/BE3dARt/RAILBLAZER/main/assets/glb/", meshName + ".glb", scene);
		resultPromise.then((load3D) => {
			
			// Retrieve mesh for train hull
			this.mesh = load3D.meshes[1];
			
			// Retrieve position of first bogie now before it is being moved when initializing
			var posFirstBogieIn3DEditor = load3D.meshes[2].position;
			
			//Formalities
			this.mesh.rotationQuaternion = null;
			this.mesh.rotation = BABYLON.Vector3.Zero();
			
			// Bogie setup
			this.bogies = [new bogie(this.position[0].layout[position[1]].curvature.getPoints()[position[2]], position[0], position[1], position[2], moveDir, load3D.meshes[2])]; // Initialize first bogie
			
			// Initialize every other bogie (Start with 3 because 0th is 'root', 1st 'hull' and 2nd 'bogie 1')
			for (let i = 3; i < load3D.meshes.length; i++) {
				
				// Firstly we need to calculate the distance to the first bogie.
				var distanceVec = BABYLON.Vector3.Distance(posFirstBogieIn3DEditor, load3D.meshes[i].position);
				
				// Plug it into the function which will determine the bogie's position along the track.
				var result = this.bogieIndex(distanceVec);
				
				// Initialize every other bogie
				//this.bogies.push(new bogie(result[0], position[0], result[1], result[2], moveDir, load3D.meshes[i]));
				this.bogies.push(new bogie(result[0], position[0], result[1], result[2], moveDir, BABYLON.MeshBuilder.CreateBox("box", {}, scene)));
			}
			
			// Green light to all other functions
			this.initialized = true;
		})
	}
	
	// Given the distance apart from the first bogie, calculate the position of the next one.
	bogieIndex(range) {
		
		var subTrackIndex = this.position[2];
		var trackIndex = this.position[1];
		var posFirstBogie = this.position[0].layout[trackIndex].curvature.getPoints()[subTrackIndex];
		
		//Loop over all points in rail segement to find the starting position with correct range to first bogie
		while (true) {
			
			var posSecondBogie = this.position[0].layout[trackIndex].curvature.getPoints()[subTrackIndex];
			var distanceVec = BABYLON.Vector3.Distance(posFirstBogie, posSecondBogie);
			
			if (distanceVec >= range) {
				
				// Added ! to this.moveDir to invert expression because:
				// Technically it was not the first bogie! It's the rear-most one.
				var posSecondBogiePrevious;
				if (!this.moveDir == true) {
					posSecondBogiePrevious = this.position[0].layout[trackIndex].curvature.getPoints()[subTrackIndex - 1];
				}
				else {
					posSecondBogiePrevious = this.position[0].layout[trackIndex].curvature.getPoints()[subTrackIndex + 1];
				}
				
				var testus = intersection(posFirstBogie, posSecondBogie, posSecondBogiePrevious, range, this.scene);
				return [testus, trackIndex, subTrackIndex-1];
			}
			
			//Verify if index is still correct
			var updateIndex = verifyIndex (!this.moveDir, this.position[0], trackIndex, subTrackIndex);
			trackIndex = updateIndex[0];
			subTrackIndex = updateIndex[1];
		}
	}
	
	// Move hull and all bogies
	move() {
		
		// If meshes haven't been loaded
		if (this.initialized == false) {return}
		
		// Move the bogies
		for (let i = 0; i < this.bogies.length; i++) {
			this.bogies[i].move(this.speed);
		}
		
		// Move the hull
		var posFirstBogie = this.bogies[0].mesh.position;
		var posLastBogie = this.bogies[this.bogies.length-1].mesh.position;
		
		// Direction Vector
		var dirVec = new BABYLON.Vector3((posLastBogie.x - posFirstBogie.x) / 2, (posLastBogie.y - posFirstBogie.y) / 2, (posLastBogie.z - posFirstBogie.z) / 2);
		var ptRes = new BABYLON.Vector3(posFirstBogie.x + dirVec.x, posFirstBogie.y + dirVec.y, posFirstBogie.z + dirVec.z)
		
		// Rotate mesh (Only on x-z plane at the moment)
		var angle = BABYLON.Angle.BetweenTwoPoints(new BABYLON.Vector2(posFirstBogie.x, posFirstBogie.z), new BABYLON.Vector2(posLastBogie.x, posLastBogie.z));
		
		// Set direction (Currently only turns around hull; meaning bogies cannot be different)
		if (this.heading == true) {
			this.mesh.rotation.y = (angle.radians() *-1) + (Math.PI * (3/2));
		} else {
			this.mesh.rotation.y = (angle.radians() *-1) + (Math.PI * (5/2));
		}
		
		// Set new position
		this.mesh.position = ptRes;
	}
}

class wagon {
	
}

// A train consists of a couple of wagons
class train {
	
	// Composition: [["Name", heading]]
	constructor(compositionInitialized, speed, position, moveDir, scene) {
		
		this.speed = speed;
		this.moveDir = moveDir;
		
		// locomotive class needs to be able to be placed by coordinates not just indexes: Interpolation
		this.composition = [new locomotive(compositionInitialized[0][0], 0.015, [layout1, 1, 2, 0], this.moveDir, compositionInitialized[0][1], scene)];
		
		// This bit: [layout1, 1, 2, 0] needs to be calculated for the following members of the composition.
		for (let i = 1; i < composition.length; i++) {
			this.composition.push()
		}
	}
	
	// Position is defined as:
	// [layout, segment, subsegment, interpolation]
	
	// Return array 
	getBogiePositionNextMember() {
		
		// Return [layout, segment, subsegment, interpolation]
	}
}

;

class track {
	constructor(layout) {
		this.layout = layout;
	}
}
