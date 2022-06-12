class railswitch {
	constructor(origin, destination, coordinates, scene) {
		
		// Direction (false: origin - direction1, true: origin - direction2)
		this.direction = false;
		
		// Because we can't pick bounding boxes we will just fake it
		this.boundingBox = new BABYLON.MeshBuilder.CreateBox("box", {}, scene);
		this.boundingBox.scaling = new BABYLON.Vector3(1.5, 0.1, 1.5);
		this.boundingBox.position = new BABYLON.Vector3(coordinates[0], coordinates[1], coordinates[2]);
		this.boundingBox.visibility = 0;
		
		// Origin 
		this.origin = {
			section: origin[0].section,
			segment: origin[0].segment,
			subsegment: origin[0].subsegment,
			direction: origin[0].direction,
		};
		
		// Desitination 
		this.destination = [
			{
				section: destination[0].section,
				segment: destination[0].segment,
				subsegment: destination[0].subsegment,
				direction: destination[0].direction,
			}, 
			{
				section: destination[1].section,
				segment: destination[1].segment,
				subsegment: destination[1].subsegment,
				direction: destination[1].direction,
			}
		];
		
		// Holds animation settings of this railway switch
		this.animation = {
			namespace: null,
			keyFramesFull: null,
			keyFramesZero: null,
		}
		
		// Asynchronous asset loading function
		const resultPromise = BABYLON.SceneLoader.ImportMeshAsync("", "https://raw.githubusercontent.com/BE3dARt/RAILBLAZER/main/assets/glb/", "animated_arrow.glb", scene);
			
		// Promise of the asset loading function
		resultPromise.then((switch3D) => {
			
			// Set position of mesh to provided coordinates
			switch3D.meshes[0].position = new BABYLON.Vector3(coordinates[0], coordinates[1], coordinates[2]);
			
			// Add keyframes because I can't export multiple animation takes from Cinema 4D. Therefore I added pose morphs but need to change its values now.
			this.keyFramesFull = [];
			this.keyFramesFull.push({frame: 0, value: 0});
			this.keyFramesFull.push({frame: 60, value: 1});
			
			this.keyFramesZero = [];
			this.keyFramesZero.push({frame: 0, value: 1});
			this.keyFramesZero.push({frame: 60, value: 0});
			
			// Write to object variable
			this.animation.namespace = switch3D.animationGroups[0];
			
			// Left
			this.animation.namespace.targetedAnimations[0].animation.setKeys(this.keyFramesZero)
			
			// Right
			this.animation.namespace.targetedAnimations[1].animation.setKeys(this.keyFramesFull)
			
			// Don't loop animation
			this.animation.namespace.animatables[0].loopAnimation = false;
			this.animation.namespace.animatables[1].loopAnimation = false;
			
		})
	}
	
	// Run the animation
	animationRun() {
		
		if (this.direction == false) {
			
			// Left
			this.animation.namespace.targetedAnimations[0].animation.setKeys(this.keyFramesFull)
			
			// Right
			this.animation.namespace.targetedAnimations[1].animation.setKeys(this.keyFramesZero)
			
		} else {
			
			// Left
			this.animation.namespace.targetedAnimations[0].animation.setKeys(this.keyFramesZero)
			
			// Right
			this.animation.namespace.targetedAnimations[1].animation.setKeys(this.keyFramesFull)
			
		}
		
		this.animation.namespace.start()

	}
	
	// Return the next index
	getDestination() {
		if (this.direction == false) {
			return [this.destination[0].section, this.destination[0].segment, this.destination[0].direction]
		} else {
			return [this.destination[1].section, this.destination[1].segment, this.destination[1].direction]
		}
	}
}

