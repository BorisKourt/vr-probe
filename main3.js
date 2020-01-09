import * as THREE from './build/three.module.js';
import { VRButton } from './jsm/webxr/VRButton.js';
import { OBJLoader } from './jsm/loaders/OBJLoader.js';

var camera, scene, renderer, container, textureEquirec, equirectMaterial, cube_map;
var cube_object;

const frame_rate = 37;

var controller1, controller2;
var raycaster, intersected = [];
var tempMatrix = new THREE.Matrix4();
var group, slides;
var cubeCamera, cubeCameraB;
var material;
var count = 0;
var images = [];
var imageTextures = [];

var count = 0, cubeCamera1, cubeCamera2;
var reflection_material;

var current_360 = -1;
var next_360 = 0;

var show_grid = false;
var frame_motion = 20;

var og = new THREE.Vector3(0,0,0);

var cameraTarget;
var targetVector = new THREE.Vector3();

var current_data;
var changed_at = 0;

function setCameraToObject(_target_vector) {
  targetVector = _target_vector;

  const cameraPosition = camera.position.clone();
  const cameraRotation = camera.rotation.clone();
  const cameraQuaternion = camera.quaternion.clone();

  camera.lookAt(_target_vector);
  const d_quat = camera.quaternion.clone();

  camera.position.copy(cameraPosition);
  camera.rotation.copy(cameraRotation);
  camera.quaternion.copy(cameraQuaternion);

  cameraTarget = d_quat;

}

/*
 * Goals: Drag + Drop, mouse pointer style.
 * Bounding boxes added. Add slides?
 */

function lookAtAndOrient( objectToAdjust, pointToLookAt, pointToOrientXTowards) {
  /*var v1 = pointToOrientXTowards.sub( objectToAdjust.position ).normalize(); // CHANGED
  var v2 = pointToLookAt.sub( objectToAdjust.position ).normalize(); // CHANGED
  var v3 = new THREE.Vector3().crossVectors( v1, v2 ).normalize(); // CHANGED
  objectToAdjust.up.copy( v3 ); // CHANGED*/
  objectToAdjust.lookAt(pointToLookAt);
}

const slideActions = new Map([
  [ 0, function() {
    next_360 = 0;
    frame_motion = 0;
  }],
  [ 1, function() {
    next_360 = 1;
    frame_motion = 0;
  }],
  [ 2, function() {
    next_360 = 2;
    frame_motion = 0;
  }],
  [ 4, function() {
    next_360 = 3;
    frame_motion = 0;
  }],
  [ 5, function() {
    next_360 = 2;
    frame_motion = 0;
  }],
  [ 6, function() {
    next_360 = 4;
    frame_motion = 0;
  }],
  [ 7, function() {
    next_360 = 5;
    frame_motion = 0;
  }],
  [ 8, function() {
    next_360 = 6;
    frame_motion = 0;
  }],
  [ 9, function() {
    next_360 = 7;
    frame_motion = 0;
  }],
  [ 10, function() {
    next_360 = 4;
    frame_motion = 0;
  }],
  [ 11, function() {
    next_360 = 8;
    frame_motion = 0;
  }],
  [ 12, function() {
    next_360 = 1;
    frame_motion = 0;
  }],
  [ 13, function() {
    next_360 = 9;
    frame_motion = 0;
  }]
]);

var skyboxes = [
  'images/original/360.jpg',
  'images/360/solen.jpg',
  'images/360/kalaker.jpg',
  'images/360/morderen.jpg',
  'images/360/trollskog.jpg',
  'images/360/vinter_i_kragero.jpg',
  'images/360/komposisjon-med-kvinneakt.jpg',
  'images/360/furutraer_og_blomstrende_frukttraer.jpg'
];

var styles = [
  null,
  'solen',
  'kalaker',
  'morderen',
  'trollskog',
  'vinter_i_kragero',
  'komposisjon-med-kvinneakt',
  'furutraer_og_blomstrende_frukttraer'
];

const texturecount = skyboxes.length;

