class train {
	
	// compositionInitial: [["Name", heading]]
	constructor(compositionInitial, map, section, segment, subsegment, direction, scene) {
		
		// The folowing variables are only used for initialisation and are deleted afterwards
		this.compositionInitial = compositionInitial;
		this.map = map;
        this.section = section;
		this.segment = segment;
		this.subsegment = subsegment;
		this.rollingStock3DModels = [];
		this.rollingStock3DModelsInitializedCounter = 0;
		
		// The following variables are important even after initialisation
		this.initialized = false;
		this.composition = [];
		
		// Every significant variable for the train's MOVEMENT
		this.movement = {
			velocity: null, // Calculate with 'unit.js'
			direction: direction,
			status: { // 0: stop, 1: drive, 2: decelerate, 3: accelerate
				current: 3,
				previous: 0,
			}			
		};
		
		this.configuration = {
			maxvelocity: 0,
			power: 0,
			mass: 0,
			efficiency: 0,
			tractiveEffort: 0,
			acceleration: 0,
			deceleration: 0
		}
        
		// Check if provided segment exists
		if (this.segment < 0) {
			this.segment = 0;
		} else if (segment >= this.map.railnetwork[this.section].length) {
			this.segment = this.map.railnetwork[this.section].length - 1;
		}
        
		// Check if provided subsegment exists
		if (this.subsegment < 0) {
			this.subsegment = 0;
		} else if (this.subsegment >= this.map.railnetwork[this.section][this.segment].rails.curvature.getPoints().length) {
			this.subsegment = this.map.railnetwork[this.section][this.segment].rails.curvature.getPoints().length - 1;
		}
		
		// Load all 3D models first
		for (let i = 0; i < this.compositionInitial.length; i++) {
			
			// Translate provided rolling stock unit name into the corresponding mesh name
			var meshName = units[unitNameToIndex(this.compositionInitial[i][0])].mesh
			
			// Asynchronous asset loading function
			const resultPromise = BABYLON.SceneLoader.ImportMeshAsync("", "https://raw.githubusercontent.com/BE3dARt/RAILBLAZER/main/assets/glb/", meshName + ".glb", scene);
			
			// Promise of the asset loading function (PROBLEM: When loading from server, order is all over the place!)
			resultPromise.then((load3D) => {
				
				// Declare 3D-objects
				var hull_3D = [];
				var bogies_3D = [];
				var couplers_3D = [];
				
				// Assign 3D-objects to correct group (Forward-Heading)
				if (this.compositionInitial[i][1] == true) {
					for (let i = 0; i < load3D.meshes.length; i++) {
						
						/*
						// Make invisible until placed later
						load3D.meshes[i].visibility = 0;
						*/
                    
						//Formalities
						load3D.meshes[i].rotationQuaternion = null;
						load3D.meshes[i].rotation = BABYLON.Vector3.Zero();
						
						// Retrieve mesh for train hull
						if (load3D.meshes[i].name.includes("Hull")) {
							hull_3D.push(load3D.meshes[i]);
						}
						
						// Retrieve mesh for bogies
						if (load3D.meshes[i].name.includes("Bogie")) {
							bogies_3D.push(load3D.meshes[i]);
						}
						
						// Retrieve mesh for coupler
						if (load3D.meshes[i].name.includes("Coupler")) {
							couplers_3D.push(load3D.meshes[i]);
						}
					}
				}
				
				// Assign 3D-objects to correct group (Backward-Heading)
				if (this.compositionInitial[i][1] == false) {
					for (let i = load3D.meshes.length-1; i >= 0; i--) {
						
						/*
						// Make invisible until placed later
						load3D.meshes[i].visibility = 0;
						*/
                    
						//Formalities
						load3D.meshes[i].rotationQuaternion = null;
						load3D.meshes[i].rotation = BABYLON.Vector3.Zero();
						
						// Retrieve mesh for train hull
						if (load3D.meshes[i].name.includes("Hull")) {
							hull_3D.push(load3D.meshes[i]);
						}
						
						// Retrieve mesh for bogies
						if (load3D.meshes[i].name.includes("Bogie")) {
							bogies_3D.push(load3D.meshes[i]);
						}
						
						// Retrieve mesh for coupler
						if (load3D.meshes[i].name.includes("Coupler")) {
							couplers_3D.push(load3D.meshes[i]);
						}
					}
					
					var posTemporary;
					
					// Adjust bogie position when facing backwards (two bogies)
					if (bogies_3D.length == 2) {
						posTemporary = bogies_3D[0].position;
						bogies_3D[0].position = bogies_3D[1].position;
						bogies_3D[1].position = posTemporary;
					}
					
					// Adjust coupler position when facing backwards
					posTemporary = couplers_3D[0].position;
					couplers_3D[0].position = couplers_3D[1].position;
					couplers_3D[1].position = posTemporary;
				}

				this.rollingStock3DModels[i] = [hull_3D, bogies_3D, couplers_3D]; // Don't push, set it to specific index!
				this.rollingStock3DModelsInitializedCounter += 1;
			})
		}
	}
	
