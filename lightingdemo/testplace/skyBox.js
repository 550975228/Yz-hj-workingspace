{
    var gl, fsForSkyBox, vsForSkyBox, canvas, skyboxProgram;
    var cubemap;
    var skyBoxbuffer;
    var image_counter = 0;
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


function loadCubeMap(base) {
    var skyTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyTexture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    var faces = [
        ["posx.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
        ["negx.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
        ["posy.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
        ["negy.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
        ["posz.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
        ["negz.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]
    ];
    for (var i = 0; i < faces.length; i++) {
        var face = faces[i][1];
        var image = new Image();
        image.onload = function (skyTexture, face, image) {
            return function () {
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyTexture);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                image_counter++;
                if (image_counter == 6) {
                    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                }
                requestAnimationFrame(draw);
            }
        }(skyTexture, face, image);
        image.src = base + '/' + faces[i][0];
    }
    return skyTexture;
}

function main(base) {
    initProgramAndShader();
    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect = canvas.width / canvas.height;

    gl.useProgram(skyboxProgram);

    skyboxProgram.a_Position = gl.getAttribLocation(skyboxProgram, "a_Position");
    gl.enableVertexAttribArray(skyboxProgram.a_Position);
    skyBoxbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, skyBoxbuffer);
    var vertices = new Float32Array([-1, -1, 3, -1, -1, 3]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(skyboxProgram.a_Position, 2, gl.FLOAT, false, 0, 0);

    skyboxProgram.u_MvpMatrix = gl.getUniformLocation(skyboxProgram, "u_MvpMatrix");
    skyboxProgram.u_SkyBox = gl.getUniformLocation(skyboxProgram, "u_SkyBox");
    if(skyboxProgram.a_Position<0||!skyboxProgram.u_MvpMatrix||!skyboxProgram.u_SkyBox) console.log("获取数据失败");
    cubemap = loadCubeMap(base);

    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    canvas.onwheel = handleMouseWheel;

    requestAnimationFrame(draw);
}

function draw() {
    if (image_counter < 6) {
        gl.clearColor(0.0, image_counter / 6.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    } else {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
        gl.uniform1i(skyboxProgram.u_SkyBox, 0);

        var v = rotateXY(angle_x, angle_y);
        var p = perspectiveMatrixInverse(fov, aspect, 0.01, 100.0);
        var mat = mul(p, v);
        gl.uniformMatrix4fv(skyboxProgram.u_MvpMatrix, false, mat);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.flush();
}
