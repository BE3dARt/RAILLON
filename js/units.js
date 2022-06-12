var units = [

	// USA Diesel Locomotive
	{
		name: "Diesel_Locomotive_USA",
		type: "Diesel",
		mesh: "Locomotive_USA_Testbed",
		maxvelocity: 20,
		mass: 110,
		traction: 50,
	},
	
	// USA Wagon
	{
		name: "Flatcar_USA",
		type: "Flatcar",
		mesh: "",
		maxvelocity: 10,
		mass: 6,
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