class Map {
	constructor(name, scene) {
        
        // Build railway railnetwork
        var railnetworkIndex = railwayNetworkNameToIndex(name);
		
		// Scene
		this.scene = scene;
		
        this.railnetwork = railwayNetworkConfiguration[railnetworkIndex].rails;
		var railnetworkClone = Object.assign( [] , this.railnetwork); // Deep copy
        for (let sectionIndex = 0; sectionIndex < this.railnetwork.length; sectionIndex++) {
			
			var arrInput = [];
            for (let segmentIndex = 0; segmentIndex < this.railnetwork[sectionIndex].length; segmentIndex++) {
				
				var objRailSegment = new railSegment(this.railnetwork[sectionIndex][segmentIndex][0], this.railnetwork[sectionIndex][segmentIndex][1], this.railnetwork[sectionIndex][segmentIndex][2], this.railnetwork[sectionIndex][segmentIndex][3]);
				var result = this.getConnectors(railnetworkClone, sectionIndex, segmentIndex, objRailSegment);
				
				arrInput.push({
					rails: objRailSegment,
					
					// State the connecting sections (start: at 0th index, end: at last index)
					switch: {
						start: result[0], // Connections (indexes) when driving starts (Right side of 'railwayNetworkConfiguration')
						end: result[1], // Connections (indexes) when driving ends (Left side of 'railwayNetworkConfiguration')
						object: result[2] //Must be an object because it needs to be synchronised 
					}
				});
			}
			this.railnetwork[sectionIndex] = arrInput;
        }
		
		// Display whole railway network
		console.log(this.railnetwork);
	}
	
	// Retieve all connections for a given rail network segment
	getConnectors(network, section, segment, rails) {
		
		var start = [];
		var end = [];
		var railwaySwitch = null;
		
		// Get all connectors
		for (let sectionIndex = 0; sectionIndex < network.length; sectionIndex++) {
			for (let segmentIndex = 0; segmentIndex < network[sectionIndex].length; segmentIndex++) {
				
				var newAngle;
				
				// Forward to Backward (drive backwards)
				if (network[section][segment][0][0] == network[sectionIndex][segmentIndex][2][0] && network[section][segment][0][1] == network[sectionIndex][segmentIndex][2][1] && network[section][segment][0][2] == network[sectionIndex][segmentIndex][2][2] && !(segment == segmentIndex && section == sectionIndex) && network[section][segment][1] == network[sectionIndex][segmentIndex][3]) {
					start.push({
						section: sectionIndex,
						segment: segmentIndex,
						subsegment: null, // Stupid error with -1: In some rare cases the last index of the previous segment was equal to the 0th of the new one. 'intersection' would not work
						direction: false
					});
				}
				
				// Backward to Forward (change from driving backwards to driving forwards) (angle must be same + 180)
				newAngle = network[sectionIndex][segmentIndex][1];
				newAngle = newAngle + 180;
				if (newAngle >= 360) {newAngle -= 360}
				if (network[section][segment][0][0] == network[sectionIndex][segmentIndex][0][0] && network[section][segment][0][1] == network[sectionIndex][segmentIndex][0][1] && network[section][segment][0][2] == network[sectionIndex][segmentIndex][0][2] && !(segment == segmentIndex && section == sectionIndex) && network[section][segment][1] == newAngle) {
					start.push({
						section: sectionIndex,
						segment: segmentIndex,
						subsegment: 1, // Stupid error with -1: In some rare cases the last index of the previous segment was equal to the 0th of the new one. 'intersection' would not work
						direction: true
					});
				}
				
				// Backward to Forward (drive forwards)
				if (network[section][segment][2][0] == network[sectionIndex][segmentIndex][0][0] && network[section][segment][2][1] == network[sectionIndex][segmentIndex][0][1] && network[section][segment][2][2] == network[sectionIndex][segmentIndex][0][2] && !(segment == segmentIndex && section == sectionIndex) && network[section][segment][3] == network[sectionIndex][segmentIndex][1]) {
					end.push({
						section: sectionIndex,
						segment: segmentIndex,
						subsegment: 1, // I believe it gives error when last point of previous segement is the same as 0th index of current segment. So we target the first index instead.
						direction: true
					});
				}
				
				// Backward to Backward (change from driving forwards to driving backwards) (angle must be same + 180)
				newAngle = network[sectionIndex][segmentIndex][3];
				newAngle = newAngle + 180;
				if (newAngle >= 360) {newAngle -= 360}
				if (network[section][segment][2][0] == network[sectionIndex][segmentIndex][2][0] && network[section][segment][2][1] == network[sectionIndex][segmentIndex][2][1] && network[section][segment][2][2] == network[sectionIndex][segmentIndex][2][2] && !(segment == segmentIndex && section == sectionIndex) && network[section][segment][3] == newAngle) {
					end.push({
						section: sectionIndex,
						segment: segmentIndex,
						subsegment: null, // I believe it gives error when last point of previous segement is the same as 0th index of current segment. So we target the first index instead.
						direction: false
					});
				}
			}
		}
		
		// If there is more than one 'end' destination it means that this 'start' is the origin of a railway switch
		if (end.length >= 2) {
			railwaySwitch = new railswitch(start, end, network[section][segment][2], this.scene);
			switches.push(railwaySwitch);
		}
		
		// If there is more than one 'start' destination it means that this 'end' is the origin of a railway switch
		if (start.length >= 2) {
			railwaySwitch = new railswitch(end, start, network[section][segment][0], this.scene);
			switches.push(railwaySwitch);
		}
		
		return [start, end, railwaySwitch];
	}
}

