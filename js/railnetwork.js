// Right: 0, Up: 90, Left: 180, Down: 270
var railwayNetworkConfiguration = [
    
    {
        name: "Default",
        rails: [
            // 1st Section
            [
                [[0, 0, -5], 180, [-5, 0, -5], 180],
                [[-5, 0, -5], 180, [-10, 0, 0], 90],
                [[-10, 0, 0], 90, [-5, 0, 5], 0],
                [[-5, 0, 5], 0, [0, 0, 5], 0],
                [[0, 0, 5], 0, [5, 0, 5], 0],
                [[5, 0, 5], 0, [10, 0, 0], 270],
                [[10, 0, 0], 270, [5, 0, -5], 180],
                [[5, 0, -5], 180, [0, 0, -5], 180]
            ],
			
			// 2nd Section
            [
                [[5, 0, 5], 180, [1, 0, 0], 270],
                [[1, 0, 0], 270, [-5, 0, -5], 180],
            ],
			
			// 3rd Section
            [
                [[-5, 0, 5], 0, [-1, 0, 0], 270],
                [[-1, 0, 0], 270, [5, 0, -5], 0],
            ],
        ]
    },
    
    {
        name: "Test",
        rails: null,
    }
    
]

// If coordinates are the same but angle is opposite, change moving direction!