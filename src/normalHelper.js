import { Program, VAO, ArrayBuffer, IndexArrayBuffer } from 'tubugl-core';
import { mat4 } from 'gl-matrix/src/gl-matrix';
import { baseVertSrc, baseFragSrc, lineVertSrc, lineFragSrc } from './shaders/normalHelper.shader';

export class NormalHelper  {
	constructor(gl, shape, params = {}) {

		this.visible = true;

		this._gl = gl;
		this._shape = shape;
		this._isGl2 = !!params.isGL2;
		this._modelMatrix = mat4.create();
		this._lineLength = 20;
		this._makeProgram();
		this._makeBuffer();
	}
	render(camera) {
		if (!this.visible) return;

		this._updateModelMatrix();
		this.updateDot(camera).drawDot();
		this.updateLine(camera).drawLine();
	}

	updateDot(camera) {
		this._program.bind();

		if (this._vao) {
			this._vao.bind();
		} else {
			this._positionBuffer.bind().attribPointer(this._program);
			this._normalBuffer.bind().attribPointer(this._program);
		}

		this._gl.uniformMatrix4fv(
			this._program.getUniforms('modelMatrix').location,
			false,
			this._modelMatrix
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

		return this;
	}
	updateLine(camera) {
		this._lineProgram.bind();

		this._linePositionBuffer.bind().attribPointer(this._lineProgram);
		this._lineNormalBuffer.bind().attribPointer(this._lineProgram);
		this._lineSideBuffer.bind().attribPointer(this._lineProgram);
		this._lineIndexBuffer.bind();

		this._gl.uniform1f(this._lineProgram.getUniforms('lineLength').location, this._lineLength);

		this._gl.uniformMatrix4fv(
			this._lineProgram.getUniforms('modelMatrix').location,
			false,
			this._modelMatrix
		);
		this._gl.uniformMatrix4fv(
			this._lineProgram.getUniforms('viewMatrix').location,
			false,
			camera.viewMatrix
		);
		this._gl.uniformMatrix4fv(
			this._lineProgram.getUniforms('projectionMatrix').location,
			false,
			camera.projectionMatrix
		);

		return this;
	}
	drawDot() {
		this._gl.disable(this._gl.CULL_FACE);
		this._gl.enable(this._gl.DEPTH_TEST);

		this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE);
		this._gl.enable(this._gl.BLEND);

		this._gl.drawArrays(this._gl.POINTS, 0, this._pointNum);
	}
	drawLine() {
		this._gl.disable(this._gl.CULL_FACE);
		this._gl.enable(this._gl.DEPTH_TEST);

		this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ZERO);
		this._gl.disable(this._gl.BLEND);

		this._gl.drawElements(this._gl.LINES, this._lineCnt, this._gl.UNSIGNED_SHORT, 0);
	}
	addGui(gui) {
		let normalHelperFolder = gui.addFolder('normal helper');
		normalHelperFolder.add(this, 'visible').listen();
	}
	_updateModelMatrix() {
		mat4.copy(this._modelMatrix, this._shape.modelMatrix);
		return this;
	}
	_makeProgram() {
		this._program = new Program(this._gl, baseVertSrc, baseFragSrc);
		this._lineProgram = new Program(this._gl, lineVertSrc, lineFragSrc);
	}
	_makeBuffer() {
		if (this._isGl2) {
			this._vao = new VAO(this._gl);
			this._vao.bind();
		}

		const vertices = this._shape.getVertice();
		this._positionBuffer = new ArrayBuffer(this._gl, vertices);
		this._positionBuffer.setAttribs('position', 3);

		const normals = this._shape.getNormals();
		this._normalBuffer = new ArrayBuffer(this._gl, normals);
		this._normalBuffer.setAttribs('normal', 3);

		if (this._vao) {
			this._positionBuffer.bind().attribPointer(this._program);
			this._normalBuffer.bind().attribPointer(this._program);
		}

		this._pointNum = this._positionBuffer.dataArray.length / 3;
		let lineVertices = new Float32Array(vertices.length * 2);
		let normalVertices = new Float32Array(normals.length * 2);
		let sides = new Float32Array(vertices.length / 3 * 2);
		let indices = [];

		for (let ii = 0; ii < this._pointNum; ii++) {
			lineVertices[6 * ii] = vertices[3 * ii];
			lineVertices[6 * ii + 1] = vertices[3 * ii + 1];
			lineVertices[6 * ii + 2] = vertices[3 * ii + 2];

			lineVertices[6 * ii + 3] = vertices[3 * ii];
			lineVertices[6 * ii + 4] = vertices[3 * ii + 1];
			lineVertices[6 * ii + 5] = vertices[3 * ii + 2];

			normalVertices[6 * ii] = normals[3 * ii];
			normalVertices[6 * ii + 1] = normals[3 * ii + 1];
			normalVertices[6 * ii + 2] = normals[3 * ii + 2];

			normalVertices[6 * ii + 3] = normals[3 * ii];
			normalVertices[6 * ii + 4] = normals[3 * ii + 1];
			normalVertices[6 * ii + 5] = normals[3 * ii + 2];

			sides[2 * ii] = 0;
			sides[2 * ii + 1] = 1;

			indices.push(2 * ii);
			indices.push(2 * ii + 1);
		}

		this._linePositionBuffer = new ArrayBuffer(this._gl, lineVertices);
		this._linePositionBuffer.setAttribs('position', 3);

		this._lineNormalBuffer = new ArrayBuffer(this._gl, normalVertices);
		this._lineNormalBuffer.setAttribs('normal', 3);

		this._lineSideBuffer = new ArrayBuffer(this._gl, sides);
		this._lineSideBuffer.setAttribs('side', 1);

		this._lineIndexBuffer = new IndexArrayBuffer(this._gl, new Uint16Array(indices));
		this._lineCnt = this._lineIndexBuffer.dataArray.length;
	}
}
