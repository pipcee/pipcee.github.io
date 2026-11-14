/* ==========================================================================
   Home background — 25 birds in a 2D torus.
   Classic boids: separation + alignment + cohesion, mouse avoidance, wrap.
   Each bird is a deliberately concave quadrilateral with a thicker centre.
   ========================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("bird-canvas");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var BIRD_COUNT = 25;
  var PERCEPTION = 138;
  var SEPARATION_RADIUS = 40;
  var MOUSE_RADIUS = 165;
  var MOUSE_ESCAPE_RADIUS = 46;
  var MIN_SPEED = 34;
  var MAX_SPEED = 88;

  var width = 0;
  var height = 0;
  var dpr = 1;
  var birds = [];
  var lastTime = 0;
  var rafId = 0;

  var mouse = { x: -1000, y: -1000, active: false };
  var reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  var motionScale = reducedMotion ? 0.22 : 1;

  canvas.dataset.birdCount = String(BIRD_COUNT);

  function wrap(value, limit) {
    if (limit <= 0) return 0;
    var wrapped = value % limit;
    return wrapped < 0 ? wrapped + limit : wrapped;
  }

  function shortestDelta(to, from, limit) {
    var delta = to - from;
    if (delta > limit / 2) delta -= limit;
    if (delta < -limit / 2) delta += limit;
    return delta;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function createBird(index) {
    var groups = [
      { x: 0.23, y: 0.3 },
      { x: 0.75, y: 0.25 },
      { x: 0.54, y: 0.68 },
    ];
    var group = groups[index % groups.length];
    var angle = randomBetween(0, Math.PI * 2);
    var speed = randomBetween(40, 72);

    return {
      x: wrap(width * group.x + randomBetween(-0.16, 0.16) * width, width),
      y: wrap(height * group.y + randomBetween(-0.14, 0.14) * height, height),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: randomBetween(0.72, 1.08),
      phase: randomBetween(0, Math.PI * 2),
      wander: randomBetween(0.45, 1.1),
      maxSpeed: randomBetween(74, MAX_SPEED),
    };
  }

  function seedBirds() {
    birds = [];
    for (var i = 0; i < BIRD_COUNT; i += 1) {
      birds.push(createBird(i));
    }
  }

  function resizeCanvas() {
    var previousWidth = width;
    var previousHeight = height;
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    if (!birds.length) {
      seedBirds();
    } else {
      birds.forEach(function (bird) {
        if (previousWidth > 0) {
          bird.x = wrap((bird.x / previousWidth) * width, width);
        }
        if (previousHeight > 0) {
          bird.y = wrap((bird.y / previousHeight) * height, height);
        }
      });
    }

    draw();
  }

  function updateBird(bird, dt) {
    var alignX = 0;
    var alignY = 0;
    var cohesionX = 0;
    var cohesionY = 0;
    var separationX = 0;
    var separationY = 0;
    var neighbours = 0;

    for (var i = 0; i < birds.length; i += 1) {
      var other = birds[i];
      if (other === bird) continue;

      var dx = shortestDelta(other.x, bird.x, width);
      var dy = shortestDelta(other.y, bird.y, height);
      var distanceSq = dx * dx + dy * dy;

      if (distanceSq > 0 && distanceSq < PERCEPTION * PERCEPTION) {
        alignX += other.vx;
        alignY += other.vy;
        cohesionX += dx;
        cohesionY += dy;
        neighbours += 1;

        if (distanceSq < SEPARATION_RADIUS * SEPARATION_RADIUS) {
          var distance = Math.sqrt(distanceSq) || 0.001;
          var strength = 1 - distance / SEPARATION_RADIUS;
          separationX -= (dx / distance) * strength;
          separationY -= (dy / distance) * strength;
        }
      }
    }

    var ax = 0;
    var ay = 0;

    if (neighbours > 0) {
      var averageVx = alignX / neighbours;
      var averageVy = alignY / neighbours;
      ax += (averageVx - bird.vx) * 1.15;
      ay += (averageVy - bird.vy) * 1.15;
      ax += (cohesionX / neighbours) * 1.05;
      ay += (cohesionY / neighbours) * 1.05;
    }

    ax += separationX * 175;
    ay += separationY * 175;

    bird.phase += dt * bird.wander;
    ax += Math.cos(bird.phase) * 7.5;
    ay += Math.sin(bird.phase * 0.83) * 7.5;

    if (mouse.active) {
      var mouseDx = shortestDelta(bird.x, mouse.x, width);
      var mouseDy = shortestDelta(bird.y, mouse.y, height);
      var mouseDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy) || 0.001;

      if (mouseDistance < MOUSE_RADIUS) {
        var falloff = 1 - mouseDistance / MOUSE_RADIUS;
        var push = falloff * falloff * 2400;
        var awayX = mouseDx / mouseDistance;
        var awayY = mouseDy / mouseDistance;

        if (mouseDistance < 0.5) {
          awayX = Math.cos(bird.phase);
          awayY = Math.sin(bird.phase);
        }

        ax += awayX * push;
        ay += awayY * push;
      }
    }

    bird.vx += ax * dt;
    bird.vy += ay * dt;

    var speed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
    var maxSpeed = bird.maxSpeed;

    if (speed > maxSpeed) {
      bird.vx = (bird.vx / speed) * maxSpeed;
      bird.vy = (bird.vy / speed) * maxSpeed;
    } else if (speed < MIN_SPEED) {
      var safeSpeed = speed || 1;
      bird.vx = (bird.vx / safeSpeed) * MIN_SPEED;
      bird.vy = (bird.vy / safeSpeed) * MIN_SPEED;
    }

    bird.x = wrap(bird.x + bird.vx * dt, width);
    bird.y = wrap(bird.y + bird.vy * dt, height);

    // A hard safety ring prevents the flock from settling into a tiny orbit
    // around the pointer when the cursor lands exactly on a bird.
    if (mouse.active) {
      var escapeDx = shortestDelta(bird.x, mouse.x, width);
      var escapeDy = shortestDelta(bird.y, mouse.y, height);
      var escapeDistance = Math.sqrt(escapeDx * escapeDx + escapeDy * escapeDy);

      if (escapeDistance < MOUSE_ESCAPE_RADIUS) {
        var escapeX;
        var escapeY;

        if (escapeDistance > 0.001) {
          escapeX = escapeDx / escapeDistance;
          escapeY = escapeDy / escapeDistance;
        } else {
          escapeX = Math.cos(bird.phase);
          escapeY = Math.sin(bird.phase);
        }

        bird.x = wrap(mouse.x + escapeX * MOUSE_ESCAPE_RADIUS, width);
        bird.y = wrap(mouse.y + escapeY * MOUSE_ESCAPE_RADIUS, height);

        var outwardSpeed = bird.vx * escapeX + bird.vy * escapeY;
        if (outwardSpeed < 34) {
          bird.vx += escapeX * (34 - outwardSpeed);
          bird.vy += escapeY * (34 - outwardSpeed);
        }
      }
    }
  }

  function drawBird(bird) {
    var angle = Math.atan2(bird.vy, bird.vx);
    var scale = bird.size;
    var speed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
    var stretch = 0.94 + Math.min(speed / MAX_SPEED, 1) * 0.14;

    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(angle);
    ctx.scale(scale * stretch, scale);

    // A concave quadrilateral: tip, wing, centre notch, wing.
    ctx.beginPath();
    ctx.moveTo(11.4, 0);
    ctx.lineTo(-8.2, -8);
    ctx.lineTo(-3.3, 0);
    ctx.lineTo(-8.2, 8);
    ctx.closePath();
    ctx.fillStyle = "rgba(26, 26, 23, 0.5)";
    ctx.fill();

    // Thicker centre-line: keeps the inverted-V / chevron feeling.
    ctx.beginPath();
    ctx.moveTo(-2.2, 0);
    ctx.lineTo(8.4, 0);
    ctx.lineWidth = 2.15;
    ctx.strokeStyle = "rgba(26, 26, 23, 0.66)";
    ctx.stroke();

    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (var i = 0; i < birds.length; i += 1) {
      drawBird(birds[i]);
    }
  }

  function frame(timestamp) {
    if (!lastTime) lastTime = timestamp;
    var dt = Math.min((timestamp - lastTime) / 1000, 0.04);
    lastTime = timestamp;

    var stepped = dt * motionScale;
    for (var i = 0; i < birds.length; i += 1) {
      updateBird(birds[i], stepped);
    }
    draw();
    rafId = window.requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resizeCanvas, { passive: true });

  window.addEventListener(
    "pointermove",
    function (event) {
      if (event.pointerType === "touch") return;
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      mouse.active = true;
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", function () {
    mouse.active = false;
  });

  window.addEventListener("blur", function () {
    mouse.active = false;
  });

  resizeCanvas();

  if (!reducedMotion) {
    rafId = window.requestAnimationFrame(frame);
  } else {
    draw();
  }

  // Lightweight diagnostics used by the visual verification pass.
  window.__birdFlock = {
    count: function () {
      return birds.length;
    },
    snapshot: function () {
      return birds.map(function (bird) {
        return { x: bird.x, y: bird.y, vx: bird.vx, vy: bird.vy };
      });
    },
    mouse: mouse,
    stop: function () {
      window.cancelAnimationFrame(rafId);
    },
  };
})();
