#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;
uniform sampler2D u_Texture;




in vec4 fs_Col;
in vec4 fs_Pos;
in vec4 fs_Nor;
in vec4 fs_WorldPos;
in float fs_isSkyscraper;
in vec2 fs_transformCol4;
in float fs_transformCol2;
in vec2 fs_UV;
in vec4 fs_Type;





out vec4 out_Col;

vec3 l_sha = normalize(vec3(-1.0,0.8,-0.7));

float random1( vec3 p , vec3 seed) {
  return fract(sin(dot(p + seed, vec3(987.654, 123.456, 531.975))) * 85734.3545);
}

float random1( vec2 p , vec2 seed) {
  return fract(sin(dot(p + seed, vec2(127.1, 311.7))) * 43758.5453);
}

// combine height with fbm 3D
float interpNoise3D(float x, float y, float z) {
    float intX = floor(x);
    float intY = floor(y);
    float intZ = floor(z);
    float fractX = fract(x);
    float fractY = fract(y);
    float fractZ = fract(z);

    float v1 = random1(vec3(intX, intY, intZ), vec3(1.0, 1.0, 1.0));
    float v2 = random1(vec3(intX, intY, intZ + 1.0), vec3(1.0, 1.0, 1.0));
    float v3 = random1(vec3(intX + 1.0, intY, intZ + 1.0), vec3(1.0, 1.0, 1.0));
    float v4 = random1(vec3(intX + 1.0, intY, intZ), vec3(1.0, 1.0, 1.0));
    float v5 = random1(vec3(intX, intY + 1.0, intZ), vec3(1.0, 1.0, 1.0));
    float v6 = random1(vec3(intX, intY + 1.0, intZ + 1.0), vec3(1.0, 1.0, 1.0));
    float v7 = random1(vec3(intX + 1.0, intY + 1.0, intZ), vec3(1.0, 1.0, 1.0));
    float v8 = random1(vec3(intX + 1.0, intY + 1.0, intZ + 1.0), vec3(1.0, 1.0, 1.0));


    float i1 = mix(v1, v2, fractX);
    float i2 = mix(v3, v4, fractX);
    float i3 = mix(v5, v6, fractX);
    float i4 = mix(v7, v8, fractX);

    float i5 = mix(i1, i2, fractY);
    float i6 = mix(i3, i4, fractY);

    return mix(i5, i6, fractZ);
}

float fbm3d(vec3 pos) {
  float total = 0.f;
  float persistence = 0.5f;
  int octaves = 8;

  //vec3 pos = vec3(x, y, z);

  for (int i = 0; i < octaves; i++) {
    float freq = pow(2.0, float(i));
    float amp = pow(persistence, float(i));
    total += abs(interpNoise3D( pos.x / 10.0  * freq, pos.y / 10.0 * freq, pos.z / 10.0 * freq)) * amp;
  }
  return  total;
}


float interpNoise2D(float x, float y) {
    float intX = floor(x);
    float intY = floor(y);
    float fractX = fract(x);
    float fractY = fract(y);

    float v1 = random1(vec2(intX, intY), vec2(1.0, 1.0));
    float v2 = random1(vec2(intX + 1.0, intY), vec2(1.0, 1.0));
    float v3 = random1(vec2(intX, intY + 1.0), vec2(1.0, 1.0));
    float v4 = random1(vec2(intX + 1.0, intY + 1.0), vec2(1.0, 1.0));

    float i1 = mix(v1, v2, fractX);
    float i2 = mix(v3, v4, fractX);
    return mix(i1, i2, fractY);
}

float fbm(vec2 pos) {
  float total = 0.f;
  float persistence = 0.5f;
  int octaves = 8;
  float roughness = 1.0;

  vec2 shift = vec2(100.0);

  mat2 rot = mat2(cos(0.5), sin(0.5),
                      -sin(0.5), cos(0.50));

  for (int i = 0; i < octaves; i++) {
    float freq = pow(2.0, float(i));
    float amp = pow(persistence, float(i));

    pos = rot * pos * 1.0 + shift;

    total += abs(interpNoise2D( pos.x / 100.0  * freq * sin(u_Time * 0.1), pos.y / 200.0 * freq)) * amp * roughness;
    roughness *= interpNoise2D(pos.x / 5.0  * freq, pos.y / 5.0 * freq);
  }
  return  total;
}

float fbm(float x, float y) {
  float total = 0.f;
  float persistence = 0.5f;
  int octaves = 8;
  float roughness = 1.0;

  vec2 pos = vec2(x, y);
  vec2 shift = vec2(100.0);

  mat2 rot = mat2(cos(0.5), sin(0.5),
                      -sin(0.5), cos(0.50));

  for (int i = 0; i < octaves; i++) {
    float freq = pow(2.0, float(i));
    float amp = pow(persistence, float(i));

    pos = rot * pos * 1.0 + shift;

    total += abs(interpNoise2D( pos.x / 100.0  * freq * sin(u_Time * 0.1), pos.y / 200.0 * freq)) * amp;
  }
  return  total;
}


