/* eslint-disable no-extra-boolean-cast */
/* eslint-disable no-undef */
// @ts-nocheck
/* eslint-disable no-unused-vars */
// This is a self-executing function (note the parenthesis at the end that cause it to run).
(() => {
	// This tells the browser to run this code in standards compliant mode rather than "quirks" mode.
	'use strict';

	// The next three lines create constant (unchangeable) references for a new canvas element, the canvas rendering context, and the diameter value, which determines the size and position of the rectangles that are drawn.
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	const diameter = 15;

	// These values can't be constants because they need to change whenever the browser is resized or the user moves the mouse.
	let	width = 0; // Width of the viewport
	let height = 0; // Height of the viewport
	let halfWidth = 0; // Half the width of the viewport (we're storing this to avoid having to calculate it repeatedly in the loop below).
	let frame; // This variable holds the reference to the frame from requestAnimationFrame so we can cancel the frame when the user resizes or changes the orientation of the browser window.
	let time = 0; // This is used to store the current position in the animation timeline.
	let destination = 1; // This is used to smoothe the animation transition to a new position in the timeline.

  // This function will be called initially on startup (below) and whenever the user resizes or reorients the browser window.
	const resize = () => {
		cancelAnimationFrame(frame); // Cancel the last requested animation frame (this prevents us having multiple animation loops running at the same time).
		width = canvas.width = window.innerWidth; // Set the width variable and the canvas width to the width of the viewport.
		height = canvas.height = window.innerHeight; // Set the height variable and the canvas height to the height of the viewport.
		halfWidth = width / 2; // Store half the width of the viewport to save unnecessary computations in the animation loop.
		ctx.globalCompositeOperation = 'lighter'; // This changes the mode of the canvas to blend colors together instead of simply stacking them (so drawing red on top of green produces yellow instead of just red on top of green). Also, this needs to be set after the canvas is resized or it does not work.
		loop(); // This starts the animation loop.
	};

	// This function runs repeatedly to draw each frame of the animation.
	const loop = () => {
		frame = requestAnimationFrame(loop); // We go ahead and request the next animation frame first so it can easily be cancelled when the user resizes/reorients the browser window.
		time += (destination - time) * 0.1; // Here we are adjusting the timeline position by 10% of the difference between the destination and the current timeline position per frame, which gives us a nice easing transition.
		ctx.clearRect(0, 0, width, height); // This clears the canvas.
    // This loop moves from the top to the bottom of the canvas in increments of the diameter defined above.
		for (let i = 0; i < height; i += diameter) {
      // This loop moves from the left to halfway across the canvas in increments of the diameter defined above.
			for (let j = 0; j < halfWidth; j += diameter) {
        // This loop runs for each of the three color channels (red, green, and blue).
				for (let channel = 0; channel < 3; channel++) {
					if (channel === 0) ctx.fillStyle = '#FF0000'; // Set the drawing color to red.
					if (channel === 1) ctx.fillStyle = '#00FF00'; // Set the drawing color to green.
					if (channel === 2) ctx.fillStyle = '#0000FF'; // Set the drawing color to blue.

					// From this point, I won't pretend to fully understand the math wizardy below, so you'll have to ask @toshiya-marukubo

					const index = i * width + j; // Store the current position on the canvas.
					ctx.globalAlpha = Math.tan(index * index - time); // This adjusts the translucency of the rectangle that is drawn using location and timeline position.

          // This draws a rectangle.
					ctx.fillRect(
						Math.tan(i * j - Math.sin(index + channel / 100) + time) * j + halfWidth - diameter / 2, // Top-left X coordinate.
						i, // Top-left Y coordinate.
						Math.tan(index + i / j + time + channel / 100) / 2 * diameter / 2, // Width of the rectangle.
						Math.tan(index * index - time) * diameter / 2 // Height of the rectangle.
					);

				}
			}
	  }
	};

	// This registers the function below to run when the page has finished loading.
	window.onload = () => {
		['mousemove', 'touchmove'].forEach(type => { // This runs the next function for each event type in the array.
      window.addEventListener(type, event => { // This adds an event listener to run the next three lines whenever there is a mousemove or touchmove event.
        event.preventDefault(); // Prevent the default event behavior.
        const e = !!event.touches ? event.touches[0] : event; // Determine if this is a touch event or a mouse event (this is called a ternary expression).
        destination = (e.pageX / width); // Set the timeline destination to the current mouse X position divided by viewport width (this gives us a number between 0 and 1).
		  });
    });
    canvas.style.background = '#000000'; // Sets the canvas background color to black.
		document.body.appendChild(canvas); // Attaches the canvas to the document body.
		resize(); // Resizes the viewport and starts the animation loop.
    window.onresize = resize; // This registers the resize function to run whenever the page is resized.
	}

})(); // Those last two parenthesis cause all of the code above to run.
