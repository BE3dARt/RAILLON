var units = [

	// USA Diesel Locomotive
	{
		name: "Diesel_Locomotive_USA",
		type: "Diesel",
		mesh: "Locomotive_USA_Testbed",
		power: 3500, // in kW
		efficiency: 0.90, // Power Transfer Efficiency
		maxvelocity: 20, // in m/s
		mass: 212, //in t
	},
	
	// USA Wagon
	{
		name: "Flatcar_USA",
		type: "Flatcar",
		mesh: "Locomotive_USA_Testbed",
		load: 0, // in t
		maxvelocity: 20, // in m/s
		mass: 200, //in t
	},
];

// GUIDE
//
// *Wagon types*
// Flatcar: 	Rigid loads (Load visible)
// Covered: 	Rigid loads (Load not visible)
// Container:	Fits one container, rigid or fluid (Load visible)
// Hopper: 		Bulk loads (Load visible)
// Tank: 		Fluid loads (Load not visible)
// Schnabel: 	Special heavy loads (Load visible)
// Passenger: 	Passengers (Load not visible)
//
// *Locomotive types*
// Diesel, Electric, Multiple_Unit, Steam