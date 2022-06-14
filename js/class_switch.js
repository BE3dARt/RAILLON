class railswitch {
	constructor(origin, destination, coordinates, scene) {
		
		// Direction (false: from origin to direction1, true: from origin to direction2)
		this.direction = false;
		
		// Because we can't pick bounding boxes we will just fake it with visibility
		this.interactiveZone = new BABYLON.MeshBuilder.CreateBox("box", {}, scene);
		this.interactiveZone.scaling = new BABYLON.Vector3(1.5, 0.1, 1.5);
		this.interactiveZone.position = new BABYLON.Vector3(coordinates[0], coordinates[1], coordinates[2]);
		this.interactiveZone.visibility = 0;

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
		
		// Holds the switch's mesh
		this.mesh = {
			model: null,
			posInit: new BABYLON.Vector3(coordinates[0], coordinates[1], coordinates[2]),
			rotInit: null,
		}
		
		// Holds animation settings of this railway switch
		this.animation = {
			namespace: null,
			orientation: false, // We need to mirror animation if switch has opposite orientation
			keyFrames: {
				full: null,
				zero: null
			}
		}
		
		// Asynchronous asset loading function
		const resultPromise = BABYLON.SceneLoader.ImportMeshAsync("", "https://raw.githubusercontent.com/BE3dARt/RAILBLAZER/main/assets/glb/", "animated_arrow.glb", scene);
			
		// Promise of the asset loading function
		resultPromise.then((switch3D) => {
			
			// Define mesh
			this.mesh.model = switch3D.meshes[0]
			
			// Set position of mesh to provided coordinates
			this.mesh.model.position = this.mesh.posInit;
			this.mesh.model.rotation.y = this.mesh.rotInit;
			this.mesh.model.scaling = new BABYLON.Vector3(1.8, 1.8, 1.8);;
			
			// Add keyframes because I can't export multiple animation takes from Cinema 4D. Therefore I added pose morphs but need to change its values now.
			this.animation.keyFrames.full = [];
			this.animation.keyFrames.full.push({frame: 0, value: 0});
			this.animation.keyFrames.full.push({frame: 60, value: 1});
			
			this.animation.keyFrames.zero = [];
			this.animation.keyFrames.zero.push({frame: 0, value: 1});
			this.animation.keyFrames.zero.push({frame: 60, value: 0});
			
			// Write to object variable
			this.animation.namespace = switch3D.animationGroups[0];
			
			// Store before generated key frames
			this.animation.namespace.targetedAnimations[0].animation.setKeys(this.animation.keyFrames.full); // Left
			this.animation.namespace.targetedAnimations[1].animation.setKeys(this.animation.keyFrames.zero); // Right
			
			// Don't loop animation
			this.animation.namespace.animatables[0].loopAnimation = false;
			this.animation.namespace.animatables[1].loopAnimation = false;
			
			// Initial animation
			this.animationRun();
			
		})
	}
	
	// Run the animation
	animationRun() {
		
		// Decide whether to turn left or right
		if (this.direction == this.animation.orientation) {
			this.animation.namespace.targetedAnimations[0].animation.setKeys(this.animation.keyFrames.full); // Left
			this.animation.namespace.targetedAnimations[1].animation.setKeys(this.animation.keyFrames.zero); // Right
		} else {
			this.animation.namespace.targetedAnimations[0].animation.setKeys(this.animation.keyFrames.zero); // Left
			this.animation.namespace.targetedAnimations[1].animation.setKeys(this.animation.keyFrames.full); // Right
		}
		
		this.animation.namespace.start(); // Start animation
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