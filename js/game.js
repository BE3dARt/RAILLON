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
	var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, new BABYLON.Vector3(0, 4, -5), scene);
	
	//Camera properties
	camera.allowUpsideDown = false;
	camera.inertia = 0.3;
	camera.setTarget(BABYLON.Vector3.Zero());
	camera.attachControl(canvas, true);

	// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
	var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 4, -1), scene);

	// Default intensity is 1. Let's dim the light a small amount
	light.intensity = 1;
	
	gauge = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
	gauge.scaling = new BABYLON.Vector3(0.1435, 0.1435, 0.1435);
	
	// Materials
    var mat1 = new BABYLON.StandardMaterial('mat1', scene);
    mat1.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.3);
	
	//Ground
	map = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
	map.scaling = new BABYLON.Vector3(20, 0.1, 10);
	map.position = new BABYLON.Vector3(0, -0.08, 0);
	map.material = mat1;
	
	//Display axis
	const axes = new BABYLON.AxesViewer(scene, 1)
	
	layout1Segments  = [
		new railSegment([-7.5, 0, -4.5], 180, [-9, 0, -3], 90),
		new railSegment([-9, 0, -3], 90, [-9, 0, -1], 90),
		new railSegment([-9, 0, -1], 90, [-7.5, 0, 0.5], 0),
		new railSegment([-7.5, 0, 0.5], 0, [-5, 0, 1], 45),
		new railSegment([-5, 0, 1], 45, [-3, 0, 3], 45),
		new railSegment([-3, 0, 3], 45, [0, 0, 4.5], 0),
		new railSegment([0, 0, 4.5], 0, [7, 0, 4.5], 0),
		new railSegment([7, 0, 4.5], 0, [8.5, 0, 3], 270),
		new railSegment([8.5, 0, 3], 270, [8.5, 0, 1], 270),
		new railSegment([8.5, 0, 1], 270, [7, 0, -0.5], 180),
		new railSegment([7, 0, -0.5], 180, [5, 0, -0.5], 180),
		new railSegment([5, 0, -0.5], 180, [1, 0, 1.5], 180),
		new railSegment([1, 0, 1.5], 180, [-1, 0, 1.5], 180),
		new railSegment([-1, 0, 1.5], 180, [-3, 0, 0.5], 225),
		new railSegment([-3, 0, 0.5], 225, [-4, 0, -0.5], 225),
		new railSegment([-4, 0, -0.5], 225, [-5, 0, -2.5], 270),
		new railSegment([-5, 0, -2.5], 270, [-3.5, 0, -4], 0),
		new railSegment([-3.5, 0, -4], 0, [1, 0, -4], 0),
		new railSegment([1, 0, -4], 0, [2.5, 0, -2.5], 90),
		new railSegment([2.5, 0, -2.5], 90, [4, 0, -1], 0),
		new railSegment([4, 0, -1], 0, [7, 0, -1], 0),
		new railSegment([7, 0, -1], 0, [8.5, 0, -2.5], 270),
		new railSegment([8.5, 0, -2.5], 270, [7, 0, -4.5], 180),
		new railSegment([7, 0, -4.5], 180, [-7.5, 0, -4.5], 180),
	];

	layout1 = new track(layout1Segments);	
	
	myloco = new locomotive([["Test", 0], ["Test", 0.5], ["Test", 1]], 0.02, [layout1, 0, 2], true);
	
	//BABYLON.SceneLoader.Append("https://raw.githubusercontent.com/BE3dARt/RAILBLAZER/main/assets/obj/", "EMD_SD60_TestExport.obj", scene, function (scene) {});
	
	BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/BE3dARt/RAILBLAZER/main/assets/obj/", "EMD_SD60_TestExport.obj", scene);
	
	// Code in this function will run ~60 times per second
	scene.registerBeforeRender(function () {
		
		myloco.move()
		
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