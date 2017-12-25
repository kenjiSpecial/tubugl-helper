/**
 * make demo with rendering of plane(webgl)
 */

const dat = require('dat.gui/build/dat.gui.min');
const TweenLite = require('gsap/TweenLite');
const Stats = require('stats.js');

import { COLOR_BUFFER_BIT, DEPTH_BUFFER_BIT, DEPTH_TEST } from 'tubugl-constants';
import { Box } from 'tubugl-3d-shape';
import { PerspectiveCamera } from 'tubugl-camera';
import { GridHelper, NormalHelper } from '../../index';
import { RoundingCube } from 'tubugl-3d-shape/src/roundingCube';

export default class App {
	constructor(params = {}) {
		this._isMouseDown = false;
		this._width = params.width ? params.width : window.innerWidth;
		this._height = params.height ? params.height : window.innerHeight;

		this.canvas = document.createElement('canvas');
		this.gl = this.canvas.getContext('webgl');

		this._setClear();
		this._makeBox();
		this._makeGridHelper();
		this._makeNormalHelper();
		this._makeCamera();

		this.resize(this._width, this._height);

		if (params.isDebug) {
			this.stats = new Stats();
			document.body.appendChild(this.stats.dom);
			this._addGui();
		}
	}

	animateIn() {
		this.isLoop = true;
		TweenLite.ticker.addEventListener('tick', this.loop, this);
	}

	loop() {
		if (this.stats) this.stats.update();

		let gl = this.gl;
		gl.viewport(0, 0, this._width, this._height);

		gl.clear(COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT);
		this._camera
			.updatePosition(
				this._camera.rad1 * Math.sin(this._camera.theta) * Math.cos(this._camera.phi),
				this._camera.rad1 * Math.sin(this._camera.phi),
				this._camera.rad1 * Math.cos(this._camera.theta) * Math.cos(this._camera.phi)
			)
			.lookAt([0, 0, 0]);

		this._gridHelper.render(this._camera);
		this._roundingCube.render(this._camera);
		this._normalHelper.render(this._camera);
	}

	animateOut() {
		TweenLite.ticker.removeEventListener('tick', this.loop, this);
	}

	mouseMoveHandler(mouse) {
		if (!this._isMouseDown) return;
		this._camera.theta += (mouse.x - this._prevMouse.x) * -Math.PI;
		this._camera.phi += (mouse.y - this._prevMouse.y) * -Math.PI;

		this._prevMouse = mouse;
	}

	mouseDownHandler(mouse) {
		this._isMouseDown = true;
		this._prevMouse = mouse;
	}

	mouseupHandler() {
		this._isMouseDown = false;
	}

	onKeyDown(ev) {
		switch (ev.which) {
			case 27:
				this._playAndStop();
				break;
		}
	}

	_playAndStop() {
		this.isLoop = !this.isLoop;
		if (this.isLoop) {
			TweenLite.ticker.addEventListener('tick', this.loop, this);
			this.playAndStopGui.name('pause');
		} else {
			TweenLite.ticker.removeEventListener('tick', this.loop, this);
			this.playAndStopGui.name('play');
		}
	}

	resize(width, height) {
		this._width = width;
		this._height = height;

		this.canvas.width = this._width;
		this.canvas.height = this._height;
		this.gl.viewport(0, 0, this._width, this._height);

		this._roundingCube.resize(this._width, this._height);
		this._camera.updateSize(this._width, this._height);
	}

	destroy() {}
	_setClear() {
		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		this.gl.enable(DEPTH_TEST);
	}
	_makeBox() {
		this._roundingCube = new RoundingCube(this.gl, 200, 200, 200, 50, 20, 20, 20, {
			isWire: false
		});
		this._roundingCube.posTheta = 0;
		this._roundingCube.rotTheta = 0;
	}

	_makeGridHelper() {
		this._gridHelper = new GridHelper(this.gl, 1000, 1000, 20, 20);
	}

	_makeNormalHelper() {
		this._normalHelper = new NormalHelper(this.gl, this._roundingCube);
	}

	_makeCamera() {
		this._camera = new PerspectiveCamera(window.innerWidth, window.innerHeight, 60, 1, 2000);
		this._camera.theta = 0;
		this._camera.phi = 0;
		this._camera.rad1 = 800;
		this._camera.rad2 = 800;
	}

	_addGui() {
		this.gui = new dat.GUI();
		this.playAndStopGui = this.gui.add(this, '_playAndStop').name('pause');
		this._roundingCubeGUIFolder = this.gui.addFolder('rounding cube');
		this._roundingCube.addGui(this._roundingCubeGUIFolder);

		this._gridHelper.addGui(this.gui);
		this._normalHelper.addGui(this.gui);
	}
}
