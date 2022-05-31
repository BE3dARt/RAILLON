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

class track {
	constructor(layout) {
		this.layout = layout;
	}
}
