var units = [

	// USA Diesel Locomotive
	{
		name: "Diesel_Locomotive_USA",
		type: "Diesel",
		mesh: "Locomotive_USA_ColorCode",
		power: 3500, // in kW
		efficiency: 0.90, // Power Transfer Efficiency
		maxvelocity: 72, // in km/h
		mass: 212, //in t
	},
	
	// Europe Container Wagon
	{
		name: "Container_Europe", // Loosly based on DB Sgns 691 (Can hold up to 60' of containers, e.g. 3 x 20' or 1 x 40' + 1 x 20')
		type: "Container",
		mesh: "Container_Europe",
		load: 0, // in t
		maxvelocity: 120, // in km/h
		mass: 20, //in t
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