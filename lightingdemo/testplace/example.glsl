#define GLSLIFY 1
attribute vec4 aPosition;
attribute vec4 aNormal;
uniform mat4 u_vpMatrix;
uniform mat4 u_modelMatrix;
varying vec3 vnormal;
varying vec3 vposition;
void main() {
    gl_Position = u_vpMatrix * u_modelMatrix * aPosition;
    vnormal = vec3(transpose(inverse(u_modelMatrix)) * aNormal);
    vposition = vec3(u_modelMatrix * aPosition);
}


precision highp float;
#define GLSLIFY 1
layout (location = 0)
varying vec4 FragColor;
layout (location = 1)
varying vec4 BrightColor;
struct Light {
    vec3 Position;
    vec4 Color;
};
uniform Light lights[4];
uniform vec3 u_ambientColor;
uniform vec4 u_color;
uniform vec3 u_viewPosition;
uniform float u_shininess;
attribute vec3 vnormal;
attribute vec3 vposition;
const float constantAtt = 1.0;
const float linearAtt = 0.14;
const float quadraticAtt = 0.07;
void main() {
    vec3 normal = normalize(vnormal);
    vec3 viewDirection = normalize(u_viewPosition - vposition);
    vec3 lighting = vec3(0.0); for (int i = 0; i < 4; i++) {
        vec3 pos = lights[i].Position;
        vec4 color = lights[i].Color;
        vec3 lightDir = normalize(pos - vposition);
        float cosTheta = max(dot(lightDir, normal), 0.0);
        vec3 diffuse = u_color.rgb * cosTheta * u_color.a;
        if (u_color.a <= 1.0) diffuse *= color.rgb;
        vec3 halfwayDir = normalize(pos + viewDirection);
        float specularIntensity = pow(max(dot(normal, halfwayDir), 0.0), u_shininess);
        vec3 specular = color.rgb * specularIntensity;
        float att = 0.0;
        if (cosTheta > 0.0){
            float dis = length(pos - vposition);
            att = 1.0/(constantAtt + linearAtt * dis + quadraticAtt * dis * dis);
        }
        lighting += (diffuse + specular);
    }
    vec3 ambient = u_ambientColor * u_color.rgb * u_color.a;
    vec3 result = ambient + lighting;
    float brightness = dot(result, vec3(0.2126, 0.7152, 0.0722));
    if (brightness > 1.0){
        BrightColor = vec4(result, 1.0);
    } else {
        BrightColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
    FragColor = vec4(result, 1.0);
}


//2
precision highp float;
#define GLSLIFY 1
uniform sampler2D image;
uniform bool horizontal;
attribute vec2 texcoord;
varying vec4 FragColor;
const float weight[5] = float[](0.2270270270, 0.1945945946, 0.1216216216, 0.0540540541, 0.0162162162);
void main() {
    vec2 tex_offset = vec2(2.0 / float(textureSize(image, 0)));
    vec3 result = texture(image, texcoord).rgb * weight[0];
    if (horizontal) {
        for (int i = 0; i < 5; ++i) {
            result += texture(image, texcoord + vec2(tex_offset.x * float(i), 0.0)).rgb * weight[i];
            result += texture(image, texcoord - vec2(tex_offset.x * float(i), 0.0)).rgb * weight[i];
        } } else {
        for (int i = 0; i < 5; ++i) {
            result += texture(image, texcoord + vec2(0.0, tex_offset.y * float(i))).rgb * weight[i];
            result += texture(image, texcoord - vec2(0.0, tex_offset.y * float(i))).rgb * weight[i];
        }
    }      FragColor = vec4 (result, 1.0);
}


//3
precision highp float;
#define GLSLIFY 1
attribute vec2 texcoord;
uniform sampler2D image;
uniform sampler2D imageBlur;
uniform bool bloom;  varying vec4 FragColor;
const float exposure = 1.0;
const float gamma = 2.2;
void main() {
    vec3 hdrColor = texture(image, texcoord).rgb;
    vec3 bloomColor = texture(imageBlur, texcoord).rgb;
    if (bloom)          hdrColor += bloomColor;
    // vec3 result = hdrColor / (hdrColor + vec3(1.0));
    vec3 result = vec3 (1.0) - exp(-hdrColor * exposure);
    // result = pow(result, vec3 (1.0 / gamma));
    FragColor = vec4(result, 1.0);
}