var canvases = [
  {"type": "360", "can": null, "con": null, "w": 4096, "h": 2048, "textures": null, "images": [], "current": -1, "next": 0},
  {"type": "painting", "can": null, "con": null, "w": 512, "h": 512, "textures": null, "images": [], "current": -1, "next": 0},
  {"type": "photo", "can": null, "con": null, "w": 512, "h": 512, "textures": null, "images": [], "current": -1, "next": 0},
  {"type": "collage", "can": null, "con": null, "w": 512, "h": 512, "textures": null, "images": [], "current": -1, "next": 0},
  {"type": "3D", "can": null, "con": null, "w": 512, "h": 512, "textures": null, "images": [], "current": -1, "next": 0},
  {"type": "cube", "can": null, "con": null, "w": 512, "h": 512, "textures": null, "images": [], "current": -1, "next": 0}
];


var clock = new THREE.Clock(true);
clock.getDelta();

init();
animate();

var ta, tb, tc;

function init() {
  var loader = new OBJLoader();

  var textureLoader = new THREE.TextureLoader();

  var cube_ao = textureLoader.load( "images/textures/AmbientOcclusionMap.png" );
  //var cube_displacement = textureLoader.load( "images/textures/DisplacementMap.png" );
  var cube_normal = textureLoader.load( "images/textures/NormalMap.png" );
  var cube_spec = textureLoader.load( "images/textures/SpecularMap.png" );

  for (var i = 0; i < canvases.length; i++) {
    canvases[i].can = document.createElement('canvas');

    if (canvases[i].can.getContext) {
      canvases[i].con = canvases[i].can.getContext('2d', {antialias: false, alpha: true });
      canvases[i].can.width = canvases[i].w;
      canvases[i].can.height = canvases[i].h;
      canvases[i].can.style.position = "absolute";

      for (var j = 0; j < texturecount; j++) {
        canvases[i].images[j] = new Image();
        if (j != 0) {
          canvases[i].images[j].src = "images/" + canvases[i].type + "/" + styles[j] + ".jpg";
        } else {
          canvases[i].images[j].src = "images/original/" + canvases[i].type + ".jpg";
        }
        //imageTextures[i] = textureLoader.load( skyboxes[i] );
      }
    }

    document.body.appendChild(canvases[i].can);
  }

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  var canvas = document.createElement( 'canvas' );
  canvas.style.position = "absolute";

  var context = canvas.getContext( 'webgl2', { antialias: false, alpha: false } );
  renderer = new THREE.WebGLRenderer( { canvas: canvas, context: context } );

  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.xr.enabled = true;
  container.appendChild( renderer.domElement );

  canvases[0].canvas_texture = new THREE.CanvasTexture(canvases[0].can);

  canvases[0].canvas_texture.mapping = THREE.EquirectangularReflectionMapping;
  canvases[0].canvas_texture.magFilter = THREE.LinearFilter;
  canvases[0].canvas_texture.minFilter = THREE.NearestFilter;
  canvases[0].canvas_texture.anisotropy = 16;
  canvases[0].canvas_texture.needsUpdate = true;

  var equirectShader = THREE.ShaderLib[ "equirect" ];

  var equirectMaterial = new THREE.ShaderMaterial( {
    fragmentShader: equirectShader.fragmentShader,
    vertexShader: equirectShader.vertexShader,
    uniforms: equirectShader.uniforms,
    side: THREE.DoubleSide
  });

  equirectMaterial.uniforms[ "tEquirect" ].value = canvases[0].canvas_texture;

  Object.defineProperty( equirectMaterial, 'map', {
    get: function () {

      return this.uniforms.tEquirect.value;

    }
  });

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 0.01, 200 );
  camera.position.x = 0;
  camera.position.y = 1.7;
  camera.position.z = 0;
  camera.updateProjectionMatrix();

  var tg = new THREE.BoxBufferGeometry( 1, 1, 1 );
  var tm = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
  ta = new THREE.Mesh( tg, tm);
  ta.position.x = 10;
  tb = new THREE.Mesh( tg, tm);
  tb.position.x = -10;
  tc = new THREE.Mesh( tg, tm);
  tc.position.y = -10;
  scene.add( ta);
  scene.add( tb);
  scene.add( tc);

  //var controls = new THREE.OrbitControls( camera, renderer.domElement );
  //controls.minDistance = 0.1;
  //controls.maxDistance = 2;

  var light = new THREE.AmbientLight( 0xa0a0a0 ); // soft white light
  scene.add( light );

  const light2 = new THREE.DirectionalLight( 0xa0a0a0, 3.0 );
  scene.add( light2 );

  var geometry2 = new THREE.SphereBufferGeometry( 100, 60, 40 );

  var cubeMesh = new THREE.Mesh( geometry2, equirectMaterial );
  cubeMesh.material = equirectMaterial;
  cubeMesh.visible = true;
  scene.add(cubeMesh);

  for (var i = 0; i < canvases.length ; i++) {

    var angle = (i / (canvases.length/2)) * Math.PI / 1.2;
    var x = (1.6 * Math.cos(angle)) ;
    var z = (1.6 * Math.sin(angle)) ;
    var y = 2;

    var drop_group = new THREE.Group();

    if (canvases[i].type == "cube") {
      canvases[i].canvas_texture = new THREE.CanvasTexture(canvases[i].can);
      canvases[i].canvas_texture.anisotropy = 16;
      canvases[i].canvas_texture.needsUpdate = true;

      const cube_mat = new THREE.MeshPhysicalMaterial(
        { color: 0xffffff,
          envMap: equirectMaterial.map,
          //reflectivity: 0.1,
          aoMap: cube_ao,
          aoMapIntensity: 0.5,
          normalMap: cube_normal,
          metalnessMap: cube_spec,
          map: canvases[i].canvas_texture
        } );

      loader.load(
        // resource URL
        'models/cube.obj',
        // called when resource is loaded
        function ( obj_object ) {

          obj_object.children[0].material = cube_mat;
          obj_object.position.z = -3;
          obj_object.rotation.z = Math.PI / (3 * Math.random());
          obj_object.rotation.x = Math.PI / (3 * Math.random());
          obj_object.rotation.y = Math.PI / (3 * Math.random());
          obj_object.children[0].material.needsUpdate = true;
          obj_object.scale.set(0.8,0.8,0.8);
          obj_object.updateMatrixWorld;
          cube_object = obj_object;

          obj_object.position.y = 0.25;

          drop_group.add( obj_object );

        },
        function ( xhr ) {
          console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        function ( error ) {
          console.log( 'An error happened' );
        }
      );

    } else if (canvases[i].type == "360") {
      // 360

      const geo_360 = new THREE.SphereBufferGeometry( 0.5, 32, 32);
      const material_360 = new THREE.MeshStandardMaterial(
        { roughness: 0,
          metalness: 1,
          envMap: equirectMaterial.map
        } );

      var sphere_360 = new THREE.Mesh( geo_360, material_360);

      sphere_360.position.y = 0.15;

      drop_group.add(sphere_360);

    } else {

      canvases[i]["canvas_texture"] = new THREE.CanvasTexture(canvases[i].can);

      const obj = new THREE.Mesh(
        new THREE.PlaneGeometry( 1, 1 ),
        new THREE.MeshBasicMaterial({
          depthWrite: true,
          color: 0xffffff,
          map: canvases[i]["canvas_texture"],
          side: THREE.DoubleSide,
          transparent: true}));

      drop_group.add(obj);

    }

    drop_group.position.x = x;
    drop_group.position.y = y;
    drop_group.position.z = z;

    lookAtAndOrient(drop_group, new THREE.Vector3( 0, 1.7, 0 ), new THREE.Vector3( 0, 1.7, 0 ));

    scene.add(drop_group);

  }

  const drop_geo = new THREE.PlaneGeometry( 1, 1 );
  const drop_tex = textureLoader.load( "images/textures/droptex.png" );

  for (var i = 0; i < canvases.length ; i++) {

    var angle = (i / (canvases.length/2)) * Math.PI / 1.2;
    var x = (1.8 * Math.cos(angle)) ;
    var z = (1.8 * Math.sin(angle)) ;
    var y = 1.3;

    var tg = new THREE.BoxBufferGeometry(0.8, 0.8, 0.8);
    var tm = new THREE.MeshBasicMaterial({color: 0x101000});
    var drop_box = new THREE.Mesh(tg, tm);

    //scene.add(drop_box);

    drop_box.position.x = x;
    drop_box.position.y = y;
    drop_box.position.z = z;

    lookAtAndOrient(drop_box, new THREE.Vector3( 0, 1.7, 0 ), new THREE.Vector3( 0, 1.7, 0 ));

    drop_box.updateMatrixWorld( true );
    drop_box.geometry.computeBoundingBox();

    var box = drop_box.geometry.boundingBox.clone();
    box.copy( drop_box.geometry.boundingBox ).applyMatrix4( drop_box.matrixWorld );
    canvases[i].trigger = box.clone();

    // Drop Indicator

    x = (1.5 * Math.cos(angle)) ;
    z = (1.5 * Math.sin(angle)) ;
    y = 1.1;

    var tm = new THREE.MeshBasicMaterial({map: drop_tex, transparent: true, premultipliedAlpha: true});
    var drop_message = new THREE.Mesh(drop_geo, tm);
    drop_message.position.set(x, y, z);
    lookAtAndOrient(drop_message, new THREE.Vector3( 0, 1.7, 0 ), new THREE.Vector3( 0, 1.7, 0 ));

    scene.add(drop_message);

  }

  group = new THREE.Group();
  scene.add( group );

  var style_images = [];

  const style_geo = new THREE.PlaneGeometry( 1, 1 );
  const style_dragger_geo = new THREE.BoxBufferGeometry( 0.5, 0.1, 0.003 );

  for (var i = 1; i < styles.length; i++ ){
    style_images[i] = textureLoader.load( "images/original/" + styles[i] + ".jpg" );

    const material_dragger = new THREE.MeshStandardMaterial(
      { roughness: 0.0,
        metalness: 0.9,
        color: 0xC96055,
        //envMap: textureEquirec
        envMap: equirectMaterial.map
      } );

    const dragger = new THREE.Mesh(style_dragger_geo, material_dragger);

    const obj = new THREE.Mesh(
      style_geo,
      new THREE.MeshBasicMaterial({
        //premultipliedAlpha: true,
        depthWrite: true,
        //alphaMap: alpha_node,
        color: 0xffffff,
        map: style_images[i],
        side: THREE.DoubleSide,
        transparent: true}));

    obj.position.x = 0.25;
    obj.position.y = -0.5;

    dragger.add(obj);

    var angle = (i / (styles.length/2)) * Math.PI; // Calculate the angle at which the element will be placed.
    // For a semicircle, we would use (i / numNodes) * Math.PI.
    var x = (2 * Math.cos(angle)); // Calculate the x position of the element.
    var z = (2 * Math.sin(angle)); // Calculate the y position of the element.

    dragger.position.x = x;
    dragger.position.y = -0.5;
    dragger.position.z = z;

    dragger.userData.id = i;

    lookAtAndOrient(dragger, new THREE.Vector3( 0, 1.7, 0 ), new THREE.Vector3( 0, 1.7, 0 ));

    group.add(dragger);

  }

  document.body.appendChild( VRButton.createButton( renderer ) );

  controller1 = renderer.xr.getController( 0 );
  controller1.addEventListener( 'selectstart', onSelectStart );
  controller1.addEventListener( 'selectend', onSelectEnd );
  scene.add( controller1 );

  controller2 = renderer.xr.getController( 1 );
  controller2.addEventListener( 'selectstart', onSelectStart );
  controller2.addEventListener( 'selectend', onSelectEnd );
  scene.add( controller2 );

  var geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

  var line = new THREE.Line( geometry );
  line.name = 'line';
  line.scale.z = 5;

  controller1.add( line.clone() );
  controller2.add( line.clone() );

  raycaster = new THREE.Raycaster();

  window.addEventListener( 'resize', onWindowResize, false );

}


