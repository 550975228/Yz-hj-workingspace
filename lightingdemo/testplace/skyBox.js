{
    var gl, fsForSkyBox, vsForSkyBox, canvas, skyboxProgram;
    var then = 0;
    var positionBuffer;
}
{
    //注册鼠标事件
    var mouseDown = false;
    var lastMouseX = null;
    var lastMouseY = null;
    var angle_x = 0.0;
    var angle_y = 0.0;
    var fov = 1.5;
    var aspect = 1.0;
}
var keys = {};

function handleKeyDown(event)
{
    keys[event.keyCode] = true;
}

function handleKeyUp(event)
{
    keys[event.keyCode] = false;
}
function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseUp(event) {
    mouseDown = false;
}

function handleMouseMove(event) {
    if (!mouseDown) {
        return;
    }
    var newX = event.clientX;
    var newY = event.clientY;

    angle_x += (newY - lastMouseY) * 0.002;
    angle_y -= (newX - lastMouseX) * 0.002;

    angle_x = Math.max(Math.min(angle_x, Math.PI / 2), -Math.PI / 2);

    lastMouseX = newX
    lastMouseY = newY;

    event.preventDefault();
    requestAnimationFrame(draw);
}

function handleMouseWheel(event) {
    var delta = 0.0;
    if (event.deltaMode == 0)
        delta = event.deltaY * 0.001;
    else if (event.deltaMode == 1)
        delta = event.deltaY * 0.03;
    else
        delta = event.deltaY;

    fov *= Math.exp(-delta);
    fov = Math.max(Math.min(fov, 2.5), 0.1);

    event.preventDefault();
    requestAnimationFrame(draw);
}

function rotateXY(angle_x, angle_y) {
    var cosX = Math.cos(angle_x);
    var sinX = Math.sin(angle_x);
    var cosY = Math.cos(angle_y);
    var sinY = Math.sin(angle_y);

    return [
        cosY, 0, -sinY, 0,
        -sinX * sinY, cosX, -sinX * cosY, 0,
        cosX * sinY, sinX, cosX * cosY, 0,
        0, 0, 0, 1
    ];
}

function perspectiveMatrixInverse(fov, aspect, near, far) {
    var h = Math.tan(0.5 * fov);
    var w = h * aspect;
    var z0 = (far - near) / (-2 * far * near);
    var z1 = (far + near) / (-2 * far * near);

    return [
        w, 0, 0, 0,
        0, h, 0, 0,
        0, 0, 0, z0,
        0, 0, 1, z1
    ];
}

//矩阵乘法a*b
function mul(a, b) {
    var r = [];

    r[0] = a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12];
    r[1] = a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13];
    r[2] = a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14];
    r[3] = a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15];

    r[4] = a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12];
    r[5] = a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13];
    r[6] = a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14];
    r[7] = a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15];

    r[8] = a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12];
    r[9] = a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13];
    r[10] = a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14];
    r[11] = a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15];

    r[12] = a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12];
    r[13] = a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13];
    r[14] = a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14];
    r[15] = a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15];

    return r;
}


function main() {
    initProgramAndShader();
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setGeometry();
    loadSkyBox();
    draw();

}

function initProgramAndShader() {
    canvas = document.getElementById("canvas");
    if (!canvas) console.log("获取canvas标签失败");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl = getWebGLContext(canvas);
    if (!gl) console.log("初始化gl失败");
    fsForSkyBox = document.getElementById("fsForSkyBox").innerHTML;
    vsForSkyBox = document.getElementById("vsForSkyBox").innerHTML;
    skyboxProgram = createProgram(gl, vsForSkyBox, fsForSkyBox);
    if (!skyboxProgram) console.log("初始化着色器失败");
    //获取变量
    skyboxProgram.a_position = gl.getAttribLocation(skyboxProgram, "a_position");
    skyboxProgram.u_viewDirectionProjectionInverse = gl.getUniformLocation(skyboxProgram, "u_viewDirectionProjectionInverse");
    skyboxProgram.u_skybox = gl.getUniformLocation(skyboxProgram, "u_skybox");
    if (skyboxProgram.a_position<0 || !skyboxProgram.u_viewDirectionProjectionInverse || !skyboxProgram.u_skybox) console.log("获取数据失败");

}
function loadSkyBox() {
    var skyTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyTexture);
    const faceInfos = [
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            url: '../libs/images/posx.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            url: '../libs/images/negx.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            url: '../libs/images/posy.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            url: '../libs/images/negy.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            url: '../libs/images/posz.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            url: '../libs/images/negz.jpg',
        },
    ];

    faceInfos.forEach((faceInfo) => {
        const {target, url} = faceInfo;
        //上传贴图到面
        const level = 0;
        const internalFormat = gl.RGBA;
        const format = gl.RGBA;
        const width = 2048;
        const height = 2048;
        const type = gl.UNSIGNED_BYTE;
        //设置每个面使其可以渲染
        gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);
        //异步加载图片
        const image = new Image();
        image.src = url;
        // console.log(url);
        image.addEventListener('load', function () {
            // Now that the image has loaded make copy it to the texture.
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyTexture);
            gl.texImage2D(target, level, internalFormat, format, type, image);
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            // console.log(image);
        });
    });
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
}
function setGeometry() {
    var positions = new Float32Array(
        [
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
        ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}
function draw(time) {
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    canvas.onwheel = handleMouseWheel;
    time *= 0.001;
    var deltaTime = time - then;
    then = time;

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enableVertexAttribArray(skyboxProgram.a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    var size = 2;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.vertexAttribPointer(
        skyboxProgram.a_position, size, type, normalize, stride, offset
    );
    var aspect =canvas.clientWidth / canvas.clientHeight;
    var projectionMatrix = new Matrix4();
    projectionMatrix.setPerspective(50, aspect, 1, 2000);

    var cameraPosition = [Math.cos(then * .1), 0, Math.sin(then * .1)];
    // console.log(Math.sin(time * .1));

    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var cameraMatrix = new Matrix4();
    // cameraMatrix.lookAt(Math.cos(time * .1), 0,  Math.sin(time * .1), 0, 0, 0, 0, 1, 0);
    cameraMatrix.lookAt(0.9,0.0,0.1,0.0,0.0,0.0,0.0,1.0,0.0);
    var viewMatrix = new Matrix4();
    viewMatrix.setInverseOf(cameraMatrix);
    // viewMatrix[12] = 0;
    // viewMatrix[13] = 0;
    // viewMatrix[14] = 0;
    var viewDirectionProjectionMatrix = new Matrix4();
    viewDirectionProjectionMatrix.multiply(projectionMatrix).multiply(viewMatrix);
    var viewDirectionProjectionInverseMatrix = new Matrix4();
    viewDirectionProjectionInverseMatrix.setInverseOf(viewDirectionProjectionMatrix);
    gl.useProgram(skyboxProgram);
    gl.uniformMatrix4fv(skyboxProgram.u_viewDirectionProjectionInverse,false,viewDirectionProjectionInverseMatrix.elements);
    gl.uniform1i(skyboxProgram.u_skybox,1);
    gl.depthFunc(gl.LEQUAL);
    gl.drawArrays(gl.TRIANGLES,0,1 * 6);
    requestAnimationFrame(draw);
}
