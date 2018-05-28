'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var tubuglCore = require('tubugl-core');
var glMatrix = require('gl-matrix/src/gl-matrix');
var tubugl2dShape = require('tubugl-2d-shape');
var chroma = _interopDefault(require('chroma-js'));
var glMatrix$1 = require('gl-matrix');

var baseVertSrc = "\nattribute vec3 position;\nattribute vec3 normal;\n\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform mat4 modelMatrix;\n\nvarying vec3 vBarycentricPosition;\n\nvoid main() {\n\tgl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position + normal * 3., 1.0);\n\tgl_PointSize = 6.;\n}\n";

var baseFragSrc = "\nprecision mediump float;\n\nvoid main() {\n\tfloat alpha = clamp( 4.0 * (1.0 - distance(gl_PointCoord, vec2(0.5))/0.5 ), 0.0, 1.0);\n\n\tif(alpha < 0.001 ) discard;\n    \n    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);\n}\n";

var lineVertSrc = "\nattribute vec3 position;\nattribute vec3 normal;\nattribute float side;\n\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform mat4 modelMatrix;\n\nuniform float lineLength;\n\nvarying vec3 vBarycentricPosition;\n\nvoid main() {\n\tgl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position + normal * lineLength * side, 1.0);\n}\n";

var lineFragSrc = "\nprecision mediump float;\n\nvoid main() {\n    gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);\n}\n";

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var NormalHelper = function () {
	function NormalHelper(gl, shape) {
		var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
		classCallCheck(this, NormalHelper);


		this.visible = true;

		this._gl = gl;
		this._shape = shape;
		this._isGl2 = !!params.isGL2;
		this._modelMatrix = glMatrix.mat4.create();
		this._lineLength = 20;
		this._makeProgram();
		this._makeBuffer();
	}

	createClass(NormalHelper, [{
		key: 'render',
		value: function render(camera) {
			if (!this.visible) return;

			this._updateModelMatrix();
			this.updateDot(camera).drawDot();
			this.updateLine(camera).drawLine();
		}
	}, {
		key: 'updateDot',
		value: function updateDot(camera) {
			this._program.bind();

			if (this._vao) {
				this._vao.bind();
			} else {
				this._positionBuffer.bind().attribPointer(this._program);
				this._normalBuffer.bind().attribPointer(this._program);
			}

			this._gl.uniformMatrix4fv(this._program.getUniforms('modelMatrix').location, false, this._modelMatrix);
			this._gl.uniformMatrix4fv(this._program.getUniforms('viewMatrix').location, false, camera.viewMatrix);
			this._gl.uniformMatrix4fv(this._program.getUniforms('projectionMatrix').location, false, camera.projectionMatrix);

			return this;
		}
	}, {
		key: 'updateLine',
		value: function updateLine(camera) {
			this._lineProgram.bind();

			this._linePositionBuffer.bind().attribPointer(this._lineProgram);
			this._lineNormalBuffer.bind().attribPointer(this._lineProgram);
			this._lineSideBuffer.bind().attribPointer(this._lineProgram);
			this._lineIndexBuffer.bind();

			this._gl.uniform1f(this._lineProgram.getUniforms('lineLength').location, this._lineLength);

			this._gl.uniformMatrix4fv(this._lineProgram.getUniforms('modelMatrix').location, false, this._modelMatrix);
			this._gl.uniformMatrix4fv(this._lineProgram.getUniforms('viewMatrix').location, false, camera.viewMatrix);
			this._gl.uniformMatrix4fv(this._lineProgram.getUniforms('projectionMatrix').location, false, camera.projectionMatrix);

			return this;
		}
	}, {
		key: 'drawDot',
		value: function drawDot() {
			this._gl.disable(this._gl.CULL_FACE);
			this._gl.enable(this._gl.DEPTH_TEST);

			this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE);
			this._gl.enable(this._gl.BLEND);

			this._gl.drawArrays(this._gl.POINTS, 0, this._pointNum);
		}
	}, {
		key: 'drawLine',
		value: function drawLine() {
			this._gl.disable(this._gl.CULL_FACE);
			this._gl.enable(this._gl.DEPTH_TEST);

			this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ZERO);
			this._gl.disable(this._gl.BLEND);

			this._gl.drawElements(this._gl.LINES, this._lineCnt, this._gl.UNSIGNED_SHORT, 0);
		}
	}, {
		key: 'addGui',
		value: function addGui(gui) {
			var normalHelperFolder = gui.addFolder('normal helper');
			normalHelperFolder.add(this, 'visible').listen();
		}
	}, {
		key: '_updateModelMatrix',
		value: function _updateModelMatrix() {
			glMatrix.mat4.copy(this._modelMatrix, this._shape.modelMatrix);
			return this;
		}
	}, {
		key: '_makeProgram',
		value: function _makeProgram() {
			this._program = new tubuglCore.Program(this._gl, baseVertSrc, baseFragSrc);
			this._lineProgram = new tubuglCore.Program(this._gl, lineVertSrc, lineFragSrc);
		}
	}, {
		key: '_makeBuffer',
		value: function _makeBuffer() {
			if (this._isGl2) {
				this._vao = new tubuglCore.VAO(this._gl);
				this._vao.bind();
			}

			var vertices = this._shape.getVertice();
			this._positionBuffer = new tubuglCore.ArrayBuffer(this._gl, vertices);
			this._positionBuffer.setAttribs('position', 3);

			var normals = this._shape.getNormals();
			this._normalBuffer = new tubuglCore.ArrayBuffer(this._gl, normals);
			this._normalBuffer.setAttribs('normal', 3);

			if (this._vao) {
				this._positionBuffer.bind().attribPointer(this._program);
				this._normalBuffer.bind().attribPointer(this._program);
			}

			this._pointNum = this._positionBuffer.dataArray.length / 3;
			var lineVertices = new Float32Array(vertices.length * 2);
			var normalVertices = new Float32Array(normals.length * 2);
			var sides = new Float32Array(vertices.length / 3 * 2);
			var indices = [];

			for (var ii = 0; ii < this._pointNum; ii++) {
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

			this._linePositionBuffer = new tubuglCore.ArrayBuffer(this._gl, lineVertices);
			this._linePositionBuffer.setAttribs('position', 3);

			this._lineNormalBuffer = new tubuglCore.ArrayBuffer(this._gl, normalVertices);
			this._lineNormalBuffer.setAttribs('normal', 3);

			this._lineSideBuffer = new tubuglCore.ArrayBuffer(this._gl, sides);
			this._lineSideBuffer.setAttribs('side', 1);

			this._lineIndexBuffer = new tubuglCore.IndexArrayBuffer(this._gl, new Uint16Array(indices));
			this._lineCnt = this._lineIndexBuffer.dataArray.length;
		}
	}]);
	return NormalHelper;
}();

