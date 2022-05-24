function radian (deg) {
	return deg * (Math.PI/180);
}

function degrees (rad) {
	return rad * (180/Math.PI);
}

function angleTo2DVector (angle, precision) {
	if (angle >= 0 && angle < 90) {
		return [Math.round(Math.sin(radian(90 - angle)) * Math.pow(10, precision)) / Math.pow(10, precision), Math.round(Math.cos(radian(90 - angle)) * Math.pow(10, precision)) / Math.pow(10, precision)]
	} else if ((angle >= 90 && angle < 180)) {
		return [Math.round(Math.sin(radian(angle - 90)) * Math.pow(10, precision) * -1) / Math.pow(10, precision), Math.round(Math.cos(radian(angle - 90)) * Math.pow(10, precision)) / Math.pow(10, precision)]
	} else if ((angle >= 180 && angle < 270)) {
		return [Math.round(Math.sin(radian(270 - angle)) * Math.pow(10, precision) * -1) / Math.pow(10, precision), Math.round(Math.cos(radian(270 - angle)) * Math.pow(10, precision) * -1) / Math.pow(10, precision)]
	} else {
		return [Math.round(Math.sin(radian(angle - 270)) * Math.pow(10, precision)) / Math.pow(10, precision), Math.round(Math.cos(radian(angle - 270)) * Math.pow(10, precision) * -1) / Math.pow(10, precision)]
	}
}

console.log(angleTo2DVector(260, 5))

class railSegmentJoint {
	constructor(x, y, direction) {
		this.x = x;
		this.y = y;
		this.dir = direction;
	}
}

class railSegment {
	constructor(start, end, scene) {
		this.start = start;
		this.end = end;
		this.Object = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
	}
	
	move() {
		this.Object.position.x += 1;
	}
}

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
	var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

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
	
	square = new railSegment(new railSegmentJoint(0, 0, 0), new railSegmentJoint(2, 2, 1));
	square.move();
	console.log(square.end.dir)

	// Code in this function will run ~60 times per second
	scene.registerBeforeRender(function () {
		// Check if box is moving right
		if (box.position.x < 2 && direction) {
			// Increment box position to the right
			box.position.x += 0.00;
		}
		else {
			// Swap directions to move left
			direction = false;
		}

		// Check if box is moving left
		if (box.position.x > -2 && !direction) {
			// Decrement box position to the left
			box.position.x -= 0.00;
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