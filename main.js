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
     Rotating Architectural Calendar — nested armillary rings
     with date/tick markers floating around them
  ═══════════════════════════════════════════════════════════ */
  function initLimitGuardScene() {
    var canvas = document.getElementById('limitguardCanvas');
    if (!canvas) return;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
    camera.position.z = 5;

    /* Ambient + directional light for subtle shading */
    scene.add(new THREE.AmbientLight(0x1a1a2e, 1));
    var dirLight = new THREE.DirectionalLight(0xFBBF24, 0.8);
    dirLight.position.set(2, 3, 4);
    scene.add(dirLight);

    /* ── Build concentric rotating rings (armillary sphere) ── */
    var ringGroup = new THREE.Group();
    scene.add(ringGroup);

    var AMBER = 0xFBBF24;
    var AMBER_DIM = 0x7A5F00;

    var ringConfigs = [
      { r: 2.2, tube: 0.018, tilt: 0,    speed: 0.004  },
      { r: 2.2, tube: 0.015, tilt: 90,   speed: -0.006 },
      { r: 2.2, tube: 0.012, tilt: 45,   speed: 0.008  },
      { r: 1.6, tube: 0.018, tilt: 20,   speed: -0.005 },
      { r: 1.6, tube: 0.015, tilt: 70,   speed: 0.007  },
      { r: 1.0, tube: 0.02,  tilt: 0,    speed: 0.012  },
    ];

    var rings = ringConfigs.map(function (cfg) {
      var geo  = new THREE.TorusGeometry(cfg.r, cfg.tube, 8, 120);
      var mat  = new THREE.MeshBasicMaterial({
        color: AMBER,
        transparent: true,
        opacity: 0.55,
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = cfg.tilt * (Math.PI / 180);
      mesh.userData.speed = cfg.speed;
      mesh.userData.initTiltX = mesh.rotation.x;
      ringGroup.add(mesh);
      return mesh;
    });

    /* ── Tick marks on the outermost ring ────────────────── */
    var tickGroup = new THREE.Group();
    ringGroup.add(tickGroup);

    for (var m = 0; m < 24; m++) {
      var angle  = (m / 24) * Math.PI * 2;
      var isMain = m % 6 === 0;
      var len    = isMain ? 0.18 : 0.08;
      var r      = 2.2;

      var pts = [
        new THREE.Vector3(
          Math.cos(angle) * r,
          Math.sin(angle) * r,
          0
        ),
        new THREE.Vector3(
          Math.cos(angle) * (r + len),
          Math.sin(angle) * (r + len),
          0
        ),
      ];

      var tickGeo = new THREE.BufferGeometry().setFromPoints(pts);
      var tickMat = new THREE.LineBasicMaterial({
        color: isMain ? AMBER : AMBER_DIM,
        transparent: true,
        opacity: isMain ? 0.9 : 0.4,
      });
      tickGroup.add(new THREE.Line(tickGeo, tickMat));
    }

    /* ── Central glowing sphere ─────────────────────────── */
    var sphereGeo = new THREE.SphereGeometry(0.15, 24, 24);
    var sphereMat = new THREE.MeshBasicMaterial({
      color: AMBER,
      transparent: true,
      opacity: 0.9,
    });
    var sphere = new THREE.Mesh(sphereGeo, sphereMat);
    ringGroup.add(sphere);

    /* Glow halo around sphere */
    var glowGeo = new THREE.SphereGeometry(0.35, 24, 24);
    var glowMat = new THREE.MeshBasicMaterial({
      color: AMBER,
      transparent: true,
      opacity: 0.07,
      side: THREE.BackSide,
    });
    ringGroup.add(new THREE.Mesh(glowGeo, glowMat));

    /* ── Particle dots orbiting the structure ─────────────── */
    var orbitCount = 60;
    var orbitGeo   = new THREE.BufferGeometry();
    var orbitPos   = new Float32Array(orbitCount * 3);
    var orbitData  = [];

    for (var n = 0; n < orbitCount; n++) {
      var oa   = Math.random() * Math.PI * 2;
      var or   = 2.0 + Math.random() * 0.8;
      var oInc = (Math.random() - 0.5) * Math.PI;
      orbitData.push({ angle: oa, radius: or, inclination: oInc, speed: (Math.random() - 0.5) * 0.015 });
      orbitPos[n * 3]     = 0;
      orbitPos[n * 3 + 1] = 0;
      orbitPos[n * 3 + 2] = 0;
    }

    orbitGeo.setAttribute('position', new THREE.BufferAttribute(orbitPos, 3));
    var orbitMat = new THREE.PointsMaterial({
      color: AMBER,
      size: 0.06,
      transparent: true,
      opacity: 0.6,
    });
    ringGroup.add(new THREE.Points(orbitGeo, orbitMat));

    /* Resize */
    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    var t0 = performance.now();

    function tick() {
      requestAnimationFrame(tick);
      var t = performance.now() * 0.001;

      /* Rotate each ring on its own axis */
      rings.forEach(function (ring) {
        ring.rotation.z += ring.userData.speed;
      });

      /* Tick group follows outermost ring's y-rotation */
      tickGroup.rotation.z += 0.004;

      /* Slow overall yaw of the whole armillary */
      ringGroup.rotation.y = t * 0.12;
      ringGroup.rotation.x = Math.sin(t * 0.3) * 0.12;

      /* Update orbit particles */
      var op = orbitGeo.attributes.position.array;
      orbitData.forEach(function (od, i) {
        od.angle += od.speed;
        op[i * 3]     = Math.cos(od.angle) * od.radius;
        op[i * 3 + 1] = Math.sin(od.angle) * od.radius * Math.cos(od.inclination);
        op[i * 3 + 2] = Math.sin(od.angle) * od.radius * Math.sin(od.inclination);
      });
      orbitGeo.attributes.position.needsUpdate = true;

      /* Subtle sphere pulse */
      var pulse = 0.9 + Math.sin(t * 2.5) * 0.1;
      sphere.scale.setScalar(pulse);

      renderer.render(scene, camera);
    }
    tick();
  }

  /* ═══════════════════════════════════════════════════════════
     FILING REVIEW CANVAS
     Laser Plane Document Scan — stack of document slabs
     swept by a bright horizontal laser plane
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

    /* ── Stack of document slabs ─────────────────────────── */
    var DOC_COUNT = 7;
    var docGroup  = new THREE.Group();
    scene.add(docGroup);

    var CYAN = 0x00D2FF;
    var docSlabs = [];

    for (var d = 0; d < DOC_COUNT; d++) {
      var frac   = d / (DOC_COUNT - 1);
      var yPos   = -1.4 + frac * 2.8;
      var width  = 1.6 - Math.random() * 0.2;
      var height = 0.06;
      var depth  = 2.0 - Math.random() * 0.3;

      var geo = new THREE.BoxGeometry(width, height, depth);
      var mat = new THREE.MeshBasicMaterial({
        color: 0x1a1a30,
        transparent: true,
        opacity: 0.8,
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = yPos;
      mesh.position.x = (Math.random() - 0.5) * 0.1;
      mesh.position.z = (Math.random() - 0.5) * 0.1;
      docGroup.add(mesh);

      /* Edge wireframe for each slab */
      var edgeGeo = new THREE.EdgesGeometry(geo);
      var edgeMat = new THREE.LineBasicMaterial({
        color: 0x2a2a50,
        transparent: true,
        opacity: 0.6,
      });
      var edges = new THREE.LineSegments(edgeGeo, edgeMat);
      mesh.add(edges);

      docSlabs.push({ mesh: mesh, edges: edges, edgeMat: edgeMat, yPos: yPos, scanned: false });
    }

    /* ── Laser plane (thin horizontal box) ───────────────── */
    var laserGeo  = new THREE.PlaneGeometry(2.2, 0.015);
    var laserMat  = new THREE.MeshBasicMaterial({
      color: CYAN,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    var laser = new THREE.Mesh(laserGeo, laserMat);
    laser.rotation.x = -Math.PI / 2;
    scene.add(laser);

    /* Wider glow plane behind laser */
    var laserGlowGeo = new THREE.PlaneGeometry(2.4, 0.4);
    var laserGlowMat = new THREE.MeshBasicMaterial({
      color: CYAN,
      transparent: true,
      opacity: 0.07,
      side: THREE.DoubleSide,
    });
    var laserGlow = new THREE.Mesh(laserGlowGeo, laserGlowMat);
    laserGlow.rotation.x = -Math.PI / 2;
    scene.add(laserGlow);

    /* ── Scan result dots (appear after laser passes) ─────── */
    var dotGroup = new THREE.Group();
    scene.add(dotGroup);

    var scanDots = [];
    docSlabs.forEach(function (slab) {
      var dotGeo = new THREE.SphereGeometry(0.04, 8, 8);
      var dotMat = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0 });
      var dot    = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(-0.6, slab.yPos + 0.06, 0.7);
      dotGroup.add(dot);

      var checkGeo = new THREE.SphereGeometry(0.035, 8, 8);
      var checkMat = new THREE.MeshBasicMaterial({ color: 0x34D399, transparent: true, opacity: 0 });
      var check    = new THREE.Mesh(checkGeo, checkMat);
      check.position.set(0.5, slab.yPos + 0.06, 0.7);
      dotGroup.add(check);

      scanDots.push({ alertDot: dot, alertMat: dotMat, okDot: check, okMat: checkMat, triggered: false });
    });

    /* ── Animation state ─────────────────────────────────── */
    var LASER_MIN = -1.7;
    var LASER_MAX = 1.7;
    var laserY    = LASER_MIN;
    var laserDir  = 1;
    var LASER_SPEED = 0.022;

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

      /* Move laser */
      laserY += LASER_SPEED * laserDir;
      if (laserY > LASER_MAX) {
        laserDir = -1;
        /* Reset all scan dots on reversal */
        scanDots.forEach(function (sd) {
          sd.alertMat.opacity = 0;
          sd.okMat.opacity    = 0;
          sd.triggered        = false;
        });
        docSlabs.forEach(function (slab) {
          slab.edgeMat.color.setHex(0x2a2a50);
          slab.edgeMat.opacity = 0.6;
        });
      }
      if (laserY < LASER_MIN) {
        laserDir = 1;
        scanDots.forEach(function (sd) {
          sd.alertMat.opacity = 0;
          sd.okMat.opacity    = 0;
          sd.triggered        = false;
        });
        docSlabs.forEach(function (slab) {
          slab.edgeMat.color.setHex(0x2a2a50);
          slab.edgeMat.opacity = 0.6;
        });
      }

      laser.position.y     = laserY;
      laserGlow.position.y = laserY;

      /* Laser pulse opacity */
      laserMat.opacity = 0.7 + Math.sin(t * 8) * 0.15;

      /* Trigger scan results as laser passes each slab */
      docSlabs.forEach(function (slab, i) {
        if (!scanDots[i].triggered && Math.abs(laserY - slab.yPos) < 0.15) {
          scanDots[i].triggered = true;
          /* 2/7 chance of alert (red), rest ok (green) */
          if (i % 4 === 1 || i % 7 === 3) {
            scanDots[i].alertMat.opacity = 0.9;
            slab.edgeMat.color.setHex(0xF87171);
            slab.edgeMat.opacity = 0.9;
          } else {
            scanDots[i].okMat.opacity = 0.9;
            slab.edgeMat.color.setHex(0x34D399);
            slab.edgeMat.opacity = 0.8;
          }
        }
      });

      /* Gentle rotation of document group */
      docGroup.rotation.y = Math.sin(t * 0.3) * 0.15;
      dotGroup.rotation.y = docGroup.rotation.y;

      renderer.render(scene, camera);
    }
    tick();
  }

  /* ═══════════════════════════════════════════════════════════
     COSTGUARD CANVAS
     Grid-forming Geometries — particles coalesce into a
     precise 3D lattice, with value nodes glowing on intersections
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

    /* ── Build a 5×5×2 grid of nodes ────────────────────── */
    var COLS = 6, ROWS = 4, LAYERS = 2;
    var nodeCount = COLS * ROWS * LAYERS;

    /* Target (ordered) positions — perfect grid */
    var gridPos   = new Float32Array(nodeCount * 3);
    var chaosPos2 = new Float32Array(nodeCount * 3);

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

          /* Chaos: random scatter around the grid area */
          chaosPos2[idx * 3]     = gx + (Math.random() - 0.5) * 6;
          chaosPos2[idx * 3 + 1] = gy + (Math.random() - 0.5) * 5;
          chaosPos2[idx * 3 + 2] = gz + (Math.random() - 0.5) * 4;
          idx++;
        }
      }
    }

    /* Node particles */
    var currentPos2 = new Float32Array(chaosPos2);
    var nodeGeo     = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(currentPos2, 3));

    var nodeMat = new THREE.PointsMaterial({
      color: EMERALD,
      size: 0.1,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });
    var nodePoints = new THREE.Points(nodeGeo, nodeMat);
    scene.add(nodePoints);

    /* ── Grid connection lines (horizontal + vertical) ─────── */
    var lineGroup = new THREE.Group();
    scene.add(lineGroup);

    /* We'll draw lines dynamically based on formation progress */
    var lineSegs = [];

    /* Pre-build line segment objects (hidden initially) */
    function buildLines() {
      /* Horizontal lines along columns for each row/layer */
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
            var lm = new THREE.LineBasicMaterial({
              color: EMERALD_DIM,
              transparent: true,
              opacity: 0,
            });
            var line = new THREE.Line(lg, lm);
            lineGroup.add(line);
            lineSegs.push(lm);
          }
        }
      }
      /* Vertical lines */
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
            var lm2 = new THREE.LineBasicMaterial({
              color: EMERALD_DIM,
              transparent: true,
              opacity: 0,
            });
            var line2 = new THREE.Line(lg2, lm2);
            lineGroup.add(line2);
            lineSegs.push(lm2);
          }
        }
      }
    }
    buildLines();

    /* ── Animation state ─────────────────────────────────── */
    var progress2  = 0;
    var direction2 = 1;
    var hold2      = false;
    var holdF2     = 0;
    var HOLD_GRID  = 180;
    var HOLD_CHAOS2 = 60;

    /* Resize */
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

      /* Advance */
      if (!hold2) {
        progress2 += 0.004 * direction2;
        if (progress2 >= 1) {
          progress2 = 1; hold2 = true; holdF2 = HOLD_GRID; direction2 = -1;
        } else if (progress2 <= 0) {
          progress2 = 0; hold2 = true; holdF2 = HOLD_CHAOS2; direction2 = 1;
        }
      } else {
        holdF2--;
        if (holdF2 <= 0) hold2 = false;
      }

      var ep = easeInOutCubic(Math.max(0, Math.min(1, progress2)));

      /* Interpolate node positions */
      var pos2 = nodeGeo.attributes.position.array;
      for (var ni = 0; ni < nodeCount * 3; ni++) {
        pos2[ni] = chaosPos2[ni] + (gridPos[ni] - chaosPos2[ni]) * ep;
      }
      nodeGeo.attributes.position.needsUpdate = true;

      /* Fade in grid lines as order is achieved */
      var lineOpacity = Math.max(0, (ep - 0.6) / 0.4) * 0.35;
      lineSegs.forEach(function (lm) { lm.opacity = lineOpacity; });

      /* Node size grows with order */
      nodeMat.size = 0.06 + ep * 0.06;
      nodeMat.opacity = 0.5 + ep * 0.4;

      /* Slow rotation */
      var groupObj = nodePoints;
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
