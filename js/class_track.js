class railswitch {
	constructor() {
		
		// Start Node
		this.start = {
			position: null,
			index: null,
		};
		
		// End Node 
		this.end = [{position: null, index: null}, {position: null, index: null}];
	}
}

class track {
	constructor(name) {
        
        // Build railway network
        var railnetworkIndex = railwayNetworkNameToIndex(name);
        this.network = railnetwork[railnetworkIndex];
        for (let sectionIndex = 0; sectionIndex < this.network.rails.length; sectionIndex++) {
            for (let segmentIndex = 0; segmentIndex < this.network.rails[sectionIndex].length; segmentIndex++) {
                this.network.rails[sectionIndex][segmentIndex] = new railSegment(this.network.rails[sectionIndex][segmentIndex][0], this.network.rails[sectionIndex][segmentIndex][1], this.network.rails[sectionIndex][segmentIndex][2], this.network.rails[sectionIndex][segmentIndex][3]);
            }
        }
	}
	
	// Initialize and create switches dependent on the provided layout
	createSwitch() {
		
	}
}

class railSegment {
	constructor(ptStart, dirStart, ptEnd, dirEnd) {
        
        this.modifier = 1; // Adjust how wide the cureves will be
		this.switch = null;
		
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