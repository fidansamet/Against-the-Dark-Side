import { ImprovedNoise } from '../three.js-dev/examples/jsm/math/ImprovedNoise.js';
import * as THREE from '../three.js-dev/build/three.module.js';
import { sunPos } from './skyAndSun.js';
import { getPixelValues } from './helpers/ImageHelpers.js';
import { HeightMapBufferGeometry } from './helpers/HeightMapGeometry.js';
import { HeightMapMesh } from './helpers/HeightMapMesh.js';

export function generateTerrainHeight( width, height ) {
    var size = width * height, data = new Uint8Array( size ),
        perlin = new ImprovedNoise(), quality = 1, z = Math.random() * 1;

    for ( var j = 0; j < 4; j ++ ) {
        for ( var i = 0; i < size; i ++ ) {
            
            var k = ~ ~ (i / 256);
            var x = i - (k * 256);
            //console.log(i);
            //console.log(k);
            
            if ((x < 106 || x > 156) || j < 2) {
                var x = i % width;
                var y = ~ ~ ( i / width );       // get floor
                data[ i ] += Math.abs( perlin.noise( x / quality, y / quality, z ) * quality * 1.5 );
            }
            if ((x < 86 || x > 176) || j < 2) {
                var x = i % width;
                var y = ~ ~ ( i / width );       // get floor
                data[ i ] += Math.abs( perlin.noise( x / quality, y / quality, z ) * quality * 2.0 );
            }
            
            
        }
        quality *= 2;
    }
    return data;
}

export function generateTerrainTexture( data, width, height ) {
    var canvas, canvasScaled, context, image, imageData, vector3, shade;
    vector3 = new THREE.Vector3( 0, 0, 0 );
    var sunDup = new THREE.Vector3(0, 0, 0);
    sunDup.x = sunPos.x;
    sunDup.y = sunPos.y;
    sunDup.z = sunPos.z;
    sunDup.normalize();
    canvas = document.createElement( 'canvas' );
    canvas.width = width;
    canvas.height = height;
    context = canvas.getContext( '2d' );
    context.fillStyle = '#000';
    context.fillRect( 0, 0, width, height );
    image = context.getImageData( 0, 0, canvas.width, canvas.height );
    imageData = image.data;
    for ( var i = 0, j = 0, l = imageData.length; i < l; i += 4, j ++ ) {
        vector3.x = data[ j - 2 ] - data[ j + 2 ];
        vector3.y = 2;
        vector3.z = data[ j - width * 2 ] - data[ j + width * 2 ];
        vector3.normalize();
        shade = vector3.dot( sunDup );
        imageData[ i ] = ( 96 + shade * 128 ) * ( 0.5 + data[ j ] * 0.007 );
        imageData[ i + 1 ] = ( 32 + shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
        imageData[ i + 2 ] = ( shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
    }
    context.putImageData( image, 0, 0 );
    // Scaled 4x
    canvasScaled = document.createElement( 'canvas' );
    canvasScaled.width = width * 4;
    canvasScaled.height = height * 4;
    context = canvasScaled.getContext( '2d' );
    context.scale( 4, 4 );
    context.drawImage( canvas, 0, 0 );
    image = context.getImageData( 0, 0, canvasScaled.width, canvasScaled.height );
    imageData = image.data;
    for ( var i = 0, l = imageData.length; i < l; i += 4 ) {
        var v = ~ ~ ( Math.random() * 5 );
        imageData[ i ] += v;
        imageData[ i + 1 ] += v;
        imageData[ i + 2 ] += v;
    }
    context.putImageData( image, 0, 0 );
    return canvasScaled;
}

export function makeTile(size, res) {
  var geometry = new THREE.Geometry();
  for (var i = 0; i <= res; i++) {
    for (var j = 0; j <= res; j++) {
      var z = j * size;
      var x = i * size;
      var position = new THREE.Vector3(x, 0, z);
      var addFace = (i > 0) && (j > 0);
      makeQuad(geometry, position, addFace, res + 1);
    }
  }
  geometry.computeFaceNormals();
  geometry.normalsNeedUpdate = true;
          
  return geometry;
};

function makeQuad(geometry, position, addFace, verts) {
  geometry.vertices.push(position);
    
  if (addFace) {
    var index1 = geometry.vertices.length - 1;
    var index2 = index1 - 1;
    var index3 = index1 - verts;
    var index4 = index1 - verts - 1;
    
    geometry.faces.push(new THREE.Face3(index2, index3, index1));
    geometry.faces.push(new THREE.Face3(index2, index4, index3));
  }
};

export class Terrain {

    // Constructs the Terrain with the height map file, width and depth
    constructor() {
        this.heightMapImage = document.getElementById('heightmap');
        this.terrainData = getPixelValues(this.heightMapImage, 'r');
        this.heightMapWidth = this.heightMapImage.width;
        this.heightMapDepth = this.heightMapImage.height;
    }

    // Initializes the terrain mesh
    init(worldMapWidth, worldMapMaxHeight, worldMapDepth) {
        var heightMapGeometry = new HeightMapBufferGeometry(this.terrainData, this.heightMapWidth, this.heightMapDepth);
        heightMapGeometry.scale(worldMapWidth, worldMapMaxHeight, worldMapDepth);

        var sandTexture = this.wrapTexture('textures/sand4.jpg');
        var terrainMaterialImp = this.terrainMaterial(sandTexture);

        var terrainMesh = new HeightMapMesh(heightMapGeometry, terrainMaterialImp);
        terrainMesh.receiveShadow = true;

        return terrainMesh;
    }

    // Wraps the texture and returns it
    wrapTexture(textureString) {
        var objectTexture = new THREE.TextureLoader().load(textureString);
        objectTexture.wrapS = THREE.RepeatWrapping;
        objectTexture.wrapT = THREE.RepeatWrapping;
        return objectTexture;
    }

    // Creates the terrain material as a MeshPhongMaterial to apply reflection
    terrainMaterial(sandtexture) {
        var tmi = new THREE.MeshPhongMaterial({
            map: sandtexture
        });
        return tmi;
    }
}