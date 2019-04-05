#version 300 es
precision highp float;

// The vertex shader used to render the background of the scene

in vec4 vs_Pos;
out vec2 fs_Pos;

void main() {
  fs_Pos = vs_Pos.xy;
  gl_Position =vec4(vs_Pos.x, vs_Pos.y, vs_Pos.z, vs_Pos.w);
}
