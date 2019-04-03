#version 300 es
precision highp float;
uniform mat4 u_ViewProj;
uniform sampler2D u_Texture;




in vec4 vs_Pos;
out vec2 fs_Pos;

void main() {
  fs_Pos = vs_Pos.xz;
    vec3 pos = vec3(vs_Pos.x, 0.0, vs_Pos.z) * 100.0;

    vec2 uv = vec2(0.5 * (fs_Pos.x + 1.0), 0.5 * (fs_Pos.y + 1.0));
      vec4 textureCol = texture(u_Texture, uv);

        if (textureCol.g <= textureCol.b) {
            pos.y = pos.y - 2.0;
          }

  gl_Position = u_ViewProj * vec4(pos, 1.0);
}
