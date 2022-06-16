// Do NOT change these global variables
var compositions = []; // Will hold all train compositions
var switches = []; // Holds all switches (Only defined here in order to find out which one has been clicked so it can be changed.)
var blurTime = 0;
var blurTimeElapsed = 0;
var renderStatus = true;
var previousFrameTime = 15;

// Event Handler when window gets focus back
window.addEventListener("focus", function(event) { 
	blurTimeElapsed = Date.now() - blurTime;
	
	// Debug information
	if (activeDebug == true) {
		console.log("Elapsed Time since last focus: " + blurTimeElapsed); 
		console.log("Render Time: " + engine.getDeltaTime())
	}
	
	// Let compositions move again
	for (let i = 0; i < compositions.length; i++) {
		compositions[i].movement.status.current = compositions[i].movement.status.previous;
	}
	
	// Resume Rendering
	renderStatus == true;
	
}, false);

// Event Handler when window looses focus
window.addEventListener("blur", function(event) { 
	blurTime = Date.now();
	
	// Stop compositions from moving
	for (let i = 0; i < compositions.length; i++) {
		compositions[i].movement.status.previous = compositions[i].movement.status.current;
		compositions[i].movement.status.current = 0;
	}
	
	// Stop Rendering
	renderStatus == false;
	
}, false);

var canvas = document.getElementById("renderCanvas");
var startRenderLoop = function (engine, canvas) {
	engine.runRenderLoop(function () {
		if (sceneToRender && sceneToRender.activeCamera) {
			if (renderStatus == true) {
				sceneToRender.render();
			}
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
	var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, new BABYLON.Vector3(0, 15, -5), scene);
	
	//Use the right hand system because Cinema 4D apparently can't flip x axis for .glb exports.
	scene.useRightHandedSystem = true;
	
	//Camera properties
	camera.allowUpsideDown = false;
	camera.inertia = 0.3;
	camera.setTarget(BABYLON.Vector3.Zero());
	camera.attachControl(canvas, true);

	// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
	var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 4, -1), scene);

	// Default intensity is 1. Let's dim the light a small amount
	light.intensity = 1;
	
	// Materials
    var mat1 = new BABYLON.StandardMaterial('mat1', scene);
    mat1.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.3);
	
	// Display Ground
	map = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
	map.scaling = new BABYLON.Vector3(22, 0.1, 12);
	map.position = new BABYLON.Vector3(0, -0.08, 0);
	map.material = mat1;
	
	// Display axis
	if (activeDebug == true) {
		const axes = new BABYLON.AxesViewer(scene, 1);
	}
	
	// Initialzise FPS display
	let divFps = document.getElementById("fps");
	
    // Define new map
	layout1 = new Map("Default", scene);
	
	// Create new train (Current bugs: Subsegement = 0 (both))
	compositions.push(new train([
		["Diesel_Locomotive_USA", true], 
		["Diesel_Locomotive_USA", false], 
		["Container_Europe", true], 
		["Container_Europe", true], 
		["Container_Europe", true], 
		["Container_Europe", true], 
		["Container_Europe", true], 
		["Container_Europe", true], 
		["Container_Europe", true], 
		["Container_Europe", true], 
		["Container_Europe", true], 
		["Container_Europe", true], 
		["Container_Europe", true]
	], layout1, 0, 2, 10, true, scene));

	// Event on mesh-click
    scene.onPointerPick = function (evt, pickResult) {

		// Restrict trigger to left mouse button
		if (evt.button == 0) {
			if (pickResult.hit) {
				
				// Rolling Stock Units
				var index = idToIndex(compositions, pickResult.pickedMesh.uniqueId);
				if (index != null) {
					
					// Make train decelerate with a left-click
					if (compositions[index[0]].movement.status.current == 3) {
						compositions[index[0]].movement.status.current = 2;
					} else if (compositions[index[0]].movement.status.current == 2 || compositions[index[0]].movement.status.current == 0) {
						compositions[index[0]].movement.status.current = 3;
					}
					
					// console.log(compositions[index[0]].composition[index[1]]) // Return definition of before clicked rolling stock unit
					return;
				}
				
				// Railway Switches
				index = switchMeshToIndex(pickResult.pickedMesh.uniqueId)
				if (index != null) {
					switches[index].direction = !switches[index].direction;
					switches[index].animationRun()
					return;
				}
			}
		}
    };
	
	// Code in this function will run ~60 times per second
	scene.registerBeforeRender(function () {
		
		// Update train composition
		for (let i = 0; i < compositions.length; i++) {
			compositions[i].update()
		}
		// Display FPS
		divFps.innerHTML = engine.getFps().toFixed() + " fps";
		
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