float worley(float x, float y, float scale) {
    float scale_invert = abs(80.0 - scale);
    vec2 pos = vec2(x/scale_invert, y/scale_invert);

    float m_dist = 40.f;  // minimun distance
    vec2 m_point = vec2(0.f, 0.f);       // minimum point

    for (int j=-1; j<=1; j++ ) {
        for (int i=-1; i<=1; i++ ) {
            vec2 neighbor = vec2(floor(pos.x) + float(j), floor(pos.y) + float(i));
            vec2 point = neighbor + random1(neighbor, vec2(1.f, 1.f));
            float dist = distance(pos, point);

            if( dist < m_dist ) {
                m_dist = dist;
                m_point = point;
            }
        }
    }
    return m_dist;
}

vec3 tall(vec2 uv) {
    // color roof
    if (fs_Nor.y > 0.99) {
        return vec3(0.4, 0.4, 0.4);
    }

    else {
        vec3 color = vec3(0.01 * worley(fs_WorldPos.x, fs_WorldPos.y, 80.0),
         0.01 * worley(fs_WorldPos.x, fs_WorldPos.y, 80.0),
          0.01 * worley(fs_WorldPos.x, fs_WorldPos.y, 80.0));
        color *= (1.0 - pow(sin(fs_WorldPos.x * 100.0), 4.0));
        color *= (pow(sin(fs_WorldPos.y * 50.0), 2.0));

        return color;
    }
}

vec3 mini(vec2 uv) {
    // color roof
    if (fs_Nor.y > 0.30) {
        return vec3(140.0/255.0, 62.0/255.0,3.0/255.0);
    }
     else {
            vec3 color = vec3(0.04 * worley(fs_WorldPos.x, fs_WorldPos.y, 80.0),
             0.025 * worley(fs_WorldPos.x, fs_WorldPos.y, 80.0),
              0.02 * worley(fs_WorldPos.x, fs_WorldPos.y, 80.0));
            color *= (1.0 -pow(sin(fs_WorldPos.y* 10.0), 2.0));
            color *= (pow(cos(fs_WorldPos.t* 50.0), 2.0));

            return color;
        }
}




vec3 getShading(vec3 pos , vec3 lightp, vec3 color, vec3 norm)
{
    vec3 lightdir = normalize(lightp - pos);

    float sha = 0.0;
    float dif = max(dot(norm,l_sha),0.0);


    vec3 amb = vec3(0.2);
    vec3 diffuse = vec3(1.34, 1.07, 0.99) * pow(0.5+0.5*dot(normalize(norm), normalize(-lightdir)), 3.0);
     vec3 indirectTerm = vec3(0.16, 0.20, 0.28) * min(max(norm.y, 0.0) + 0.2, 1.0);

    //vec3 diffuseTerm = vec3(1.34, 1.07, 0.99) * min(max(dot(fs_Nor, fs_Light), 0.0) + 0.2, 1.0);


   // vec3 phong = vec3(0.2 * pow(max(dot(-lightdir, reflect(lightdir, norm)), 0.0), 20.0));

    return (amb + diffuse + indirectTerm) * color ;
}

void main()
{

 vec2 uv = vec2(0.5 * (fs_Pos.x + 1.0), 0.5 * (fs_Pos.y + 1.0));
  vec4 textureCol = texture(u_Texture, uv);
    vec3 color = vec3(0.0);
    vec3 lightPos = vec3(0.0, 5.0, 1.0);
        vec3 lightPos2 = vec3(2.0, 3.0, 10.0);
    vec3 lightColor = vec3(1.0,0.97,0.93);
   // vec3 light1 = getShading(fs_WorldPos.xyz, lightPos, lightColor, fs_Nor.xyz);


    //vec2 uv = gl_FragCoord.xy / u_Dimensions.xy;
     uv = fs_UV * 2000.0;
    //float dist = 1.0 - (length(fs_Pos.xyz) * 2.0);
    //out_Col = vec4(dist) * fs_Col;
    //out_Col = vec4(0.9, 0.9, 0.9, 1.0);
    float rand = random1(fs_transformCol4.xy, vec2(0.0, 0.0));
    float val = floor(mod(fs_WorldPos.y + 10.0 * rand, 20.0));
    	if (mod(val, 2.0) == 0.0) {
    		if (fs_WorldPos.y < fs_transformCol2 - 1.0) {
    			color = clamp(3.0 * color + vec3(0.4, 0.4, 0.2), 0.0, 0.9);
    		}
    	}

    	color = clamp(color + fbm3d(vec3(fs_WorldPos.x, fs_WorldPos.y, fs_WorldPos.z)) / 100.0, 0.0, 1.0);
        if (fs_Type.z < 0.5) {
            vec3 building = mini(uv);
            //building += vec3(textureCol.a);
            vec3 light = getShading(fs_WorldPos.xyz, lightPos, lightColor, fs_Nor.xyz);
            vec3 light2 = getShading(fs_WorldPos.xyz, lightPos2, lightColor, fs_Nor.xyz);

                          vec3 color = pow((light + light2) *building.rgb, vec3(1.0 / 2.2));

             out_Col = vec4(color, 1.0);

        } else {
            vec3 skyscraperCol = tall(uv);
            //skyscraperCol += vec3(textureCol.a);

            vec3 light = getShading(fs_WorldPos.xyz, lightPos, lightColor, fs_Nor.xyz);
                        vec3 light2 = getShading(fs_WorldPos.xyz, lightPos2, lightColor, fs_Nor.xyz);

              vec3 color = pow((light+ light2) *skyscraperCol.rgb, vec3(1.0 / 2.2));
             out_Col = vec4(color, 1.0);        }

}

