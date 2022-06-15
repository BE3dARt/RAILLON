// Global Variables
var activeDebug = false; // Debug information on/off
var curveSmoothness = 40; // Adjust how smooth the cureves will be (Higher numbers mean more curve points)
var couplerLockDistance = 0.007; // Couplers lock at this given distance inwards effectively making the rolling stock unit shorter

// Physics Control
var frictionCoefficient = 0.002; // Amount between rolling stock and rails
var accelerationMultiplier = 15; // It should accelerate / decelerate faster than a real train