class railSegment {
	constructor(ptStart, dirStart, ptEnd, dirEnd) {
        
        this.modifier = 1; // Adjust how wide the cureves will be
		
		// Mirror angle of end joint and adjust for 360°
        dirEnd = dirEnd + 180
        if (dirEnd >= 360) {dirEnd -= 360}
        
		// Start and end points of curve
		var posStart = new BABYLON.Vector3(ptStart[0], ptStart[1], ptStart[2]);
		var posEnd = new BABYLON.Vector3(ptEnd[0], ptEnd[1], ptEnd[2]);
		
		// Take curve length into consideration when deciding how wide the curve should be
		var segmentModifier = this.modifier * (BABYLON.Vector3.Distance(posStart, posEnd) / 2);
		
		// Curve control points (define how wide the curve is)
		var posControlStart = new BABYLON.Vector3(ptStart[0] + (angleTo2DVector(dirStart, 5)[0] * segmentModifier), 0, ptStart[2] + (angleTo2DVector(dirStart, 5)[1] * segmentModifier));
		var posControlEnd = new BABYLON.Vector3(ptEnd[0] + (angleTo2DVector(dirEnd, 5)[0] * segmentModifier), 0, ptEnd[2] + (angleTo2DVector(dirEnd, 5)[1] * segmentModifier));
		
		// Calculate how many points are needed (dependent on length)
        this.curvature = BABYLON.Curve3.CreateCubicBezier(posStart, posControlStart, posControlEnd, posEnd, 20);
		var numNodes = Math.round(this.curvature.length() * curveSmoothness );
		
		// Execute curve
		this.curvature = BABYLON.Curve3.CreateCubicBezier(posStart, posControlStart, posControlEnd, posEnd, numNodes);
		
		// Display tracks in 3D.
		BABYLON.Mesh.CreateLines("hermite", this.buildTrack(this.curvature.getPoints(), 1.435, true), scene);
		BABYLON.Mesh.CreateLines("hermite", this.buildTrack(this.curvature.getPoints(), 1.435, false), scene);
		
		// 3D Boxes to debug curve
		if (activeDebug == true) {
			this.Debug = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
			this.Debug.position = posControlStart;
			this.Debug.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
			this.Debug = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
			this.Debug.position = posControlEnd;
			this.Debug.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
			this.Debug = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
			this.Debug.position = posStart;
			this.Debug.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
			this.Debug = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
			this.Debug.position = posEnd;
			this.Debug.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
		}
	}
	
	// Return spline which is trackGauge apart from the main spline. Used to create the tracks
	buildTrack(original, trackGauge, reverse) {
		
		trackGauge = trackGauge / 19.65; // Don't know; checks out standard-gauge devided by 10 :D
		
		var path3d = new BABYLON.Path3D(original);
		var curve = path3d.getCurve();
		var map = path3d.getNormals();
		
		var rails = [];
		
		for(var p = 0; p < curve.length; p++) {
			
			if (reverse == true) {
				map[p] = map[p].multiply(new BABYLON.Vector3(trackGauge * -1, trackGauge * -1, trackGauge * -1));
			} else {
				map[p] = map[p].multiply(new BABYLON.Vector3(trackGauge, trackGauge, trackGauge));
			}
			
			// Show debug information
			if (activeDebug == true) { 
				var bi = BABYLON.Mesh.CreateLines('bi', [ curve[p], curve[p].add(map[p]) ], scene);
				bi.color = BABYLON.Color3.Green();
			}
			
			rails.push(curve[p].add(map[p]))
		}
		return rails;
	}
}