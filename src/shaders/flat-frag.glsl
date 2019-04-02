#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;
uniform float u_Terrain;
uniform float u_Population;

in vec2 fs_Pos;
out vec4 out_Col;

float random1( vec2 p , vec2 seed) {
  return fract(sin(dot(p + seed, vec2(127.1, 311.7))) * 43758.5453);
}

float random1( vec3 p , vec3 seed) {
  return fract(sin(dot(p + seed, vec3(987.654, 123.456, 531.975))) * 85734.3545);
}

vec2 random2( vec2 p , vec2 seed) {
  return fract(sin(vec2(dot(p + seed, vec2(311.7, 127.1)), dot(p + seed, vec2(269.5, 183.3)))) * 85734.3545);
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

float fbm(float x, float y) {
  float total = 0.f;
  float persistence = 0.82f;
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

    total += abs(interpNoise2D( pos.x / 100.0  * freq, pos.y / 20.0 * freq)) * amp * roughness;
    roughness *= interpNoise2D(pos.x / 5.0  * freq, pos.y / 5.0 * freq);
//    x *= 2.0f;
//    y *= 2.0f;
//    amp *= 0.8f;
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
            vec2 point = neighbor + random2(neighbor, vec2(1.f, 1.f));
            float dist = distance(pos, point);

            if( dist < m_dist ) {
                m_dist = dist;
                m_point = point;
            }
        }
    }
    return m_dist;
}

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

float fbm3d(float x, float y, float z) {
  float total = 0.f;
  float persistence = 0.5f;
  int octaves = 15;

  vec3 pos = vec3(x, y, z);

  for (int i = 0; i < octaves; i++) {
    float freq = pow(2.0, float(i));
    float amp = pow(persistence, float(i));
    total += abs(interpNoise3D( pos.x / 80.0  * freq, pos.y / 10.0 * freq, pos.z / 20.0 * freq)) * amp;
  }
  return  total;
}

float getTerrainHeight(float x, float y) {
    float result = log(fbm(x * 1.8, y * 1.8) + 0.5);
    //result = 1.0 - pow(fbm(x * 1.5, y * 1.5), 1.5);
    return result;
}

float getPopulationDensity(float x, float y, float terrainHeight) {
  //Population density. Denser population should be lighter in color.
  // population density is zero if is water
    float scale = 40.0;
    float result = (1.0 - worley(x * 100.0 , y * 100.0 , scale) * 1.2) * terrainHeight / 1.5 + terrainHeight;
    if (terrainHeight < 0.20) {
        result = 0.0;
    }
    return result - 0.15;
}

vec3 getTerrainColor(float terrainHeight) {
   //Terrain elevation, setting anything below a certain height to water.
   //Higher elevation should be lighter in color.
    vec3 result;
    vec3 waterCol = vec3(6.0 / 255.0, 42.0 / 255.0, 76.0 / 255.0);
    vec3 landCol = vec3(68.0 / 255.0, 100.0 / 255.0, 11.0 / 255.0);
    if (terrainHeight < 0.20) {
        //water
        result = waterCol * terrainHeight * 5.0;
    } else {
        // land
        result = landCol * terrainHeight * 5.0;
    }
    return result;
}




void main() {
  vec2 pos = fs_Pos.xy;
  float terrainHeight = getTerrainHeight(pos.x * 5.0, pos.y * 5.0);
  float populationDensity = getPopulationDensity(pos.x, pos.y, terrainHeight);
  //out_Col = vec4(0.5 * (fs_Pos + vec2(1.0)), 0.0, 1.0);
  vec3 terrainCol = getTerrainColor(terrainHeight);
  out_Col = vec4(terrainCol, populationDensity);
}
