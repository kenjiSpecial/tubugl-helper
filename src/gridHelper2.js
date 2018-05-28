import { Plane } from 'tubugl-2d-shape';
import chroma from 'chroma-js';
import { Program, ArrayBuffer } from 'tubugl-core';
import { baseFragSrc, baseVertSrc } from './shaders/gridhelper.shader';
import { IndexArrayBuffer } from 'tubugl-core';

export class GridHelper2 {
	constructor(
		gl,
		params = {},
		width = 1000,
		height = 1000,
		widthSegments = 10,
		heightSegments = 10
	) {
		params.isWire = true;
		this._gl = gl;

		this.visible = true;

		this._lineColor = params.lineColor ? params.lineColor : '#888888';
		this._fillColor = params.fillColor ? params.fillColor : '#dddddd';
		this._glLineColor = chroma(this._lineColor).gl();
		this._glFillColor = chroma(this._fillColor).gl();

		this._width = width;
		this._height = height;
		this._widthSegments = widthSegments;
		this._heightSegments = heightSegments;

		this._plane = new CustomPlane(
			this._gl,
			{
				vertexShaderSrc: baseVertSrc,
				fragmentShaderSrc: baseFragSrc,
				fillColor: this._glFillColor
			},
			width,
			height
		);
		this._plane.position.y = -0.1;

		this._linePlane = new LinePlane(
			this._gl,
			{ color: this._glLineColor },
			width,
			height,
			widthSegments,
			heightSegments
		);
	}

	updateColor(color) {
		this._color = color;
		this._glColor = chroma(this._color).gl();
	}

	render(camera) {
		this._plane.render(camera);
		this._linePlane.render(camera, this._plane.getModelMatrix());
	}

	addGui(gui) {
		let gridHelperGui = gui.addFolder('gridHelper');
		gridHelperGui.add(this, 'visible');

		let gridHelperPositionGui = gridHelperGui.addFolder('position');
		gridHelperPositionGui.add(this._plane.position, 'x', -100, 100);
		gridHelperPositionGui.add(this._plane.position, 'y', -100, 100);
		gridHelperPositionGui.add(this._plane.position, 'z', -100, 100);
	}

	_makeWireframe() {
		this._wireframeProgram = new Program(this._gl, baseVertSrc, baseFragSrc);
	}
}

class CustomPlane extends Plane {
	constructor(gl, params = {}, width, height) {
		super(gl, params, width, height);
		this.rotation.x = Math.PI / 2;
		this._fillColor = params.fillColor;
	}

	update(camera) {
		super.update(camera);

		this._gl.uniform3f(
			this._program.getUniforms('uColor').location,
			this._fillColor[0],
			this._fillColor[1],
			this._fillColor[2]
		);

		return this;
	}

	getModelMatrix() {
		return this._modelMatrix;
	}
}

