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
					switch: result[2],
					connector: {
						toPrevious: result[0], // Points to indexes of previous segment (next segment when driving backwards)
						toNext: result[1], // Points to indexes of next segment (previous segment when driving backwards)
					},
				});
				
				// A very, very unsatisfying solution to the switch position problem
				if (arrInput[arrInput.length - 1].switch != null) {
					
					// Placeholder to shorten code
					var switchOrigin = arrInput[arrInput.length - 1].switch.origin;
					
					var ptOrigin;
					var ptDirOrigin;
					
					// Subsegment has not yet been set: We couldn't figure out the segment length because the curvature has not yet been calculated
					if (switchOrigin.subsegment == null) {
						
						// Because it was null, set origin's subsegment
						switchOrigin.subsegment = objRailSegment.curvature.getPoints().length - 1;
						
						ptOrigin = objRailSegment.curvature.getPoints()[switchOrigin.subsegment];
						ptDirOrigin = objRailSegment.curvature.getPoints()[switchOrigin.subsegment - 1];
						
						arrInput[arrInput.length - 1].switch.animation.orientation = true;
						
						
					} else {
						
						ptOrigin = objRailSegment.curvature.getPoints()[0];
						ptDirOrigin = objRailSegment.curvature.getPoints()[1];
						
						arrInput[arrInput.length - 1].switch.animation.orientation = false;
					}
					
					// Angle between the two points
					var angle = BABYLON.Angle.BetweenTwoPoints(new BABYLON.Vector2(ptDirOrigin.x, ptDirOrigin.z), new BABYLON.Vector2(ptOrigin.x, ptOrigin.z));
					
					// Form direction vector from 'ptDirOrigin' to 'ptOrigin' because we went 1 subsegment back before.
					var dirVec = new BABYLON.Vector3(ptOrigin.x - ptDirOrigin.x, ptOrigin.y - ptDirOrigin.y, ptOrigin.z - ptDirOrigin.z);
					var coefficient = 0.5 / (Math.sqrt(Math.pow(dirVec.x, 2) + Math.pow(dirVec.y, 2) + Math.pow(dirVec.z, 2)));
					var dirVecUnit = new BABYLON.Vector3(dirVec.x * coefficient, dirVec.y * coefficient, dirVec.z * coefficient);
					
					// Rotate direction vector
					var result = new BABYLON.Vector2(1, 1);
					var vecBase = new BABYLON.Vector2(dirVecUnit.x, dirVecUnit.z);
					vecBase.rotateToRef(Math.PI/2, result);
					
					// Form coordinates of resulting point
					var ptRes = new BABYLON.Vector3(ptOrigin.x + result.x, 0, ptOrigin.z + result.y); // With offset
					// var ptRes = ptOrigin;  // Without offset
					
					// Set coordinates
					arrInput[arrInput.length - 1].switch.interactiveZone.position = ptRes;
					arrInput[arrInput.length - 1].switch.mesh.posInit = ptRes;
					
					// Set rotation
					arrInput[arrInput.length - 1].switch.mesh.rotInit = angle.radians();
				}
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