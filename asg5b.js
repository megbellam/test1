import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

console.log("Version 4"); //Use this to see if the correct file is being loaded

//As of version r147 the preferred way to use three.js is via es6 modules and import maps.
//We have to setup the modules and imports in HTML and JS files
//We have to upload our code to a server if we use modules in our code
function main() {
    //Find the canvas ID we are using: id is "c"
	const canvas = document.querySelector( '#c' );
	//Adding second view for 2nd camera
	const view1Elem = document.querySelector( '#view1' );
	const view2Elem = document.querySelector( '#view2' );

    //Create the renderer that renders our data into this canvas
	const renderer = new THREE.WebGLRenderer( { antialias: true, canvas } );

    //Camera param: The Field of View is 75 Degrees in the vertical dimension
	const fov = 45;
    //Camera param: The default Canvas aspect ratio is (default canvas size = 300x150 pixels) 300/150 = 2
	const aspect = 2;
    //Camera param: Near and far give the space in front of the camera that will be rendered
    //Anything before or after that range will be clipped
	const near = 5;
	const far = 100;
    //Create a Camera to display the scene
	const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );

    //The Camera sits on the +Z axis and looks towards the -Z axis, with +Y being up
    //As we put our object (a cube) at the origin, we are going to set the camera Z position to 2
    //so that the camera can see the cube.
	camera.position.set(0,10,20); //0, 10, 20

	//A second perspective camera
	const cameraHelper = new THREE.CameraHelper( camera );

	//MinMaxGUIHelper for the near and far settings so far is always greater than near.
	//It will have min and max properties that lil-gui will adjust. 
	//When adjusted they'll set the 2 properties we specify.
	class MinMaxGUIHelper {
		constructor(obj, minProp, maxProp, minDif) {
		  this.obj = obj;
		  this.minProp = minProp;
		  this.maxProp = maxProp;
		  this.minDif = minDif;
		}
		get min() {
		  return this.obj[this.minProp];
		}
		set min(v) {
		  this.obj[this.minProp] = v;
		  this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
		}
		get max() {
		  return this.obj[this.maxProp];
		}
		set max(v) {
		  this.obj[this.maxProp] = v;
		  this.min = this.min;  // this will call the min setter
		}
	  }

	//Update the camera based on the GUI updates
	//function updateCamera() {
	//	camera.updateProjectionMatrix();
	//}

	//Setup three user GUI bars for controlling fov, near and far parameters of the camera
	const gui = new GUI();
	//gui.add(camera, 'fov', 1, 180).onChange(updateCamera);
	gui.add(camera, 'fov', 1, 180);
	const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
	//gui.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(updateCamera);
	//gui.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far').onChange(updateCamera);
	gui.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near');
	gui.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far');

	//Set the OrobitControls for our mouse to rotate the scene
	const controls = new OrbitControls( camera, view1Elem );
	controls.target.set( 0, 5, 0 );
	controls.update();

	//2nd camera
	const camera2 = new THREE.PerspectiveCamera(
		60, // fov
		2, // aspect
		0.1, // near
		500, // far
	);
	camera2.position.set( 40, 10, 30 );
	camera2.lookAt( 0, 5, 0 );

	const controls2 = new OrbitControls( camera2, view2Elem );
	controls2.target.set( 0, 5, 0 );
	controls2.update();

    //Create a scene for putting our cubes
	const scene = new THREE.Scene();
	scene.background = new THREE.Color( 'black' );
	scene.add( cameraHelper );

	//Load the checkered Plane that forms the floor
	//This plane is being drawn through X-Axis, going along Z axis, so up is +Y
	{

		const planeSize = 40;

		const loader = new THREE.TextureLoader();
		const texture = loader.load( 'https://threejs.org/manual/examples/resources/images/checker.png' );
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.magFilter = THREE.NearestFilter;
		const repeats = planeSize / 2;
		texture.repeat.set( repeats, repeats );

		const planeGeo = new THREE.PlaneGeometry( planeSize, planeSize );
		const planeMat = new THREE.MeshPhongMaterial( {
			map: texture,
			side: THREE.DoubleSide,
		} );
		const mesh = new THREE.Mesh( planeGeo, planeMat );
		mesh.rotation.x = Math.PI * - .5;
		scene.add( mesh );

	}

	{
		//Color the checkered Ground Plane that is pointing towards the sky in blue
		//Color the checkered Ground Plane that is pointing towards the ground in brownish orange
		//So the bottom part of the checked Ground Plane will look orangish
		const skyColor = 0xB1E1FF; // light blue
		const groundColor = 0xB97A20; // brownish orange
		const intensity = 2;
		const light = new THREE.HemisphereLight( skyColor, groundColor, intensity );
		scene.add( light );

	}

    //Add a Light to our scene
    {
        const color = 0xFFFFFF;
		const intensity = 3;
		const light = new THREE.DirectionalLight( color, intensity );
		light.position.set( 0,10,0 ); //5,10,2
		scene.add( light );
		scene.add( light.target );
    }

	//We need to compute how far way the camera should be from the objects in our scene
	//so that they all appear inside the frustum and are visible to us
	//This is a function that will compute distance and then move the camera that 
	//distance units from the center of the box. After doing this we should
	//point the camera at the center of the box, which will do later
	function frameArea( sizeToFitOnScreen, boxSize, boxCenter, camera ) {

		const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
		const halfFovY = THREE.MathUtils.degToRad( camera.fov * .5 );
		const distance = halfSizeToFitOnScreen / Math.tan( halfFovY );
		// compute a unit vector that points in the direction the camera is now
		// from the center of the box
		const direction = ( new THREE.Vector3() )
			.subVectors( camera.position, boxCenter )
			.multiply( new THREE.Vector3( 1, 0, 1 ) )
			.normalize();

		// move the camera to a position distance units way from the center
		// in whatever direction the camera was from the center already
		camera.position.copy( direction.multiplyScalar( distance ).add( boxCenter ) );

		// pick some near and far values for the frustum that
		// will contain the box.
		camera.near = boxSize / 100;
		camera.far = boxSize * 100;

		camera.updateProjectionMatrix();

		// point the camera to look at the center of the box
		camera.lookAt( boxCenter.x, boxCenter.y, boxCenter.z );

	}

	const boxWidth = .5;
	const boxHeight = .5;
	const boxDepth = .5;
    //Create a box
	const geometry = new THREE.BoxGeometry( boxWidth, boxHeight, boxDepth );
	const myConeGeometry = new THREE.ConeGeometry( .5, 2, 20 );
	const mySphereGeometry = new THREE.SphereGeometry( .5, 20, 10 );
	const mySphere2Geometry = new THREE.SphereGeometry( .1, 20, 10 );

	const loader = new THREE.TextureLoader();
	const texture = loader.load( 'https://threejs.org/manual/examples/resources/images/wall.jpg' );
	texture.colorSpace = THREE.SRGBColorSpace;
	const materialT = new THREE.MeshBasicMaterial( {
		map: texture
	} );

    //Create a material that we can use for the box
	//const material = new THREE.MeshBasicMaterial( { color: 0x44aa88 } ); // greenish blue
    //Changed the material as MeshBasicMagtrial is not affected by light
    //const material = new THREE.MeshPhongMaterial( { color: 0x44aa88 } ); // greenish blue

    //Write a function to create the geometry for multiple cubes
    function makeInstance( geometry, color, x, y ) {

		const material = new THREE.MeshPhongMaterial( { color } );

		const cube = new THREE.Mesh( geometry, material );
		scene.add( cube );

		cube.position.x = x;
		cube.position.y = y;

		return cube;

	}

    //Now create the Mesh for the object by giving the Geometry (shape of the object),
    //the Material to draw it with. 
	//const cube = new THREE.Mesh( geometry, material );

    //Create the 3 cubes of different colors
    const cubes = [
		makeInstance( geometry, 0x8844aa, - 2, 0 ),
		//makeInstance( geometry, 0xaa8844, 2, 0 )
	];
	const cube2 = new THREE.Mesh( geometry, materialT );
	scene.add( cube2 );
	cube2.position.x = -2.5;
	cube2.position.y = 1.25;
	cubes.push( cube2 ); // add to our list of cubes to rotate

	//Create 2 cones
	const cones = [
		makeInstance( myConeGeometry, 0x44aa88, -1, 0 ),
		makeInstance( myConeGeometry, 0x8844aa, 1, 0 )	
	];
	const spheres = [
		makeInstance( mySphereGeometry, 0x44aa88, -0.5, 0 ),
		makeInstance( mySphereGeometry, 0x8844aa, 0.5, 0),
		makeInstance( mySphere2Geometry, 0x8844aa, -1, 1),
		makeInstance( mySphere2Geometry, 0x8844aa, -1, 1.15),
		makeInstance( mySphere2Geometry, 0x8844aa, -1, 1.30),
		makeInstance( mySphere2Geometry, 0x8844aa, -1, 1.45),
		makeInstance( mySphere2Geometry, 0x8844aa, -1, 1.60),
		makeInstance( mySphere2Geometry, 0x8844aa, -1, 1.75),
		makeInstance( mySphere2Geometry, 0x8844aa, -1.15, 1.75),
		makeInstance( mySphere2Geometry, 0x8844aa, 1, 1),
		makeInstance( mySphere2Geometry, 0x8844aa, 1, 1.15),
		makeInstance( mySphere2Geometry, 0x8844aa, 1, 1.30),
		makeInstance( mySphere2Geometry, 0x8844aa, 1, 1.45),
		makeInstance( mySphere2Geometry, 0x8844aa, 1, 1.60),
		makeInstance( mySphere2Geometry, 0x8844aa, 1, 1.75),
		makeInstance( mySphere2Geometry, 0x8844aa, 1.15, 1.75),
		makeInstance( mySphereGeometry, 0xaa8844, 0, -1)

	];

	{

		const objLoader = new OBJLoader();
		const mtlLoader = new MTLLoader();
  		mtlLoader.load('https://megbellam.github.io/test/necklace.mtl', (mtl) => {
    		mtl.preload();
    		objLoader.setMaterials(mtl);

		objLoader.load( 'https://megbellam.github.io/test/necklace.obj', ( root ) => {
			scene.add( root );
			//As the necklace is very large, scale it down so that it will fit better
			root.scale.setScalar(.15);
			//root.position.x = 2.5;
			//root.position.y = -1;

			//compute a theoretical box that contains all the stuff from this root
			//object and below
			const box = new THREE.Box3().setFromObject(root);

			const boxSize = box.getSize(new THREE.Vector3()).length();
    		const boxCenter = box.getCenter(new THREE.Vector3());

			// set the camera to frame the box
			// By multiplying with 1.2 we give us 20% more space above 
			// and below the box when trying to fit it inside the frustum
			frameArea(boxSize * 1.2, boxSize, boxCenter, camera);

			// update the Trackball controls to handle the new size
			// We are doing it so the camera will orbit the center of the scene
			controls.maxDistance = boxSize * 10;
			controls.target.copy(boxCenter);
			controls.update();

		} );
   		});

	}

	function resizeRendererToDisplaySize( renderer ) {

		const canvas = renderer.domElement;
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		const needResize = canvas.width !== width || canvas.height !== height;
		if ( needResize ) {

			renderer.setSize( width, height, false );

		}

		return needResize;

	}

	function setScissorForElement( elem ) {

		const canvasRect = canvas.getBoundingClientRect();
		const elemRect = elem.getBoundingClientRect();

		// compute a canvas relative rectangle
		const right = Math.min( elemRect.right, canvasRect.right ) - canvasRect.left;
		const left = Math.max( 0, elemRect.left - canvasRect.left );
		const bottom = Math.min( elemRect.bottom, canvasRect.bottom ) - canvasRect.top;
		const top = Math.max( 0, elemRect.top - canvasRect.top );

		const width = Math.min( canvasRect.width, right - left );
		const height = Math.min( canvasRect.height, bottom - top );

		// setup the scissor to only render to that part of the canvas
		const positiveYUpBottom = canvasRect.height - bottom;
		renderer.setScissor( left, positiveYUpBottom, width, height );
		renderer.setViewport( left, positiveYUpBottom, width, height );

		// return the aspect
		return width / height;

	}


    //Add the object we have created to the scene and specify if needed its position, orientation, scale
	//scene.add( cube );

    //Draw the scene we have described above, with all the objects in it
    //Show the scene using the camera we give to the render function
	//renderer.render( scene, camera );

    //Animate the cube so we can see if more clearly
    //Using a render loop to animate
    function render( time ) {

		time *= 0.001; // convert current time from milliseconds to seconds

		resizeRendererToDisplaySize( renderer );

		// turn on the scissor
		renderer.setScissorTest( true );

		//Render the original FIRST VIEW
		const aspect = setScissorForElement( view1Elem );

			// adjust the camera for this aspect
			camera.aspect = aspect;
			camera.updateProjectionMatrix();
			cameraHelper.update();

			// don't draw the camera helper in the original view
			cameraHelper.visible = false;

			scene.background.set( 0x000000 );

			//Set a different rotation for each of the cubes
			cubes.forEach( ( cube, ndx ) => {

				const speed = 1 + ndx * .1;
				const rot = time * speed;
				cube.rotation.x = rot;
				cube.rotation.y = rot;
	
			} );

			// render
			renderer.render( scene, camera );

		}

		// render from the 2nd camera
		{

			const aspect = setScissorForElement( view2Elem );

			// adjust the camera for this aspect
			camera2.aspect = aspect;
			camera2.updateProjectionMatrix();

			// draw the camera helper in the 2nd view
			cameraHelper.visible = true;

			scene.background.set( 0x000040 );

			renderer.render( scene, camera2 );

		}

        //We are requesting the browser that we want to animate something with this function "render"
		requestAnimationFrame( render );

	}
    // We call this one more time to start the loop
	requestAnimationFrame( render ); 

}

main();