	update() {
		
		// Initialized all units
		if (this.initialized == false) {
			
			// Continue with script only if all 3d models have been loaded
			if (this.compositionInitial.length != this.rollingStock3DModelsInitializedCounter) {
				return;
			}
			
			for (let i = 0; i < this.compositionInitial.length; i++) {
				
				// First model is special because here the position is provided by the user
				if (i == 0) {
					
					// Convert the first railway-railnetwork-index-position to coordinates
					var coordinates = this.map.railnetwork[this.section][this.segment].rails.curvature.getPoints()[this.subsegment];
					this.composition.push(new rollingStock(coordinates, this.map, this.section, this.segment, this.subsegment, this.movement.direction, this.compositionInitial[0][1], this.rollingStock3DModels[i], this.compositionInitial[i][0], this.scene));
					
				} else {
					
					// Back Bogie of previous unit
					var coordinatesReferenceBogie_previous = this.composition[this.composition.length-1].bogies.back.mesh.position;
					var layout_previous = this.composition[this.composition.length-1].bogies.back.map;
                    var section_previous = this.composition[this.composition.length-1].bogies.back.section;
					var segment_previous = this.composition[this.composition.length-1].bogies.back.segment;
					var subsegment_previous = this.composition[this.composition.length-1].bogies.back.subsegment;
	
					// Furthest point away of center first locomotive
					var first_coupler = new BABYLON.Vector3((this.rollingStock3DModels[i-1][2][1].position.x - this.rollingStock3DModels[i-1][2][1].getBoundingInfo().boundingBox.maximum.x) + couplerLockDistance, 0, 0);

					// Position back bogie of first locomotive
					var first_bogie = this.composition[i-1].bogies.back.posInitial;
					
					// Furthest point away of center second locomotive (Maximum because mirrored)
					var second_coupler = new BABYLON.Vector3((this.rollingStock3DModels[i][2][0].position.x + this.rollingStock3DModels[i][2][0].getBoundingInfo().boundingBox.maximum.x) - couplerLockDistance, 0, 0);
					
					// Position front bogie of second locomotive
					var second_bogie = this.rollingStock3DModels[i][1][0].position;
					
					// Distance to the first bogie of the next locomotive
					var distanceToNext = BABYLON.Vector3.Distance(first_coupler, first_bogie) + BABYLON.Vector3.Distance(second_coupler, second_bogie);
					
					// Debug distance between back bogie of first rolling stock unit and front bogie of second rolling stock unit.
					if (activeDebug == true) {
						console.log(distanceToNext);
					}
					
					// Calculate position of next bogie
					var result = getPosNextBogie(coordinatesReferenceBogie_previous, layout_previous, section_previous, segment_previous, subsegment_previous, this.movement.direction, distanceToNext, scene);
					
					// Add rolling stock unit to consist
					this.composition.push(new rollingStock(result[0], this.map, result[1], result[2], result[3], this.movement.direction, this.compositionInitial[this.composition.length][1], this.rollingStock3DModels[i], this.compositionInitial[i][0], scene))
					
				}
				
				/*
				// Make meshes visible again
				for (let meshType = 0; meshType < this.rollingStock3DModels[i].length; meshType++) {
					for (let meshNumer = 0; meshNumer < this.rollingStock3DModels[i][meshType].length; meshNumer++) {
						this.rollingStock3DModels[i][meshType][meshNumer].visibility = 1;
					}
				}
				*/
			}
			
			// delete unused variables
			delete this.segment;
			delete this.compositionInitial;
			delete this.map;
			delete this.segment;
			delete this.subsegment;
			delete this.rollingStock3DModels;
			delete this.rollingStock3DModelsInitializedCounter;
			
			// Variables to capture data of rolling stock units
			var arrMaxVelocity = [];
			var arrEfficiency = [];
			var arrMass = 0;
			var arrPower = 0;
			
			// Loop again over ever rolling stock unit in the current consist to grab important data 
			for (let i = 0; i < this.composition.length; i++) {
				
				// Add max velocity
				arrMaxVelocity.push(this.composition[i].configuration.maxvelocity);
				
				// Add Efficiency
				if (this.composition[i].configuration.efficiency !== undefined) {
					arrEfficiency.push(this.composition[i].configuration.efficiency);
				}

				// Add mass
				this.configuration.mass += this.composition[i].configuration.mass;
				
				// Add power
				if (this.composition[i].configuration.power !== undefined) {
					this.configuration.power += this.composition[i].configuration.power;
				}
			}
			
			// Calculate max velocity for whole train based on max velocity of each rolling stock
			this.configuration.maxvelocity = Math.min.apply(null, arrMaxVelocity);
			
			// Calulcate Efficiency
			this.configuration.efficiency = arrEfficiency.reduce((a, b) => a + b, 0) / arrEfficiency.length;
			
			// Calculate friction force (F = u * m * g)
			var frictionForce = frictionCoefficient * (this.configuration.mass * 1000) * 9.80665;
			
			// Calculate tractive force (F = power / speed) (http://evilgeniustech.com/idiotsGuideToRailroadPhysics/HorsepowerAndTractiveEffort/)
			this.configuration.tractiveEffort = ((this.configuration.efficiency * this.configuration.power * 1000) / this.configuration.maxvelocity);
			
			// Calculate train's acceleration (a = F / m)
			this.configuration.acceleration = ((this.configuration.tractiveEffort - frictionForce) / (this.configuration.mass * 1000)) * accelerationMultiplier;
			
			// Calculate train's Deceleration
			this.configuration.deceleration = this.configuration.acceleration * -1;
			
			// Show data if debug is active
			if (activeDebug == true) {
				console.log("Friction: " + frictionForce)
				console.log("Tractive Effort: " + this.configuration.tractiveEffort)
				console.log("Acceleration: " + this.configuration.acceleration)
			}
			
			// Initialisation of all units successfully finished
			this.initialized = true;
		} else {
			this.move();
		}
	}
	
