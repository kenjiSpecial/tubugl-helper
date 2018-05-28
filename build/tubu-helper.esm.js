import { Program, VAO, ArrayBuffer, IndexArrayBuffer } from 'tubugl-core';
import { mat4 } from 'gl-matrix/src/gl-matrix';
import { Plane } from 'tubugl-2d-shape';
import chroma from 'chroma-js';
import { mat4 as mat4$1 } from 'gl-matrix';

const baseVertSrc = `
attribute vec3 position;
attribute vec3 normal;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

varying vec3 vBarycentricPosition;

void main() {
	gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position + normal * 3., 1.0);
	gl_PointSize = 6.;
}
`;

const baseFragSrc = `
precision mediump float;

void main() {
	float alpha = clamp( 4.0 * (1.0 - distance(gl_PointCoord, vec2(0.5))/0.5 ), 0.0, 1.0);

	if(alpha < 0.001 ) discard;
    
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
}
`;

const lineVertSrc = `
attribute vec3 position;
attribute vec3 normal;
attribute float side;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

uniform float lineLength;

varying vec3 vBarycentricPosition;

void main() {
	gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position + normal * lineLength * side, 1.0);
}
`;

const lineFragSrc = `
precision mediump float;

void main() {
    gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
}
`;

class NormalHelper  {
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

const baseVertSrc$1 = `
precision mediump float;
attribute vec4 position;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
}
`;
const baseFragSrc$1 = `
precision mediump float;
uniform vec3 uColor;

void main(){
    gl_FragColor = vec4(uColor, 1.0);
}
`;

const axisVertSrc = `
attribute float rate;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

uniform vec3 uStartPosition;
uniform vec3 uDir;
uniform float uLength;

void main() {
	vec4 targetPos = vec4(uStartPosition + uDir * rate * uLength, 1.0);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * targetPos;
}
`;

class GridHelper extends Plane {
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
		this._wireframeProgram = new Program(this._gl, baseVertSrc$1, baseFragSrc$1);
	}

	_makeAxis(params) {
		this._axisProgram = new Program(this._gl, axisVertSrc, baseFragSrc$1);
		this._axisRateBuffer = new ArrayBuffer(this._gl, new Float32Array([0, 1]));
		this._axisRateBuffer.setAttribs('rate', 1);
		this._axisCnt = 2;
		this._axisSize = params.axisSize ? params.axisSize : 150;
		this._axisModelMat = mat4$1.create();
	}
}

class GridHelper2 {
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
				vertexShaderSrc: baseVertSrc$1,
				fragmentShaderSrc: baseFragSrc$1,
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
		this._wireframeProgram = new Program(this._gl, baseVertSrc$1, baseFragSrc$1);
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
		this._program = new Program(this._gl, baseVertSrc$1, baseFragSrc$1);
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

export { NormalHelper, GridHelper, GridHelper2 };
