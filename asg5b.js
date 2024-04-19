import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import {MTLLoader} from 'three/addons/loaders/MTLLoader.js';

//As of version r147 the preferred way to use three.js is via es6 modules and import maps.
//We have to setup the modules and imports in HTML and JS files
//We have to upload our code to a server if we use modules in our code
function main() {
    //Find the canvas ID we are using: id is "c"
	const canvas = document.querySelector( '#c' );
    //Create the renderer that renders our data into this canvas
	const renderer = new THREE.WebGLRenderer( { antialias: true, canvas } );

    //Camera param: The Field of View is 75 Degrees in the vertical dimension
	const fov = 90;
    //Camera param: The default Canvas aspect ratio is (default canvas size = 300x150 pixels) 300/150 = 2
	const aspect = 2;
    //Camera param: Near and far give the space in front of the camera that will be rendered
    //Anything before or after that range will be clipped
	const near = 0.1;
	const far = 5;
    //Create a Camera to display the scene
	const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );

    //The Camera sits on the +Z axis and looks towards the -Z axis, with +Y being up
    //As we put our object (a cube) at the origin, we are going to set the camera Z position to 2
    //so that the camera can see the cube.
	camera.position.z = 2;

    //Create a scene for putting our cubes
	const scene = new THREE.Scene();

    //Add a Light to our scene
    {
        const color = 0xFFFFFF;
		const intensity = 3;
		const light = new THREE.DirectionalLight( color, intensity );
        //Position of the light is -1,2,4 to the left, above and behind our camera. Target is 0,0,0
		light.position.set( - 1, 2, 4 );
		scene.add( light );
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
			root.scale.setScalar(.5);
			scene.add( root );
			root.position.x = 2.5;
			root.position.y = -1;

		} );
   		});

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

        //Set the cube's X and Y rotation to the current time. These rotations are in radians.
        //There are 2 pi randians in a circle, so the cube will turn around once on each axis
        // in about 6.28 seconds.
		//cube.rotation.x = time;
		//cube.rotation.y = time;

        //Set a different rotation for each of the cubes
        cubes.forEach( ( cube, ndx ) => {

			const speed = 1 + ndx * .1;
			const rot = time * speed;
			cube.rotation.x = rot;
			cube.rotation.y = rot;

		} );


		renderer.render( scene, camera );

        //We are requesting the browser that we want to animate something with this function "render"
		requestAnimationFrame( render );

	}
    // We call this one more time to start the loop
	requestAnimationFrame( render ); 

}

main();