class LinePlane {
	constructor(gl, params, width = 1000, height = 1000, widthSegments = 10, heightSegments = 10) {
		this._gl = gl;
		this._width = width;
		this._halfWidth = this._width / 2;
		this._height = height;
		this._halfHeight = this._height / 2;
		this._widthSegments = widthSegments * 5;
		this._heightSegments = heightSegments * 5;
		this._color = params.color ? params.color : [0, 0, 0];

		this._makeProgram();
		this._makeBuffer();
	}
	_makeProgram() {
		this._program = new Program(this._gl, baseVertSrc, baseFragSrc);
	}
	_makeBuffer() {
		let widthUnit = this._width / this._widthSegments;
		let heightUnit = this._height / this._heightSegments;
		let vertices = new Float32Array(
			4 * 3 * (this._widthSegments + 1 + this._heightSegments + 1)
		);

		let width = 0.4;

		for (let ii = 0; ii <= this._widthSegments; ii++) {
			let xx = widthUnit * ii - this._halfWidth;
			let y0 = -this._halfHeight;
			let y1 = this._halfHeight;
			let scale = ii % 5 === 0 ? 5 : 1;

			vertices[4 * 3 * ii] = xx - width / 2 * scale;
			vertices[4 * 3 * ii + 1] = y0;
			vertices[4 * 3 * ii + 2] = -0.1;

			vertices[4 * 3 * ii + 3] = xx + width / 2 * scale;
			vertices[4 * 3 * ii + 4] = y0;
			vertices[4 * 3 * ii + 5] = -0.1;

			vertices[4 * 3 * ii + 6] = xx + width / 2 * scale;
			vertices[4 * 3 * ii + 7] = y1;
			vertices[4 * 3 * ii + 8] = -0.1;

			vertices[4 * 3 * ii + 9] = xx - width / 2 * scale;
			vertices[4 * 3 * ii + 10] = y1;
			vertices[4 * 3 * ii + 11] = -0.1;
		}

		let startNum = 12 * (this._widthSegments + 1);
		for (let ii = 0; ii <= this._heightSegments; ii++) {
			let yy = heightUnit * ii - this._halfHeight;
			let x0 = -this._halfWidth;
			let x1 = this._halfWidth;
			let scale = ii % 5 === 0 ? 5 : 1;

			vertices[startNum + 4 * 3 * ii] = x0;
			vertices[startNum + 4 * 3 * ii + 1] = yy + width / 2 * scale;
			vertices[startNum + 4 * 3 * ii + 2] = -0.1;

			vertices[startNum + 4 * 3 * ii + 3] = x0;
			vertices[startNum + 4 * 3 * ii + 4] = yy - width / 2 * scale;
			vertices[startNum + 4 * 3 * ii + 5] = -0.1;

			vertices[startNum + 4 * 3 * ii + 6] = x1;
			vertices[startNum + 4 * 3 * ii + 7] = yy - width / 2 * scale;
			vertices[startNum + 4 * 3 * ii + 8] = -0.1;

			vertices[startNum + 4 * 3 * ii + 9] = x1;
			vertices[startNum + 4 * 3 * ii + 10] = yy + width / 2 * scale;
			vertices[startNum + 4 * 3 * ii + 11] = -0.1;
		}

		let indices = new Uint16Array(6 * (this._widthSegments + this._heightSegments + 2));

		for (let ii = 0; ii < this._widthSegments + this._heightSegments * +2; ii++) {
			indices[6 * ii + 0] = 0 + 4 * ii;
			indices[6 * ii + 1] = 1 + 4 * ii;
			indices[6 * ii + 2] = 2 + 4 * ii;

			indices[6 * ii + 3] = 2 + 4 * ii;
			indices[6 * ii + 4] = 1 + 4 * ii;
			indices[6 * ii + 5] = 3 + 4 * ii;
		}

		this._positionBuffer = new ArrayBuffer(this._gl, vertices);
		this._positionBuffer.setAttribs('position', 3);

		this._indexBuffer = new IndexArrayBuffer(this._gl, indices);

		this._cnt = indices.length;
		// console.log(this._cnt);
	}

	render(camera, modelMatrix) {
		this.update(camera, modelMatrix).draw();
	}

	update(camera, modelMatrix) {
		this._program.use();

		this._positionBuffer.bind().attribPointer(this._program);
		this._indexBuffer.bind();

		this._gl.uniformMatrix4fv(
			this._program.getUniforms('modelMatrix').location,
			false,
			modelMatrix
		);
		this._gl.uniformMatrix4fv(
			this._program.getUniforms('viewMatrix').location,
			false,
			camera.viewMatrix
		);
		this._gl.uniformMatrix4fv(
			this._program.getUniforms('projectionMatrix').location,
			false,
			camera.projectionMatrix
		);
		this._gl.uniform3f(
			this._program.getUniforms('uColor').location,
			this._color[0],
			this._color[1],
			this._color[2]
		);

		return this;
	}

	draw() {
		this._gl.disable(this._gl.CULL_FACE);

		this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
		this._gl.enable(this._gl.BLEND);

		this._gl.drawElements(this._gl.TRIANGLES, this._cnt, this._gl.UNSIGNED_SHORT, 0);
	}
}