function onSelectStart( event ) {

  var controller = event.target;

  var intersections = getIntersections( controller );

  if ( intersections.length > 0 ) {

    var intersection = intersections[ 0 ];

    tempMatrix.getInverse( controller.matrixWorld );

    var object = intersection.object;
    object.matrix.premultiply( tempMatrix );
    object.matrix.decompose( object.position, object.quaternion, object.scale );

    if (object.material.emissive) {
      object.material.emissive.b = 1;
    } else {
      object.material.color.setHex(0xff0000);
    }

    controller.add( object );

    controller.userData.selected = object;

  }

}

function onSelectEnd( event ) {

  var controller = event.target;

  if ( controller.userData.selected !== undefined ) {

    var object = controller.userData.selected;
    object.matrix.premultiply( controller.matrixWorld );
    object.matrix.decompose( object.position, object.quaternion, object.scale );

    if (object.material.emissive) {
      object.material.emissive.b = 0;
    } else {
      object.material.color.setHex(0xffffff);
    }

    // EVENT HANDLING (Exclusive)

    if (typeof object.userData.id !== 'undefined') {
      if (object.userData.id >= 10000 ){
        // camera
        //update_camera(object.position.clone());
      } else if (object.userData.id >= 1000) {
        // slides
        //update_object(object.userData.id, object.position.clone(), object.quaternion.clone());
      } else {
        // styles
        // Move
        //update_object(object.userData.id, object.position.clone(), object.quaternion.clone());
        // Check
        for(var i = 0; i < canvases.length; i++ ) {
          if (canvases[i].trigger.containsPoint(object.position)) {
            canvases[i].next = object.userData.id;
            //update_style(canvases[i].type, object.userData.id);
            break;
          }
        }
      }
    }

    group.add( object );

    controller.userData.selected = undefined;

  }

}

