function radian (deg) {
	return deg * (Math.PI/180);
}

function degrees (rad) {
	return rad * (180/Math.PI);
}

function angleTo2DVector (angle, precision) {
	if (angle >= 0 && angle < 90) {
		return [Math.round(Math.cos(radian(90 - angle)) * Math.pow(10, precision)) / Math.pow(10, precision), Math.round(Math.sin(radian(90 - angle)) * Math.pow(10, precision)) / Math.pow(10, precision)]
	} else if ((angle >= 90 && angle < 180)) {
		return [Math.round(Math.cos(radian(angle - 90)) * Math.pow(10, precision)) / Math.pow(10, precision), Math.round(Math.sin(radian(angle - 90)) * Math.pow(10, precision) * -1) / Math.pow(10, precision)]
	} else if ((angle >= 180 && angle < 270)) {
		return [Math.round(Math.cos(radian(270 - angle)) * Math.pow(10, precision) * -1) / Math.pow(10, precision), Math.round(Math.sin(radian(270 - angle)) * Math.pow(10, precision) * -1) / Math.pow(10, precision)]
	} else {
		return [Math.round(Math.cos(radian(angle - 270)) * Math.pow(10, precision) * -1) / Math.pow(10, precision), Math.round(Math.sin(radian(angle - 270)) * Math.pow(10, precision)) / Math.pow(10, precision)]
	}
}

class railSegment {
	constructor(startJoint, endJoint) {
        
		//Adjust how wide the cureves will be
        this.curveModifier = 1;
		
		//Mirror end angle of end joint and adjust for 360°
        endJoint[2] = endJoint[2] + 180
        if (endJoint[2] >= 360) {endJoint[2] -= 360}
        
		//Build curve
        this.curveStart = new BABYLON.Vector3(startJoint[0], startJoint[1], 0);
        this.curveStartControl = new BABYLON.Vector3(startJoint[0] + (angleTo2DVector(startJoint[2], 5)[0] * this.curveModifier), startJoint[1] + (angleTo2DVector(startJoint[2], 5)[1] * this.curveModifier), 0);
        this.curveEnd = new BABYLON.Vector3(endJoint[0], endJoint[1], 0);
        this.curveEndControl = new BABYLON.Vector3(endJoint[0] + (angleTo2DVector(endJoint[2], 5)[0] * this.curveModifier),endJoint[1] + (angleTo2DVector(endJoint[2], 5)[1] * this.curveModifier), 0);
		
		//Calculate how many points are needed (Dependent on length)
		this.curvePointTestNumber = 20;
        this.curvature = BABYLON.Curve3.CreateCubicBezier(this.curveStart, this.curveStartControl, this.curveEndControl, this.curveEnd, this.curvePointTestNumber);
		this.curvePointNumber = Math.round(this.curvature.length() * 10);
		
		//Execute curve
		this.curvature = BABYLON.Curve3.CreateCubicBezier(this.curveStart, this.curveStartControl, this.curveEndControl, this.curveEnd, this.curvePointNumber);
		
		//Display curve in 3D
        BABYLON.Mesh.CreateLines("hermite", this.curvature.getPoints(), scene);
        
		//3D Boxes to debug curve
		this.activeDebug = false;
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
	
	move() {
		this.Object.position.x += 1;
	}
}

new 

class wagon {
	
}

// A train consists of a couple of wagons
class train {
	
}

var canvas = document.getElementById("renderCanvas");

var startRenderLoop = function (engine, canvas) {
	engine.runRenderLoop(function () {
		if (sceneToRender && sceneToRender.activeCamera) {
			sceneToRender.render();
		}
	});
}

var engine = null;
var scene = null;
var sceneToRender = null;
var createDefaultEngine = function() { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false}); };
var createScene = function () {

	// This creates a basic Babylon Scene object (non-mesh)
	var scene = new BABYLON.Scene(engine);

	// This creates and positions a free camera (non-mesh)
	var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 1, -10), scene);

	// This targets the camera to scene origin
	camera.setTarget(BABYLON.Vector3.Zero());

	// This attaches the camera to the canvas
	camera.attachControl(canvas, true);

	// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
	var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

	// Default intensity is 1. Let's dim the light a small amount
	light.intensity = 0.7;

	// Our built-in 'sphere' shape.
	var box = BABYLON.MeshBuilder.CreateBox("box", {}, scene);

	// Set a direction flag for the animation
	var direction = true;
	
    square = new railSegment([0, 0, 0], [2, 1, 45]);
	square2 = new railSegment([2, 1, 45], [3, 0, 180]);
	square3 = new railSegment([3, 0, 180], [2, -1, 270]);
	square4 = new railSegment([2, -1, 270], [0, 0, 0]);
	
	//square.move();
	//console.log(square.end.dir)

	// Code in this function will run ~60 times per second
	scene.registerBeforeRender(function () {
		// Check if box is moving right
		if (box.position.x < 2 && direction) {
			// Increment box position to the right
			box.position.x += 0.01;
		}
		else {
			// Swap directions to move left
			direction = false;
		}

		// Check if box is moving left
		if (box.position.x > -2 && !direction) {
			// Decrement box position to the left
			box.position.x -= 0.01;
		}
		else {
			// Swap directions to move right
			direction = true;
		}
	});

	return scene;

};

window.initFunction = async function() {
	var asyncEngineCreation = async function() {
		try {
		return createDefaultEngine();
		} catch(e) {
		console.log("the available createEngine function failed. Creating the default engine instead");
		return createDefaultEngine();
		}
	}
	window.engine = await asyncEngineCreation();
	if (!engine) throw 'engine should not be null.';
	startRenderLoop(engine, canvas);
	window.scene = createScene();
};

initFunction().then(() => {sceneToRender = scene                    
});

window.addEventListener("resize", function () {
	engine.resize();
});