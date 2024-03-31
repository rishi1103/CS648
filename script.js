document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const overlay = document.getElementById('overlay');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const delayInput = document.getElementById('delay-input');
    const finalBtn = document.getElementById('final-btn');
    let delay = 300; // Delay between each step in milliseconds
    let points = []; // Array to store the points
    let algorithmStarted = false; // Track if the algorithm has started
    let circles = []
    let pinarray = []
    let currp = []
    let colors = []
    let isout = []
    let frame = 0
    let interval

    function isPointInsideCircle(point, circle) {
        const x = point[0];
        const y = point[1];
        const [center_x, center_y] = circle[0];
        const radius = circle[1];
        const distance_squared = (x - center_x) ** 2 + (y - center_y) ** 2;
        return distance_squared <= radius ** 2 + 0.00000001;
    }
    
    function twoPointCircle(p, q) {
        const center = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        const radius_squared = (p[0] - center[0]) ** 2 + (p[1] - center[1]) ** 2;
        const radius = Math.sqrt(radius_squared);
        return [center, radius];
    }
    
    function midpoint(p1, p2) {
        return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    }
    
    function perpendicularBisector(p1, p2) {
        const x1 = p1[0];
        const y1 = p1[1];
        const x2 = p2[0];
        const y2 = p2[1];
        if(y2-y1 == 0) y2 = 0.000000001;
        const slope = -((x2 - x1) / (y2 - y1));
        const [midpoint_x, midpoint_y] = midpoint(p1, p2);
        const y_intercept = midpoint_y - slope * midpoint_x;
        return [slope, y_intercept];
    }
    
    function findCircumcircle(p, q, r) {
        const bisector1 = perpendicularBisector(p, q);
        const bisector2 = perpendicularBisector(p, r);
    
        const center_x = (bisector2[1] - bisector1[1]) / (bisector1[0] - bisector2[0]);
        const center_y = bisector1[0] * center_x + bisector1[1];
    
        const center = [center_x, center_y];
    
        const radius = Math.sqrt((center_x - p[0]) ** 2 + (center_y - p[1]) ** 2);
    
        return [center, radius];
    }

    function drawCircle(ctx, circle, points, i, pinned, outside, color) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const center = circle[0];
        const radius = circle[1];
    
        for (let j = 0; j < points.length; j++) {
            if (j !== i) {
                ctx.fillStyle = pinned.includes(j) ? 'red' : 'blue';
                ctx.beginPath();
                ctx.arc(points[j][0], points[j][1], 3, 0, 2 * Math.PI);
                ctx.fill();
            } else {
                let pointColor;
                switch (color) {
                    case 1:
                        pointColor = 'green';
                        break;
                    case 2:
                        pointColor = 'magenta';
                        break;
                    case 3:
                        pointColor = 'yellow';
                        break;
                    default:
                        pointColor = 'green';
                }
                ctx.fillStyle = pointColor;
                ctx.beginPath();
                ctx.arc(points[j][0], points[j][1], 3, 0, 2 * Math.PI);
                ctx.fill();
    
                // Draw rays
                if (outside) {
                    const num_rays = 7; // Number of rays
                    const ray_length = 5; // Length of each ray
                    for (let k = 0; k < num_rays; k++) {
                        const angle = (2 * Math.PI * k) / num_rays;
                        const x_start = points[j][0] + 5 * Math.cos(angle);
                        const y_start = points[j][1] + 5 * Math.sin(angle);
                        const x_end = points[j][0] + (5 + ray_length) * Math.cos(angle);
                        const y_end = points[j][1] + (5 + ray_length) * Math.sin(angle);
                        ctx.strokeStyle = 'black';
                        ctx.setLineDash([5, 5]); // Dash style
                        ctx.beginPath();
                        ctx.moveTo(x_start, y_start);
                        ctx.lineTo(x_end, y_end);
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }
                }
    
                ctx.fillStyle = 'black';
                ctx.font = '10px Arial';
                ctx.fillText(`${i + 1}`, points[j][0], points[j][1] - 5);
            }
        }
    
        // Plot circle
        ctx.strokeStyle = 'blue';
        ctx.beginPath();
        ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI);
        ctx.stroke();

    }

    // Function to draw a point on canvas
    function drawPoint(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue';
        ctx.fill();
    }

    // Function to clear canvas
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Function to reset points array and clear canvas
    function reset() {
        points = [];
        circles = [];
        currp = [];
        colors = [];
        isout = [];
        pinarray = [];
        frame = 0;
        clearCanvas();
        algorithmStarted = false; // Reset algorithm status
    }

    // Event listener to add point on canvas click
    canvas.addEventListener('click', function(event) {
        if (!algorithmStarted) { // Only allow adding points if algorithm hasn't started
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            points.push([ x, y ]);
            drawPoint(x, y);
        }
    });
    function smallestEnclosingCircle(points) {
        if (points.length === 0) {
            return null;
        } else if (points.length === 1) {
            return [points[0][0], points[0][1], 0];
        }
    
        let circle = twoPointCircle(points[0], points[1]);
        let pinned = [];
        circles.push(circle)
        currp.push(1)
        pinarray.push(pinned)
        isout.push(false)
        colors.push(1)
        for (let i = 2; i < points.length; i++) {
            if (!isPointInsideCircle(points[i], circle)) {
                pinned = [];
                circles.push(circle);
                currp.push(i);
                pinarray.push(pinned);
                isout.push(true);
                colors.push(1);
                pinned = [i];
                circle = twoPointCircle(points[i], points[0]);
                circles.push(circle);
                currp.push(i);
                pinarray.push(pinned);
                isout.push(false);
                colors.push(1);
                for (let j = 0; j < i + 1; j++) {
                    if (!isPointInsideCircle(points[j], circle)) {
                        pinned = [i];
                        circles.push(circle);
                        currp.push(j);
                        pinarray.push(pinned);
                        isout.push(true);
                        colors.push(2);
                        circle = twoPointCircle(points[i], points[j]);
                        pinned = [i, j];
                        circles.push(circle);
                        currp.push(j);
                        pinarray.push(pinned);
                        isout.push(false);
                        colors.push(2);
                        for (let k = 0; k < j + 1; k++) {
                            if (!isPointInsideCircle(points[k], circle)) {
                                pinned = [i, j];
                                circles.push(circle);
                                currp.push(k);
                                pinarray.push(pinned);
                                isout.push(true);
                                colors.push(3);
                                circle = findCircumcircle(points[i], points[j], points[k]);
                                pinned = [i, j, k];
                                circles.push(circle);
                                currp.push(k);
                                pinarray.push(pinned);
                                isout.push(false);
                                colors.push(3);
                            } else {
                                pinned = [i, j];
                                circles.push(circle);
                                currp.push(k);
                                pinarray.push(pinned);
                                isout.push(false);
                                colors.push(3);
                            }
                        }
                    } else {
                        pinned = [i];
                        circles.push(circle);
                        currp.push(j);
                        pinarray.push(pinned);
                        isout.push(false);
                        colors.push(2);
                    }
                }
            } else {
                pinned = [];
                circles.push(circle);
                currp.push(i);
                pinarray.push(pinned);
                isout.push(false);
                colors.push(1);
            }
        }
    }

    function draw() {

        // Stop the interval when all points have been drawn
        if (frame >= circles.length) {
            clearInterval(interval);
            algorithmStarted = false;
            return;
        }
        // Draw circle and points
        drawCircle(ctx, circles[frame], points, currp[frame], pinarray[frame], isout[frame], colors[frame]);
    
        // Increment i to simulate progress
        frame++;
    
    }
    

    // Event listener for start button
    startBtn.addEventListener('click', function() {
        if(!algorithmStarted){
            if (points.length > 1) { // Ensure there are points to start the algorithm
                algorithmStarted = true; // Set algorithm status to started
                overlay.style.display = 'block';
                smallestEnclosingCircle(points)
                interval = setInterval(draw, delay);
                overlay.style.display = 'none';
            } else {
                alert('Please add points before starting the algorithm.');
            }
        }
    });

    // Event listener for reset button
    resetBtn.addEventListener('click', function() {
        clearInterval(interval);
        reset();
    });

    finalBtn.addEventListener('click', function() {
        if(algorithmStarted){
            drawCircle(ctx, circles[circles.length -1], points, currp[circles.length -1], pinarray[circles.length -1], isout[circles.length -1], colors[circles.length -1]);
            clearInterval(interval);
            frame = circles.length;
            algorithmStarted = false;
        }
    });

    delayInput.addEventListener('change', function() {
        delay = parseInt(delayInput.value); // Assuming delay is the variable you want to update
    });

    function drawCircles() {
        const backgroundCircle = document.getElementById('large-circle');
        const circle1 = document.createElement('div');
        circle1.id = 'circle1';
        backgroundCircle.appendChild(circle1);
    }
    
    function generateRandomPoints() {
        const numPoints = 50;
        const backgroundPoints = document.getElementById('background-points');
    
        for (let i = 0; i < numPoints; i++) {
            const point = document.createElement('div');
            point.classList.add('point');
            const xOffset = Math.random() < 0.5 ? Math.random() * 20 : 80 + Math.random() * 20; // Bias towards left and right sides
            point.style.top = `${Math.random() * document.body.clientHeight}px`; // Random position from top
            point.style.left = `${xOffset}%`; // Random position from left
            const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16); // Generate random color
            point.style.backgroundColor = randomColor; // Apply random color
            backgroundPoints.appendChild(point);
        }
    }

    function generateRandomCircles() {
        const numCircles = 20;
        const backgroundPoints = document.getElementById('background-points');
    
        for (let i = 0; i < numCircles; i++) {
            const circle = document.createElement('div');
            circle.classList.add('circle');
            const xOffset = Math.random() < 0.5 ? Math.random() * 20 : 80 + Math.random() * 20; // Bias towards left and right sides
            const circleSize = Math.floor(Math.random() * 100) + 50; // Random size between 5 and 15 pixels
            const initialX = Math.random() * document.body.clientWidth;
            const initialY = Math.random() * document.body.clientHeight;
            circle.style.width = `${circleSize}px`;
            circle.style.height = `${circleSize}px`;
            circle.style.top = `${initialY}px`; // Random initial position from top
            circle.style.left = `${initialX}px`; // Random initial position from left
            const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16); // Generate random color
            circle.style.borderColor = randomColor; // Apply random border color
            backgroundPoints.appendChild(circle);
    
            // Define the movement parameters
            const speed = 0.5; // Speed of movement in pixels per frame
            const directionChangeInterval = 1000 + Math.random()*4000; // Interval in milliseconds for changing direction
            let dx = Math.random() * speed * 2 - speed; // Initial x-direction velocity
            let dy = Math.random() * speed * 2 - speed; // Initial y-direction velocity
    
            // Update circle position periodically
            setInterval(() => {
                const rect = circle.getBoundingClientRect();
                let newX = rect.left + dx;
                let newY = rect.top + dy;
    
                // Check if the circle is going out of bounds
                if (newX < 0 || newX + circleSize > document.body.clientWidth) {
                    dx = -dx; // Reverse x-direction velocity
                    newX += dx;
                }
                if (newY < 0 || newY + circleSize > document.body.clientHeight) {
                    dy = -dy; // Reverse y-direction velocity
                    newY += dy;
                }
    
                // Update circle position
                circle.style.left = `${newX}px`;
                circle.style.top = `${newY}px`;
            }, 16); // Update approximately every 16 milliseconds (60 frames per second)

            setInterval(() => {
                dx = Math.random() * speed * 2 - speed;
                dy = Math.random() * speed * 2 - speed;
            }, directionChangeInterval);
        }
    }
    
    // Main function
    function main() {
        drawCircles();
        generateRandomCircles();
    }
    
    main();
});