	// Move train as a whole
	move() {
		
		// Return if locomotive should not be moved at any circumstances
		if (this.movement.status.current == 0) {
			return
		}
		
		// Debug distance between back bogie of first rolling stock unit and front bogie of second rolling stock unit.
		if (activeDebug == true) {
			console.log(BABYLON.Vector3.Distance(this.composition[0].bogies_3D[1].position, this.composition[1].bogies_3D[0].position));
		}
		
		var frametime; // Render time passed to speed function in ms
		
		// Decided between 3 cases
		if (engine.getDeltaTime() - blurTimeElapsed < 0) {
			
			// Case 1: engine.getDeltaTime() is 'normal', we don't need to adjust it
			blurTimeElapsed = 0;
			frametime = engine.getDeltaTime();
			if (engine.getDeltaTime() > (1000 / engine.getFps()) + 50) {
				
				// Case 2: engine.getDeltaTime() is absurdly high but we can't control it using 'blurTimeElapsed'. Happens when browser gets focus without actively chosing so: E.g. closing another programm and browser window is next in queue.
				frametime = previousFrameTime;
			}
		} else {
			
			// Case 3: Default case where engine.getDeltaTime() is being adjusted by 'blurTimeElapsed', which is the time this window spent without focus.
			frametime = engine.getDeltaTime() - blurTimeElapsed;
		}
		
		// Decelerate train (dv = a * dt)
		if (this.movement.status.current == 2) {
			this.movement.velocity += this.configuration.deceleration * (frametime / 1000);
		}
		
		// Accelerate train (dv = (a *-1) * dt)
		if (this.movement.status.current == 3) {
			this.movement.velocity += this.configuration.acceleration * (frametime / 1000);
		}
		
		// Before moving on, check whether the train would go over its max velocity
		if (this.movement.velocity > this.configuration.maxvelocity) {
			this.movement.velocity = this.configuration.maxvelocity;
		}
		
		// Before moving on, check whether the train has already stopped
		if (this.movement.velocity < 0) {
			this.movement.velocity = 0;
			this.movement.status.current = 0;
			return;
		}
		
		// Set displacement in relation to speed and render time so that speed is always the same no matter the fps.
		var deltaDisplacement = speedToDistance(this.movement.velocity, frametime); 
		
		previousFrameTime = frametime; // Set previous frame in cases the current one can't be used
		
		// Loop over every locomotive and wagon and update their position
		for (let i = 0; i < this.composition.length; i++) {
			
			// Before calling move() update the coupler positions of the previous and next unit			
			if (i == 0 && i == this.composition.length - 1) {
				this.composition[i].coupler.front.posNextUnit = null;
				this.composition[i].coupler.back.posNextUnit = null;
			} else if (i == 0) {
				this.composition[i].coupler.front.posNextUnit = null;
				this.composition[i].coupler.back.posNextUnit = this.composition[i+1].coupler.front.mesh.position;
			}else if (i == this.composition.length -1) {
				this.composition[i].coupler.front.posNextUnit = this.composition[i-1].coupler.back.mesh.position;
				this.composition[i].coupler.back.posNextUnit = null;
			} else {
				this.composition[i].coupler.front.posNextUnit = this.composition[i-1].coupler.back.mesh.position;
				this.composition[i].coupler.back.posNextUnit = this.composition[i+1].coupler.front.mesh.position;
			}
			
			// Move train composition
			this.composition[i].move(deltaDisplacement);
		}
	}
}