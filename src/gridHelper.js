import { Plane } from 'tubugl-2d-shape';
import chroma from 'chroma-js';
import { Program, ArrayBuffer } from 'tubugl-core';
import { mat4 } from 'gl-matrix';
import { baseFragSrc, baseVertSrc, axisVertSrc } from './shaders/gridhelper.shader';

export class GridHelper extends Plane {
	constructor(gl, params = {}, width = 100, height = 100, segmentW = 1, segmentH = 1) {
		params.isWire = true;
		super(gl, params, width, height, segmentW, segmentH);
		this.visible = true;
		this.rotation.x = Math.PI / 2;

		this._color = params.color ? params.color : '#ffffff';
		this._glColor = chroma(this._color).gl();

		this._makeAxis(params);
	}

	updateColor(color) {
		this._color = color;
		this._glColor = chroma(this._color).gl();
	}

	render(camera) {
		if (!this.visible) return;

		this._updateModelMatrix();
		this.updateWire(camera).drawWireframe();

		this.updateAxis(camera)
			.drawAxis(-this._width / 2, -this._height / 2)
			.drawAxis(this._width / 2, this._height / 2);
	}

	updateWire(camera) {
		super.updateWire(camera);
		this._gl.uniform3f(
			this._wireframeProgram.getUniforms('uColor').location,
			this._glColor[0],
			this._glColor[1],
			this._glColor[2]
		);

		return this;
	}

	updateAxis(camera) {
		this._axisProgram.bind();
		this._axisRateBuffer.bind().attribPointer(this._axisProgram);

		this._gl.uniformMatrix4fv(
			this._axisProgram.getUniforms('modelMatrix').location,
			false,
			this._axisModelMat
		);
		this._gl.uniformMatrix4fv(
			this._axisProgram.getUniforms('viewMatrix').location,
			false,
			camera.viewMatrix
		);
		this._gl.uniformMatrix4fv(
			this._axisProgram.getUniforms('projectionMatrix').location,
			false,
			camera.projectionMatrix
		);

		this._gl.uniform1f(this._axisProgram.getUniforms('uLength').location, this._axisSize);

		return this;
	}

	drawAxis(posX = 0, posZ) {
		this._gl.uniform3f(
			this._axisProgram.getUniforms('uStartPosition').location,
			posX + this.position.x,
			2 + this.position.y,
			posZ + this.position.z
		);

		[[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(arr => {
			this._gl.uniform3f(
				this._axisProgram.getUniforms('uDir').location,
				arr[0],
				arr[1],
				arr[2]
			);
			this._gl.uniform3f(
				this._axisProgram.getUniforms('uColor').location,
				arr[0],
				arr[1],
				arr[2]
			);
			this._gl.drawArrays(this._gl.LINES, 0, this._axisCnt);
		});

		return this;
	}

	addGui(gui) {
		let gridHelperGui = gui.addFolder('gridHelper');
		gridHelperGui.add(this, 'visible');

		let gridHelperPositionGui = gridHelperGui.addFolder('position');
		gridHelperPositionGui.add(this.position, 'x', -100, 100);
		gridHelperPositionGui.add(this.position, 'y', -100, 100);
		gridHelperPositionGui.add(this.position, 'z', -100, 100);
	}

	_makeWireframe() {
		this._wireframeProgram = new Program(this._gl, baseVertSrc, baseFragSrc);
	}

	_makeAxis(params) {
		this._axisProgram = new Program(this._gl, axisVertSrc, baseFragSrc);
		this._axisRateBuffer = new ArrayBuffer(this._gl, new Float32Array([0, 1]));
		this._axisRateBuffer.setAttribs('rate', 1);
		this._axisCnt = 2;
		this._axisSize = params.axisSize ? params.axisSize : 150;
		this._axisModelMat = mat4.create();
	}
}
