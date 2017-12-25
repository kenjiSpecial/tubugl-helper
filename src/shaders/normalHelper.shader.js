export const baseVertSrc = `
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

export const baseFragSrc = `
precision mediump float;

void main() {
	float alpha = clamp( 4.0 * (1.0 - distance(gl_PointCoord, vec2(0.5))/0.5 ), 0.0, 1.0);

	if(alpha < 0.001 ) discard;
    
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
}
`;

export const lineVertSrc = `
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

export const lineFragSrc = `
precision mediump float;

void main() {
    gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
}
`;
