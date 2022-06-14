// Global Variables
var activeDebug = false; // Debug information on/off
var curveSmoothness = 40; // Adjust how smooth the cureves will be (Higher numbers mean more curve points)
var couplerLockDistance = 0.007; // Couplers lock at this given distance inwards effectively making the rolling stock unit shorter

// Physics Control
var frictionCoefficient = 0.002; // Amount between rolling stock and rails
var accelerationMultiplier = 10; // It should accelerate / decelerate faster than a real train

// DO NOT CHANGE
var compositions = []; // Will hold all train compositions
var switches = []; // Holds all switches (Only defined here in order to find out which one has been clicked so it can be changed.)
var blurTime = 0;
var blurTimeElapsed = 0;
var renderStatus = true;
var previousFrameTime = 15;
