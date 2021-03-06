import { scene, camera, emitter, userLasers, enemyLasers, currentDelta, cameraSpeed,
        audioListener, gunSoundBuffer, explosionSoundBuffer, gameOver } from './main.js';
import { stormtroopers, landspeeder } from './loaders.js';
import * as THREE from '../three.js-dev/build/three.module.js';
import * as EXPLOSION from './explosion.js';
import * as USERINPUTS from './userInputs.js';

export var health = 100;
var userLaserGeometry = new THREE.CubeGeometry(0.2, 0.2, 20000);
var enemyLaserGeometry = new THREE.CubeGeometry(0.2, 0.2, 10000);
var redLaserMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000, opacity: 1.0 });
var greenLaserMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00, opacity: 1.0 });
var laserSpeed = 200;
var enemyLaserSpeed = 500;
var i;
var stormtrooperHelperBoxes = [];
var laserX = [];
var laserY = [Math.PI/36, -Math.PI/36, Math.PI/34, -Math.PI/34, Math.PI/30, -Math.PI/30];
var laserZ = [-Math.PI/32, Math.PI/32, Math.PI/34, -Math.PI/34, Math.PI/30, -Math.PI/30];

export function restart(){
    health = 100;
}

export function userFire () {
    var laserMesh = new THREE.Mesh(userLaserGeometry, greenLaserMaterial);
    
    laserMesh.position.copy(emitter.position);
    laserMesh.quaternion.copy(emitter.quaternion);
    laserMesh.updateWorldMatrix();
    
    setTimeout(function(){
        camera.remove(laserMesh);
    }, 50);
    userLasers.push(laserMesh); 
    camera.add(laserMesh);
    if (!USERINPUTS.muted){
        var gunSound = new THREE.Audio(audioListener);
        gunSound.setBuffer(gunSoundBuffer);
        gunSound.setLoop(false);
        gunSound.setVolume(1.0);
        camera.add(gunSound);
        gunSound.play();
    }
}

export function enemyFire (enemy) {
    var laserMesh = new THREE.Mesh(enemyLaserGeometry, redLaserMaterial);
    laserMesh.castShadow = true;
    laserMesh.receiveShadow = true;
    
    var gun = enemy.children[1];
    var pos = new THREE.Vector3();
    pos.copy(gun.position);
    pos.x -= 1;
    pos.y -= 91;
    pos.z += 5000;
    laserMesh.position.copy(pos);

    laserMesh.quaternion.copy(gun.quaternion);
    enemyLaserGeometry.computeFaceNormals();

    setTimeout(function(){
        enemy.remove(laserMesh);
    }, 50);
    
    laserMesh.updateWorldMatrix();
    enemyLasers.push(laserMesh);
    enemy.add(laserMesh);
    
    if (!USERINPUTS.muted){
        var gunSound = new THREE.PositionalAudio(audioListener);
        gunSound.setBuffer(gunSoundBuffer);
        gunSound.setLoop(false);
        gunSound.setVolume(1.0);
        gunSound.setRefDistance(2000);
        enemy.add(gunSound);
        gunSound.play();
    }
    testHit(laserMesh, landspeeder);
}

export function userLaserTranslate (item, index, object) {
    var itemWorldPos = new THREE.Vector3();
    item.getWorldPosition(itemWorldPos);
    var distance = itemWorldPos.distanceTo(camera.position);
    if (distance > 2000) {
        object.splice(index, 1);
        camera.remove(item);
    } else {
        //item.translateZ(currentDelta * -(Math.abs(cameraSpeed.z) + laserSpeed));   // move along the local z-axis
        for (var i = 0; i < stormtroopers.length; i++) {
            testHit(item, stormtroopers[i]);
        }
    }
    //userLaserGeometry.computeVertexNormals();
    item.updateWorldMatrix();
}


function testHit (beam, target) {
    
    var itemBox = new THREE.Box3().setFromObject(beam);
    var targetBox = new THREE.Box3().setFromObject(target);
    if (target.name === "landspeeder"){
        targetBox.expandByPoint(new THREE.Vector3(camera.position.x, camera.position.y + 2000, camera.position.z));
    }
    
    var collision = itemBox.intersectsBox(targetBox);
    
    if (collision) {
        if (target.name === "stormtrooper"){
            EXPLOSION.explode(target.position.x, target.position.y, target.position.z, target);
            var geometry = new THREE.BoxBufferGeometry();
            var material = new THREE.MeshBasicMaterial();
            var mesh = new THREE.Mesh( geometry, material );
            mesh.position.copy(target.position);
            scene.add( mesh );
            stormtroopers.splice(stormtroopers.indexOf(target), 1);
            if (!USERINPUTS.muted){
                var explosionSound = new THREE.PositionalAudio(audioListener);
                explosionSound.setBuffer(explosionSoundBuffer);
                explosionSound.setLoop(false);
                explosionSound.setVolume(1.0);
                explosionSound.setRefDistance(10000);
                mesh.add(explosionSound);
                explosionSound.play();
                scene.remove(mesh);
            }
            scene.remove(target);
        } else if (target.name === "landspeeder"){
            health -= 10;
            document.getElementById("health-text").innerText = "Health: " + health;
            if (health <= 0){
                EXPLOSION.explode(target.position.x, target.position.y, target.position.z, target);
                var geometry = new THREE.BoxBufferGeometry();
                var material = new THREE.MeshBasicMaterial();
                var mesh = new THREE.Mesh( geometry, material );
                mesh.position.copy(target.position);
                scene.add( mesh );
                stormtroopers.splice(stormtroopers.indexOf(target), 1);
                if (!USERINPUTS.muted){
                    var explosionSound = new THREE.PositionalAudio(audioListener);
                    explosionSound.setBuffer(explosionSoundBuffer);
                    explosionSound.setLoop(false);
                    explosionSound.setVolume(1.0);
                    explosionSound.setRefDistance(10000);
                    mesh.add(explosionSound);
                    explosionSound.play();
                    scene.remove(mesh);
                }
                scene.remove(target);
            }
        }        
    }
    
}

export function showHitboxes(show){
    if (show){
        stormtrooperHelperBoxes = [];
        for(i = 0; i < stormtroopers.length; i++){
            var stormtrooperBox = new THREE.Box3().setFromObject(stormtroopers[i]);
            var stormtrooperHelperBox = new THREE.Box3Helper( stormtrooperBox, 0xff0000 );
            stormtrooperHelperBoxes.push(stormtrooperHelperBox);
        }
        for(i = 0; i < stormtrooperHelperBoxes.length; i++){
            scene.add(stormtrooperHelperBoxes[i]);
        }
    } else {
        for(i = 0; i < stormtrooperHelperBoxes.length; i++){
            scene.remove(stormtrooperHelperBoxes[i]);
        }
    }
}