function getIntersections( controller ) {

  tempMatrix.identity().extractRotation( controller.matrixWorld );

  raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
  raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );

  return raycaster.intersectObjects( group.children);

}

function intersectObjects( controller ) {

  // Do not highlight when already selected

  if ( controller.userData.selected !== undefined ) return;

  var line = controller.getObjectByName( 'line' );
  var intersections = getIntersections( controller );

  if ( intersections.length > 0 ) {

    var intersection = intersections[ 0 ];

    var object = intersection.object;
    if (object.material.emissive) {
      object.material.emissive.r = 1;
    } else {
      object.material.color.setHex(0x0000ff);
    }
    intersected.push( object );

    line.scale.z = intersection.distance;

  } else {

    line.scale.z = 5;

  }

}

function cleanIntersected() {

  while ( intersected.length ) {

    var object = intersected.pop();
    if (object.material.emissive) {
      object.material.emissive.r = 0;
    } else {
      object.material.color.setHex(0xffffff);
    }

  }

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {
  renderer.setAnimationLoop( render );
}

var previous_clock = 0;
var flip = true;

function render() {

  cleanIntersected();

  intersectObjects( controller1 );
  intersectObjects( controller2 );

  //const time = performance.now() * 0.00001;

  // Linear timing for all effects.
  const elapsed = clock.getElapsedTime();
  if (elapsed - previous_clock >= 1.0 / frame_rate) {
    previous_clock = elapsed;
    // Linear.

    if (cube_object) {
      cube_object.rotation.x += 0.01;
      cube_object.rotation.y += 0.0007;
      cube_object.rotation.z += 0.001;

      if (cameraTarget) {
        const difference = camera.quaternion.angleTo(cameraTarget);

        if (difference > 0.05) {
          camera.quaternion.slerp(cameraTarget, 0.01 + (1 - difference / Math.PI) / 10);
          //camera.quaternion.normalize();
        }
      }

    }

    for (var i = 0; i < canvases.length; i++) {
      if (canvases[i].images[canvases[i].next].complete && canvases[i].current != canvases[i].next) {

        canvases[i].frame++;

        if (canvases[i].frame == 20) {
          canvases[i].current = canvases[i].next;
          canvases[i].frame = 0;
          canvases[i].con.globalAlpha = 1;
        } else {
          canvases[i].con.globalAlpha = 0.09;
        }

          canvases[i].con.drawImage(canvases[i].images[canvases[i].next], 0, 0);
          canvases[i].canvas_texture.needsUpdate = true;
        }
    }

  }

  renderer.render( scene, camera );

}
