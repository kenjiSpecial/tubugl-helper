export const baseVertSrc = `
precision mediump float;
attribute vec4 position;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
}
`;
export const baseFragSrc = `
precision mediump float;
uniform vec3 uColor;

void main(){
    gl_FragColor = vec4(uColor, 1.0);
}
`;

export const axisVertSrc = `
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
