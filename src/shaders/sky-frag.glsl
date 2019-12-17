#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;
uniform mat4 u_ViewProjInv;


in vec2 fs_Pos;
out vec4 out_Col;

float FOVY = radians(45.0);
float EPSILON = 0.01;
vec3 l_sha = normalize(vec3(-1.0,0.8,-0.7));
vec3 lig = normalize(vec3(-1.0,0.8,0.7));


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
  int octaves = 15;

  //vec3 pos = vec3(x, y, z);

  for (int i = 0; i < octaves; i++) {
    float freq = pow(2.0, float(i));
    float amp = pow(persistence, float(i));
    total += abs(interpNoise3D( pos.x / 80.0  * freq, pos.y / 10.0 * freq, pos.z / 20.0 * freq)) * amp;
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


// Perlin Noise
float falloff(float t) {
  t = t * t * t * (t * (t * 6. - 15.) + 10.);
  return t;
}

vec2 randGrad(vec2 pos, vec2 seed) {
  float randDeg = random1(pos, seed) * 3.1415 * 2.0;
  return vec2(cos(randDeg), sin(randDeg));
}

float perlin(vec2 pos, float scale) {
    pos = pos / scale;
    vec2 pCell = floor(pos);
    pos = pos - pCell;
    float dotGrad00 = dot(randGrad(pCell + vec2(0.0, 0.0), vec3(0.0).xz), pos - vec2(0.0, 0.0));
    float dotGrad01 = dot(randGrad(pCell + vec2(0.0, 1.0), vec3(0.0).xz), pos - vec2(0.0, 1.0));
    float dotGrad10 = dot(randGrad(pCell + vec2(1.0, 0.0), vec3(0.0).xz), pos - vec2(1.0, 0.0));
    float dotGrad11 = dot(randGrad(pCell + vec2(1.0, 1.0), vec3(0.0).xz), pos - vec2(1.0, 1.0));

    return mix(mix(dotGrad00, dotGrad10, falloff(pos.x)), mix(dotGrad01, dotGrad11, falloff(pos.x)), falloff(pos.y)) + 0.5;
}

float fbmPerlin(vec2 pos, float cell, int it) {
    float sum = 0.;
    float noise = 0.;
    for (int i = 0; i < it; i++) {
        noise += perlin(pos, cell * pow(2.0, float(i))) / pow(2.0, float(it - i));
        sum += 1. / pow(2., float(it - i));
    }
    noise = noise / sum;
    return noise;
}


// a function that uses the NDC coordinates of the current fragment (i.e. its fs_Pos value) and projects a ray from that pixel.
vec3 castRay(vec3 eye) {
    float len = length(u_Ref - eye);
    vec3 F = normalize(u_Ref - eye);
    vec3 R = normalize(cross(F, u_Up));
    float aspect = u_Dimensions.x / u_Dimensions.y;
    float alpha = FOVY / 2.0;
    vec3 V = u_Up * len * tan(alpha);
    vec3 H = R * len * aspect * tan(alpha);

    vec3 point = u_Ref + (fs_Pos.x * H + fs_Pos.y * V);
    vec3 ray_dir = normalize(point - eye);


    return ray_dir;
}


//rotate
mat2 rot(float a){
	return mat2(cos(a), -sin(a), sin(a), cos(a));

}


vec3 lig1 = normalize(vec3(0.7,0.1,0.4));
vec3 lig2 = normalize(vec3(0.7,0.3,0.4));
vec3 sundir = normalize(vec3(1.0,0.75,1.0));

vec3 backgroundColor(vec3 dir ) {
    vec3 point = u_Eye + sin(u_Time)  * dir;
	float sun = clamp(dot(sundir, dir), 0.0, 1.0 );
	vec3 col = mix(vec3(0.78,0.78,0.7), vec3(0.3,0.4,0.5), fs_Pos.y * 0.5 + 0.5);
	col += 0.5 * vec3(1.0,0.5,0.1) * pow(sun, 8.0);
	//col *= 0.95;

	vec3 highlight = col;
	float yScale = (0.5 * (fs_Pos.y + 1.0));
    float textureMap = worley(fs_Pos.x * 200.0, fs_Pos.y * 200.0 ,180.0) - 0.15 * fbm3d(point);
    vec3 cloudColor = vec3(1.0, 1.0, 1.0);
    float cloudMap = (1.5 - fbm(fs_Pos.x / (3.0*  yScale * yScale) * 100.0, 100.0 * fs_Pos.y/1000.0 / (1.0 * yScale * yScale))) * yScale * yScale;
    vec3 color = textureMap * (highlight) + (1.0 - textureMap) * (col);
    color = cloudMap * (cloudColor) + (1.0 - cloudMap) * color;


    float  cloud = fbmPerlin(dir.xz * 2.0 / (dir.y ), 0.05, 3) * smoothstep(0.0, 0.8, dir.y);
     color = mix(color, vec3(1.), smoothstep(0.2, 0.7, cloud) * 0.8);

	return color;
}




mat3 setCamera(vec3 ro, vec3 ta, float cr)
{
	vec3 cw = normalize(ta-ro);
	vec3 cp = vec3(sin(cr), cos(cr),0.0);
	vec3 cu = normalize( cross(cw,cp) );
	vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

void main() {
    vec3 ro = vec3(0.0, 0.0, -2.0);


  vec3 rd = setCamera(ro, u_Eye, 0.0) * normalize(vec3(fs_Pos.xy, 1.5));
  vec3 dir = castRay(ro);
  vec3 color  = backgroundColor(rd);
  //color = skyColor(u_Eye,dir);
  vec3 backgroundCol = color;

    // distance fog
    float fog = clamp(smoothstep(20.0, 120.0, length(fs_Pos)), 0.0, 1.0); // Distance fog

 	// contrast
 	color = color*color*(3.0-2.0*color);

 	// saturation
   color = mix( color, vec3(dot(color,vec3(0.40))), -0.5 );

    // //VIGNETTE
    // float fallOff = 0.25;
    // vec2 uv = gl_FragCoord.xy / u_Dimensions.xy;
   	// vec2 coord = (uv - 0.5) * (u_Dimensions.x/u_Dimensions.y) * 2.0;
    // float rf = sqrt(dot(coord, coord)) * fallOff;
    // float rf2_1 = rf * rf + 1.0;
    // float e = 1.0 / (rf2_1 * rf2_1);
    // color = color * e;

    out_Col = vec4(mix(color, vec3(205.0 / 255.0, 233.0 / 255.0, 1.0) ,fog), 1.0 );
}