var baseVertSrc$1 = "\nprecision mediump float;\nattribute vec4 position;\n\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform mat4 modelMatrix;\n\nvoid main() {\n    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;\n}\n";
var baseFragSrc$1 = "\nprecision mediump float;\nuniform vec3 uColor;\n\nvoid main(){\n    gl_FragColor = vec4(uColor, 1.0);\n}\n";

var axisVertSrc = "\nattribute float rate;\n\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform mat4 modelMatrix;\n\nuniform vec3 uStartPosition;\nuniform vec3 uDir;\nuniform float uLength;\n\nvoid main() {\n\tvec4 targetPos = vec4(uStartPosition + uDir * rate * uLength, 1.0);\n    gl_Position = projectionMatrix * viewMatrix * modelMatrix * targetPos;\n}\n";

var GridHelper = function (_Plane) {
	inherits(GridHelper, _Plane);

	function GridHelper(gl) {
		var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
		var width = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 100;
		var height = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 100;
		var segmentW = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
		var segmentH = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
		classCallCheck(this, GridHelper);

		params.isWire = true;

		var _this = possibleConstructorReturn(this, (GridHelper.__proto__ || Object.getPrototypeOf(GridHelper)).call(this, gl, params, width, height, segmentW, segmentH));

		_this.visible = true;
		_this.rotation.x = Math.PI / 2;

		_this._color = params.color ? params.color : '#ffffff';
		_this._glColor = chroma(_this._color).gl();

		_this._makeAxis(params);
		return _this;
	}

	createClass(GridHelper, [{
		key: 'updateColor',
		value: function updateColor(color) {
			this._color = color;
			this._glColor = chroma(this._color).gl();
		}
	}, {
		key: 'render',
		value: function render(camera) {
			if (!this.visible) return;

			this._updateModelMatrix();
			this.updateWire(camera).drawWireframe();

			this.updateAxis(camera).drawAxis(-this._width / 2, -this._height / 2).drawAxis(this._width / 2, this._height / 2);
		}
	}, {
		key: 'updateWire',
		value: function updateWire(camera) {
			get(GridHelper.prototype.__proto__ || Object.getPrototypeOf(GridHelper.prototype), 'updateWire', this).call(this, camera);
			this._gl.uniform3f(this._wireframeProgram.getUniforms('uColor').location, this._glColor[0], this._glColor[1], this._glColor[2]);

			return this;
		}
	}, {
		key: 'updateAxis',
		value: function updateAxis(camera) {
			this._axisProgram.bind();
			this._axisRateBuffer.bind().attribPointer(this._axisProgram);

			this._gl.uniformMatrix4fv(this._axisProgram.getUniforms('modelMatrix').location, false, this._axisModelMat);
			this._gl.uniformMatrix4fv(this._axisProgram.getUniforms('viewMatrix').location, false, camera.viewMatrix);
			this._gl.uniformMatrix4fv(this._axisProgram.getUniforms('projectionMatrix').location, false, camera.projectionMatrix);

			this._gl.uniform1f(this._axisProgram.getUniforms('uLength').location, this._axisSize);

			return this;
		}
	}, {
		key: 'drawAxis',
		value: function drawAxis() {
			var _this2 = this;

			var posX = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
			var posZ = arguments[1];

			this._gl.uniform3f(this._axisProgram.getUniforms('uStartPosition').location, posX + this.position.x, 2 + this.position.y, posZ + this.position.z);

			[[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(function (arr) {
				_this2._gl.uniform3f(_this2._axisProgram.getUniforms('uDir').location, arr[0], arr[1], arr[2]);
				_this2._gl.uniform3f(_this2._axisProgram.getUniforms('uColor').location, arr[0], arr[1], arr[2]);
				_this2._gl.drawArrays(_this2._gl.LINES, 0, _this2._axisCnt);
			});

			return this;
		}
	}, {
		key: 'addGui',
		value: function addGui(gui) {
			var gridHelperGui = gui.addFolder('gridHelper');
			gridHelperGui.add(this, 'visible');

			var gridHelperPositionGui = gridHelperGui.addFolder('position');
			gridHelperPositionGui.add(this.position, 'x', -100, 100);
			gridHelperPositionGui.add(this.position, 'y', -100, 100);
			gridHelperPositionGui.add(this.position, 'z', -100, 100);
		}
	}, {
		key: '_makeWireframe',
		value: function _makeWireframe() {
			this._wireframeProgram = new tubuglCore.Program(this._gl, baseVertSrc$1, baseFragSrc$1);
		}
	}, {
		key: '_makeAxis',
		value: function _makeAxis(params) {
			this._axisProgram = new tubuglCore.Program(this._gl, axisVertSrc, baseFragSrc$1);
			this._axisRateBuffer = new tubuglCore.ArrayBuffer(this._gl, new Float32Array([0, 1]));
			this._axisRateBuffer.setAttribs('rate', 1);
			this._axisCnt = 2;
			this._axisSize = params.axisSize ? params.axisSize : 150;
			this._axisModelMat = glMatrix$1.mat4.create();
		}
	}]);
	return GridHelper;
}(tubugl2dShape.Plane);

var GridHelper2 = function () {
	function GridHelper2(gl) {
		var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
		var width = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1000;
		var height = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1000;
		var widthSegments = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 10;
		var heightSegments = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 10;
		classCallCheck(this, GridHelper2);

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

		this._plane = new CustomPlane(this._gl, {
			vertexShaderSrc: baseVertSrc$1,
			fragmentShaderSrc: baseFragSrc$1,
			fillColor: this._glFillColor
		}, width, height);
		this._plane.position.y = -0.1;

		this._linePlane = new LinePlane(this._gl, { color: this._glLineColor }, width, height, widthSegments, heightSegments);
	}

	createClass(GridHelper2, [{
		key: 'updateColor',
		value: function updateColor(color) {
			this._color = color;
			this._glColor = chroma(this._color).gl();
		}
	}, {
		key: 'render',
		value: function render(camera) {
			this._plane.render(camera);
			this._linePlane.render(camera, this._plane.getModelMatrix());
		}
	}, {
		key: 'addGui',
		value: function addGui(gui) {
			var gridHelperGui = gui.addFolder('gridHelper');
			gridHelperGui.add(this, 'visible');

			var gridHelperPositionGui = gridHelperGui.addFolder('position');
			gridHelperPositionGui.add(this._plane.position, 'x', -100, 100);
			gridHelperPositionGui.add(this._plane.position, 'y', -100, 100);
			gridHelperPositionGui.add(this._plane.position, 'z', -100, 100);
		}
	}, {
		key: '_makeWireframe',
		value: function _makeWireframe() {
			this._wireframeProgram = new tubuglCore.Program(this._gl, baseVertSrc$1, baseFragSrc$1);
		}
	}]);
	return GridHelper2;
}();

var CustomPlane = function (_Plane) {
	inherits(CustomPlane, _Plane);

	function CustomPlane(gl) {
		var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
		var width = arguments[2];
		var height = arguments[3];
		classCallCheck(this, CustomPlane);

		var _this = possibleConstructorReturn(this, (CustomPlane.__proto__ || Object.getPrototypeOf(CustomPlane)).call(this, gl, params, width, height));

		_this.rotation.x = Math.PI / 2;
		_this._fillColor = params.fillColor;
		return _this;
	}

	createClass(CustomPlane, [{
		key: 'update',
		value: function update(camera) {
			get(CustomPlane.prototype.__proto__ || Object.getPrototypeOf(CustomPlane.prototype), 'update', this).call(this, camera);

			this._gl.uniform3f(this._program.getUniforms('uColor').location, this._fillColor[0], this._fillColor[1], this._fillColor[2]);

			return this;
		}
	}, {
		key: 'getModelMatrix',
		value: function getModelMatrix() {
			return this._modelMatrix;
		}
	}]);
	return CustomPlane;
}(tubugl2dShape.Plane);

var LinePlane = function () {
	function LinePlane(gl, params) {
		var width = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1000;
		var height = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1000;
		var widthSegments = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 10;
		var heightSegments = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 10;
		classCallCheck(this, LinePlane);

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

	createClass(LinePlane, [{
		key: '_makeProgram',
		value: function _makeProgram() {
			this._program = new tubuglCore.Program(this._gl, baseVertSrc$1, baseFragSrc$1);
		}
	}, {
		key: '_makeBuffer',
		value: function _makeBuffer() {
			var widthUnit = this._width / this._widthSegments;
			var heightUnit = this._height / this._heightSegments;
			var vertices = new Float32Array(4 * 3 * (this._widthSegments + 1 + this._heightSegments + 1));

			var width = 0.4;

			for (var ii = 0; ii <= this._widthSegments; ii++) {
				var xx = widthUnit * ii - this._halfWidth;
				var y0 = -this._halfHeight;
				var y1 = this._halfHeight;
				var scale = ii % 5 === 0 ? 5 : 1;

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

			var startNum = 12 * (this._widthSegments + 1);
			for (var _ii = 0; _ii <= this._heightSegments; _ii++) {
				var yy = heightUnit * _ii - this._halfHeight;
				var x0 = -this._halfWidth;
				var x1 = this._halfWidth;
				var _scale = _ii % 5 === 0 ? 5 : 1;

				vertices[startNum + 4 * 3 * _ii] = x0;
				vertices[startNum + 4 * 3 * _ii + 1] = yy + width / 2 * _scale;
				vertices[startNum + 4 * 3 * _ii + 2] = -0.1;

				vertices[startNum + 4 * 3 * _ii + 3] = x0;
				vertices[startNum + 4 * 3 * _ii + 4] = yy - width / 2 * _scale;
				vertices[startNum + 4 * 3 * _ii + 5] = -0.1;

				vertices[startNum + 4 * 3 * _ii + 6] = x1;
				vertices[startNum + 4 * 3 * _ii + 7] = yy - width / 2 * _scale;
				vertices[startNum + 4 * 3 * _ii + 8] = -0.1;

				vertices[startNum + 4 * 3 * _ii + 9] = x1;
				vertices[startNum + 4 * 3 * _ii + 10] = yy + width / 2 * _scale;
				vertices[startNum + 4 * 3 * _ii + 11] = -0.1;
			}

			var indices = new Uint16Array(6 * (this._widthSegments + this._heightSegments + 2));

			for (var _ii2 = 0; _ii2 < this._widthSegments + this._heightSegments * +2; _ii2++) {
				indices[6 * _ii2 + 0] = 0 + 4 * _ii2;
				indices[6 * _ii2 + 1] = 1 + 4 * _ii2;
				indices[6 * _ii2 + 2] = 2 + 4 * _ii2;

				indices[6 * _ii2 + 3] = 2 + 4 * _ii2;
				indices[6 * _ii2 + 4] = 1 + 4 * _ii2;
				indices[6 * _ii2 + 5] = 3 + 4 * _ii2;
			}

			this._positionBuffer = new tubuglCore.ArrayBuffer(this._gl, vertices);
			this._positionBuffer.setAttribs('position', 3);

			this._indexBuffer = new tubuglCore.IndexArrayBuffer(this._gl, indices);

			this._cnt = indices.length;
			// console.log(this._cnt);
		}
	}, {
		key: 'render',
		value: function render(camera, modelMatrix) {
			this.update(camera, modelMatrix).draw();
		}
	}, {
		key: 'update',
		value: function update(camera, modelMatrix) {
			this._program.use();

			this._positionBuffer.bind().attribPointer(this._program);
			this._indexBuffer.bind();

			this._gl.uniformMatrix4fv(this._program.getUniforms('modelMatrix').location, false, modelMatrix);
			this._gl.uniformMatrix4fv(this._program.getUniforms('viewMatrix').location, false, camera.viewMatrix);
			this._gl.uniformMatrix4fv(this._program.getUniforms('projectionMatrix').location, false, camera.projectionMatrix);
			this._gl.uniform3f(this._program.getUniforms('uColor').location, this._color[0], this._color[1], this._color[2]);

			return this;
		}
	}, {
		key: 'draw',
		value: function draw() {
			this._gl.disable(this._gl.CULL_FACE);

			this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
			this._gl.enable(this._gl.BLEND);

			this._gl.drawElements(this._gl.TRIANGLES, this._cnt, this._gl.UNSIGNED_SHORT, 0);
		}
	}]);
	return LinePlane;
}();

exports.NormalHelper = NormalHelper;
exports.GridHelper = GridHelper;
exports.GridHelper2 = GridHelper2;
