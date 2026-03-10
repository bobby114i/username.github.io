(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     Scroll-triggered fade-in animations
  ───────────────────────────────────────────────────────────── */
  var scrollEls = document.querySelectorAll('.animate-on-scroll');

  if ('IntersectionObserver' in window) {
    var scrollObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            scrollObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    scrollEls.forEach(function (el) { scrollObserver.observe(el); });
  } else {
    scrollEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ─────────────────────────────────────────────────────────────
     Sticky nav scroll effect
  ───────────────────────────────────────────────────────────── */
  var header = document.querySelector('.site-header');
  if (header) {
    var scrolled = false;
    window.addEventListener('scroll', function () {
      if (window.scrollY > 20 && !scrolled) {
        header.classList.add('header-scrolled');
        scrolled = true;
      } else if (window.scrollY <= 20 && scrolled) {
        header.classList.remove('header-scrolled');
        scrolled = false;
      }
    }, { passive: true });
  }

  /* ─────────────────────────────────────────────────────────────
     Mobile menu toggle
  ───────────────────────────────────────────────────────────── */
  var toggle = document.querySelector('.mobile-menu-toggle');
  var nav    = document.querySelector('.top-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('nav-open');
    });
  }

  /* ─────────────────────────────────────────────────────────────
     Nav dropdown
  ───────────────────────────────────────────────────────────── */
  var dropdowns = document.querySelectorAll('.nav-dropdown');
  dropdowns.forEach(function (dropdown) {
    var btn = dropdown.querySelector('.nav-dropdown-toggle');
    if (!btn) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var wasOpen = dropdown.classList.contains('is-open');
      dropdowns.forEach(function (d) {
        d.classList.remove('is-open');
        var b = d.querySelector('.nav-dropdown-toggle');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        dropdown.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    dropdown.addEventListener('mouseenter', function () {
      if (window.innerWidth > 768) {
        dropdown.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
    dropdown.addEventListener('mouseleave', function () {
      if (window.innerWidth > 768) {
        dropdown.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.addEventListener('click', function () {
    dropdowns.forEach(function (d) {
      d.classList.remove('is-open');
      var b = d.querySelector('.nav-dropdown-toggle');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  });

  /* ─────────────────────────────────────────────────────────────
     Three.js 3D Scenes — only initialise if THREE is loaded
     and the canvas elements exist on this page
  ───────────────────────────────────────────────────────────── */
  if (typeof THREE === 'undefined') return;

  /* ── Utility: resize renderer to match CSS size ─────────── */
  function resizeRenderer(renderer, camera, canvas) {
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    if (renderer.domElement.width !== w || renderer.domElement.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  /* ── Easing functions ───────────────────────────────────── */
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* ═══════════════════════════════════════════════════════════
     HERO CANVAS
     Particle field flowing from chaos into icosahedron geometry
  ═══════════════════════════════════════════════════════════ */
  function initHeroScene() {
    var canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    camera.position.z = 7;

    var COUNT = window.innerWidth < 600 ? 800 : 1600;

    /* Build two position arrays: chaos and order */
    var chaosPos = new Float32Array(COUNT * 3);
    var orderPos = new Float32Array(COUNT * 3);

    /* Chaos: random points in a wide ellipse */
    for (var i = 0; i < COUNT; i++) {
      var theta = Math.random() * Math.PI * 2;
      var phi   = Math.acos(2 * Math.random() - 1);
      var r     = 4 + Math.random() * 8;
      chaosPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      chaosPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      chaosPos[i * 3 + 2] = r * Math.cos(phi) * 0.5;
    }

    /* Order: icosahedron surface + internal grid lines */
    var icoGeo   = new THREE.IcosahedronGeometry(3, 3);
    var icoAttr  = icoGeo.attributes.position;
    var icoCount = icoAttr.count;

    for (var j = 0; j < COUNT; j++) {
      var srcIdx = (j % icoCount);
      orderPos[j * 3]     = icoAttr.getX(srcIdx) + (Math.random() - 0.5) * 0.25;
      orderPos[j * 3 + 1] = icoAttr.getY(srcIdx) + (Math.random() - 0.5) * 0.25;
      orderPos[j * 3 + 2] = icoAttr.getZ(srcIdx) + (Math.random() - 0.5) * 0.25;
    }

    /* Build particle system */
    var currentPos = new Float32Array(chaosPos);
    var ptGeo  = new THREE.BufferGeometry();
    ptGeo.setAttribute('position', new THREE.BufferAttribute(currentPos, 3));

    /* Per-particle colors: mix indigo and cyan */
    var colors = new Float32Array(COUNT * 3);
    for (var k = 0; k < COUNT; k++) {
      var t = Math.random();
      /* Indigo #5E6AD2 → Cyan #00D2FF */
      colors[k * 3]     = 0.37 * (1 - t) + 0.0 * t;
      colors[k * 3 + 1] = 0.42 * (1 - t) + 0.82 * t;
      colors[k * 3 + 2] = 0.82 * (1 - t) + 1.0 * t;
    }
    ptGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    var ptMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true,
    });
    var points = new THREE.Points(ptGeo, ptMat);
    scene.add(points);

    /* Subtle wireframe icosahedron that fades in with order */
    var wireGeo = new THREE.IcosahedronGeometry(3, 2);
    var wireMat = new THREE.MeshBasicMaterial({
      color: 0x3D4BB8,
      wireframe: true,
      transparent: true,
      opacity: 0,
    });
    var wireMesh = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireMesh);

    /* Mouse parallax */
    var mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', function (e) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    /* Animation state */
    var progress  = 0;
    var direction = 1;
    var hold      = false;
    var holdFrames = 0;
    var HOLD_ORDER = 150; /* frames at full order */
    var HOLD_CHAOS = 80;  /* frames at full chaos */

    function resize() {
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    function tick() {
      requestAnimationFrame(tick);

      /* Advance progress */
      if (!hold) {
        progress += 0.0035 * direction;
        if (progress >= 1) {
          progress = 1;
          hold = true;
          holdFrames = HOLD_ORDER;
          direction = -1;
        } else if (progress <= 0) {
          progress = 0;
          hold = true;
          holdFrames = HOLD_CHAOS;
          direction = 1;
        }
      } else {
        holdFrames--;
        if (holdFrames <= 0) hold = false;
      }

      var ep = easeInOutCubic(Math.max(0, Math.min(1, progress)));

      /* Interpolate positions */
      var pos = ptGeo.attributes.position.array;
      for (var idx = 0; idx < COUNT * 3; idx++) {
        pos[idx] = chaosPos[idx] + (orderPos[idx] - chaosPos[idx]) * ep;
      }
      ptGeo.attributes.position.needsUpdate = true;

      /* Wireframe fades in as order grows */
      wireMat.opacity = ep * 0.18;

      /* Slow rotation + mouse parallax */
      var rotY = performance.now() * 0.00015 + mouseX * 0.08;
      var rotX = mouseY * -0.04;
      points.rotation.y   = rotY;
      points.rotation.x   = rotX;
      wireMesh.rotation.y = rotY;
      wireMesh.rotation.x = rotX;

      renderer.render(scene, camera);
    }
    tick();
  }

  /* ═══════════════════════════════════════════════════════════
     LIMITGUARD CANVAS
     Particle network forming concentric orbital rings
     (unified dot-and-line visual language)
  ═══════════════════════════════════════════════════════════ */
  function initLimitGuardScene() {
    var canvas = document.getElementById('limitguardCanvas');
    if (!canvas) return;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
    camera.position.z = 5;

    var AMBER = 0xFBBF24;
    var COUNT = window.innerWidth < 600 ? 500 : 900;

    /* Build chaos and order positions */
    var chaosPos = new Float32Array(COUNT * 3);
    var orderPos = new Float32Array(COUNT * 3);

    /* Chaos: scattered ellipse */
    for (var i = 0; i < COUNT; i++) {
      var theta = Math.random() * Math.PI * 2;
      var phi   = Math.acos(2 * Math.random() - 1);
      var r     = 3 + Math.random() * 6;
      chaosPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      chaosPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      chaosPos[i * 3 + 2] = r * Math.cos(phi) * 0.4;
    }

    /* Order: concentric rings of dots (armillary-like) */
    var ringRadii = [2.2, 2.2, 1.6, 1.6, 1.0];
    var ringTilts = [0, Math.PI/2, Math.PI/4, Math.PI*0.35, Math.PI*0.15];
    for (var j = 0; j < COUNT; j++) {
      var ringIdx = j % ringRadii.length;
      var rr = ringRadii[ringIdx];
      var a = (j / (COUNT / ringRadii.length)) * Math.PI * 2 + Math.random() * 0.3;
      var tilt = ringTilts[ringIdx];
      var x = Math.cos(a) * rr;
      var y = Math.sin(a) * rr;
      /* Rotate by tilt around X axis */
      var ry = y * Math.cos(tilt);
      var rz = y * Math.sin(tilt);
      orderPos[j * 3]     = x + (Math.random() - 0.5) * 0.1;
      orderPos[j * 3 + 1] = ry + (Math.random() - 0.5) * 0.1;
      orderPos[j * 3 + 2] = rz + (Math.random() - 0.5) * 0.1;
    }

    /* Particle system */
    var currentPos = new Float32Array(chaosPos);
    var ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute('position', new THREE.BufferAttribute(currentPos, 3));

    /* Amber-toned colors with variation */
    var colors = new Float32Array(COUNT * 3);
    for (var k = 0; k < COUNT; k++) {
      var t = Math.random();
      colors[k * 3]     = 0.98 * (1 - t * 0.2);
      colors[k * 3 + 1] = 0.75 * (1 - t * 0.3);
      colors[k * 3 + 2] = 0.14 * (1 + t * 0.5);
    }
    ptGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    var ptMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });
    var points = new THREE.Points(ptGeo, ptMat);
    scene.add(points);

    /* Wireframe torus ring that fades in with order */
    var wireGeo = new THREE.TorusGeometry(2.2, 0.01, 8, 80);
    var wireMat = new THREE.MeshBasicMaterial({
      color: AMBER,
      wireframe: true,
      transparent: true,
      opacity: 0,
    });
    var wireMesh = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireMesh);

    /* Second ring at different tilt */
    var wireGeo2 = new THREE.TorusGeometry(1.6, 0.01, 8, 60);
    var wireMat2 = new THREE.MeshBasicMaterial({
      color: AMBER,
      wireframe: true,
      transparent: true,
      opacity: 0,
    });
    var wireMesh2 = new THREE.Mesh(wireGeo2, wireMat2);
    wireMesh2.rotation.x = Math.PI / 2;
    scene.add(wireMesh2);

    /* Central glow */
    var sphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
    var sphereMat = new THREE.MeshBasicMaterial({
      color: AMBER,
      transparent: true,
      opacity: 0.9,
    });
    var sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    var glowGeo = new THREE.SphereGeometry(0.3, 16, 16);
    var glowMat = new THREE.MeshBasicMaterial({
      color: AMBER,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    /* Animation state */
    var progress  = 0;
    var direction = 1;
    var hold      = false;
    var holdFrames = 0;

    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    function tick() {
      requestAnimationFrame(tick);
      var t = performance.now() * 0.001;

      if (!hold) {
        progress += 0.003 * direction;
        if (progress >= 1) { progress = 1; hold = true; holdFrames = 150; direction = -1; }
        else if (progress <= 0) { progress = 0; hold = true; holdFrames = 80; direction = 1; }
      } else {
        holdFrames--;
        if (holdFrames <= 0) hold = false;
      }

      var ep = easeInOutCubic(Math.max(0, Math.min(1, progress)));

      /* Interpolate positions */
      var pos = ptGeo.attributes.position.array;
      for (var idx = 0; idx < COUNT * 3; idx++) {
        pos[idx] = chaosPos[idx] + (orderPos[idx] - chaosPos[idx]) * ep;
      }
      ptGeo.attributes.position.needsUpdate = true;

      /* Wireframes fade in */
      wireMat.opacity = ep * 0.15;
      wireMat2.opacity = ep * 0.12;

      /* Slow rotation */
      var rotY = t * 0.12;
      var rotX = Math.sin(t * 0.3) * 0.12;
      points.rotation.y = rotY;
      points.rotation.x = rotX;
      wireMesh.rotation.y = rotY;
      wireMesh2.rotation.y = rotY;
      wireMesh2.rotation.x = Math.PI / 2 + rotX;

      /* Sphere pulse */
      sphere.scale.setScalar(0.9 + Math.sin(t * 2.5) * 0.1);

      renderer.render(scene, camera);
    }
    tick();
  }

  /* ═══════════════════════════════════════════════════════════
     FILING REVIEW CANVAS
     Particle document scan — stacked particle planes swept
     by a bright laser line (unified dot-and-line language)
  ═══════════════════════════════════════════════════════════ */
  function initFilingScene() {
    var canvas = document.getElementById('filingCanvas');
    if (!canvas) return;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    camera.position.set(1.5, 1, 4.5);
    camera.lookAt(0, 0, 0);

    var CYAN = 0x00D2FF;
    var GREEN = 0x34D399;
    var RED = 0xF87171;
    var DOC_COUNT = 7;

    var mainGroup = new THREE.Group();
    scene.add(mainGroup);

    /* Build document layers from particles on flat planes */
    var DOC_PARTICLES_PER = 80;
    var TOTAL = DOC_PARTICLES_PER * DOC_COUNT;
    var docPosArr = new Float32Array(TOTAL * 3);
    var docColArr = new Float32Array(TOTAL * 3);
    var docSlabY = [];

    for (var d = 0; d < DOC_COUNT; d++) {
      var yPos = -1.4 + (d / (DOC_COUNT - 1)) * 2.8;
      docSlabY.push(yPos);
      for (var p = 0; p < DOC_PARTICLES_PER; p++) {
        var idx = (d * DOC_PARTICLES_PER + p) * 3;
        docPosArr[idx]     = (Math.random() - 0.5) * 1.6;
        docPosArr[idx + 1] = yPos + (Math.random() - 0.5) * 0.02;
        docPosArr[idx + 2] = (Math.random() - 0.5) * 2.0;
        /* Base color: muted blue-grey */
        docColArr[idx]     = 0.12;
        docColArr[idx + 1] = 0.12;
        docColArr[idx + 2] = 0.25;
      }
    }

    var docGeo = new THREE.BufferGeometry();
    docGeo.setAttribute('position', new THREE.BufferAttribute(docPosArr, 3));
    docGeo.setAttribute('color', new THREE.BufferAttribute(docColArr, 3));

    var docMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });
    var docPoints = new THREE.Points(docGeo, docMat);
    mainGroup.add(docPoints);

    /* Subtle wireframe edges for each document layer */
    for (var dw = 0; dw < DOC_COUNT; dw++) {
      var edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.6, 0.01, 2.0));
      var edgeMat = new THREE.LineBasicMaterial({
        color: 0x2a2a50,
        transparent: true,
        opacity: 0.2,
      });
      var edgeMesh = new THREE.LineSegments(edgeGeo, edgeMat);
      edgeMesh.position.y = docSlabY[dw];
      mainGroup.add(edgeMesh);
    }

    /* Laser sweep line made of particles */
    var LASER_PTS = 40;
    var laserGeo = new THREE.BufferGeometry();
    var laserPos = new Float32Array(LASER_PTS * 3);
    for (var lp = 0; lp < LASER_PTS; lp++) {
      laserPos[lp * 3]     = (lp / (LASER_PTS - 1) - 0.5) * 2.2;
      laserPos[lp * 3 + 1] = 0;
      laserPos[lp * 3 + 2] = 0;
    }
    laserGeo.setAttribute('position', new THREE.BufferAttribute(laserPos, 3));
    var laserMat = new THREE.PointsMaterial({
      color: CYAN,
      size: 0.06,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });
    var laserPoints = new THREE.Points(laserGeo, laserMat);
    mainGroup.add(laserPoints);

    /* Laser glow line */
    var laserLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.1, 0, 0),
      new THREE.Vector3(1.1, 0, 0),
    ]);
    var laserLineMat = new THREE.LineBasicMaterial({
      color: CYAN,
      transparent: true,
      opacity: 0.5,
    });
    var laserLine = new THREE.Line(laserLineGeo, laserLineMat);
    mainGroup.add(laserLine);

    /* Animation state */
    var LASER_MIN = -1.7;
    var LASER_MAX = 1.7;
    var laserY    = LASER_MIN;
    var laserDir  = 1;
    var LASER_SPEED = 0.022;
    var scannedState = [];
    for (var si = 0; si < DOC_COUNT; si++) scannedState.push(false);

    function resetScan() {
      for (var ri = 0; ri < DOC_COUNT; ri++) scannedState[ri] = false;
      /* Reset colors to base */
      var cols = docGeo.attributes.color.array;
      for (var ci = 0; ci < TOTAL; ci++) {
        cols[ci * 3]     = 0.12;
        cols[ci * 3 + 1] = 0.12;
        cols[ci * 3 + 2] = 0.25;
      }
      docGeo.attributes.color.needsUpdate = true;
    }

    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    function tick() {
      requestAnimationFrame(tick);
      var t = performance.now() * 0.001;

      laserY += LASER_SPEED * laserDir;
      if (laserY > LASER_MAX) { laserDir = -1; resetScan(); }
      if (laserY < LASER_MIN) { laserDir = 1; resetScan(); }

      laserPoints.position.y = laserY;
      laserLine.position.y   = laserY;
      laserMat.opacity = 0.7 + Math.sin(t * 8) * 0.2;

      /* Colour document particles when laser passes */
      var cols = docGeo.attributes.color.array;
      for (var di = 0; di < DOC_COUNT; di++) {
        if (!scannedState[di] && Math.abs(laserY - docSlabY[di]) < 0.15) {
          scannedState[di] = true;
          var isDefect = (di % 4 === 1 || di % 7 === 3);
          var startIdx = di * DOC_PARTICLES_PER;
          for (var pi = 0; pi < DOC_PARTICLES_PER; pi++) {
            var ci = (startIdx + pi) * 3;
            if (isDefect) {
              cols[ci] = 0.97; cols[ci+1] = 0.50; cols[ci+2] = 0.44;
            } else {
              cols[ci] = 0.20; cols[ci+1] = 0.82; cols[ci+2] = 0.60;
            }
          }
          docGeo.attributes.color.needsUpdate = true;
        }
      }

      /* Gentle rotation */
      mainGroup.rotation.y = Math.sin(t * 0.3) * 0.15;

      renderer.render(scene, camera);
    }
    tick();
  }

  /* ═══════════════════════════════════════════════════════════
     COSTGUARD CANVAS
     Particle network forming a precise 3D lattice grid
     (unified dot-and-line visual language)
  ═══════════════════════════════════════════════════════════ */
  function initCostGuardScene() {
    var canvas = document.getElementById('costguardCanvas');
    if (!canvas) return;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
    camera.position.set(0, 1, 6);
    camera.lookAt(0, 0, 0);

    var EMERALD = 0x34D399;
    var EMERALD_DIM = 0x0D5C38;

    /* Grid nodes + ambient particles for richer look */
    var COLS = 6, ROWS = 4, LAYERS = 2;
    var nodeCount = COLS * ROWS * LAYERS;
    var AMBIENT = 120; /* extra ambient particles */
    var TOTAL = nodeCount + AMBIENT;

    var gridPos   = new Float32Array(TOTAL * 3);
    var chaosPos2 = new Float32Array(TOTAL * 3);
    var colors    = new Float32Array(TOTAL * 3);

    var spacing = 0.75;
    var idx = 0;

    for (var lyr = 0; lyr < LAYERS; lyr++) {
      for (var row = 0; row < ROWS; row++) {
        for (var col = 0; col < COLS; col++) {
          var gx = (col - (COLS - 1) * 0.5) * spacing;
          var gy = (row - (ROWS - 1) * 0.5) * spacing;
          var gz = (lyr - (LAYERS - 1) * 0.5) * spacing * 1.5;
          gridPos[idx * 3]     = gx;
          gridPos[idx * 3 + 1] = gy;
          gridPos[idx * 3 + 2] = gz;
          chaosPos2[idx * 3]     = gx + (Math.random() - 0.5) * 6;
          chaosPos2[idx * 3 + 1] = gy + (Math.random() - 0.5) * 5;
          chaosPos2[idx * 3 + 2] = gz + (Math.random() - 0.5) * 4;
          /* Emerald vertex colors with variation */
          var tv = Math.random();
          colors[idx * 3]     = 0.20 + tv * 0.1;
          colors[idx * 3 + 1] = 0.82 - tv * 0.1;
          colors[idx * 3 + 2] = 0.60 - tv * 0.1;
          idx++;
        }
      }
    }

    /* Ambient floating particles that orbit loosely */
    for (var ai = 0; ai < AMBIENT; ai++) {
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      var ar = 2 + Math.random() * 3;
      gridPos[idx * 3]     = ar * Math.sin(phi) * Math.cos(theta) * 0.6;
      gridPos[idx * 3 + 1] = ar * Math.sin(phi) * Math.sin(theta) * 0.5;
      gridPos[idx * 3 + 2] = ar * Math.cos(phi) * 0.4;
      chaosPos2[idx * 3]     = (Math.random() - 0.5) * 8;
      chaosPos2[idx * 3 + 1] = (Math.random() - 0.5) * 6;
      chaosPos2[idx * 3 + 2] = (Math.random() - 0.5) * 5;
      colors[idx * 3]     = 0.05;
      colors[idx * 3 + 1] = 0.36;
      colors[idx * 3 + 2] = 0.22;
      idx++;
    }

    var currentPos2 = new Float32Array(chaosPos2);
    var nodeGeo     = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(currentPos2, 3));
    nodeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    var nodeMat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });
    var nodePoints = new THREE.Points(nodeGeo, nodeMat);
    scene.add(nodePoints);

    /* Grid connection lines */
    var lineGroup = new THREE.Group();
    scene.add(lineGroup);
    var lineSegs = [];

    function buildLines() {
      for (var l = 0; l < LAYERS; l++) {
        for (var r = 0; r < ROWS; r++) {
          for (var c = 0; c < COLS - 1; c++) {
            var i1 = l * ROWS * COLS + r * COLS + c;
            var i2 = i1 + 1;
            var pts = [
              new THREE.Vector3(gridPos[i1*3], gridPos[i1*3+1], gridPos[i1*3+2]),
              new THREE.Vector3(gridPos[i2*3], gridPos[i2*3+1], gridPos[i2*3+2]),
            ];
            var lg = new THREE.BufferGeometry().setFromPoints(pts);
            var lm = new THREE.LineBasicMaterial({ color: EMERALD_DIM, transparent: true, opacity: 0 });
            lineGroup.add(new THREE.Line(lg, lm));
            lineSegs.push(lm);
          }
        }
      }
      for (var l2 = 0; l2 < LAYERS; l2++) {
        for (var r2 = 0; r2 < ROWS - 1; r2++) {
          for (var c2 = 0; c2 < COLS; c2++) {
            var i3 = l2 * ROWS * COLS + r2 * COLS + c2;
            var i4 = i3 + COLS;
            var pts2 = [
              new THREE.Vector3(gridPos[i3*3], gridPos[i3*3+1], gridPos[i3*3+2]),
              new THREE.Vector3(gridPos[i4*3], gridPos[i4*3+1], gridPos[i4*3+2]),
            ];
            var lg2 = new THREE.BufferGeometry().setFromPoints(pts2);
            var lm2 = new THREE.LineBasicMaterial({ color: EMERALD_DIM, transparent: true, opacity: 0 });
            lineGroup.add(new THREE.Line(lg2, lm2));
            lineSegs.push(lm2);
          }
        }
      }
    }
    buildLines();

    /* Animation state */
    var progress2  = 0;
    var direction2 = 1;
    var hold2      = false;
    var holdF2     = 0;

    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    function tick() {
      requestAnimationFrame(tick);
      var t = performance.now() * 0.001;

      if (!hold2) {
        progress2 += 0.004 * direction2;
        if (progress2 >= 1) { progress2 = 1; hold2 = true; holdF2 = 180; direction2 = -1; }
        else if (progress2 <= 0) { progress2 = 0; hold2 = true; holdF2 = 60; direction2 = 1; }
      } else {
        holdF2--;
        if (holdF2 <= 0) hold2 = false;
      }

      var ep = easeInOutCubic(Math.max(0, Math.min(1, progress2)));

      var pos2 = nodeGeo.attributes.position.array;
      for (var ni = 0; ni < TOTAL * 3; ni++) {
        pos2[ni] = chaosPos2[ni] + (gridPos[ni] - chaosPos2[ni]) * ep;
      }
      nodeGeo.attributes.position.needsUpdate = true;

      var lineOpacity = Math.max(0, (ep - 0.6) / 0.4) * 0.35;
      lineSegs.forEach(function (lm) { lm.opacity = lineOpacity; });

      nodeMat.size = 0.045 + ep * 0.05;
      nodeMat.opacity = 0.5 + ep * 0.4;

      nodePoints.rotation.y = Math.sin(t * 0.2) * 0.4 + t * 0.05;
      nodePoints.rotation.x = Math.sin(t * 0.15) * 0.12;
      lineGroup.rotation.y  = nodePoints.rotation.y;
      lineGroup.rotation.x  = nodePoints.rotation.x;

      renderer.render(scene, camera);
    }
    tick();
  }

  /* ─────────────────────────────────────────────────────────────
     Initialise all scenes
  ───────────────────────────────────────────────────────────── */
  initHeroScene();
  initLimitGuardScene();
  initFilingScene();
  initCostGuardScene();

})();
