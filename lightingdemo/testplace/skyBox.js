{
    var gl, fsForSkyBox, vsForSkyBox, canvas, skyboxProgram;
    var skyPositionBuffer;
}

function main() {
    initProgramAndShader();
    setSkyPosition();
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
    if (!skyboxProgram) console.log("初始化天空盒着色器失败");
    //获取变量
    skyboxProgram.a_position = gl.getAttribLocation(skyboxProgram, "a_position");
    skyboxProgram.u_vpMatrix = gl.getUniformLocation(skyboxProgram, "u_vpMatrix");
    skyboxProgram.u_skybox = gl.getUniformLocation(skyboxProgram, "u_skybox");
    if (skyboxProgram.a_position < 0 || !skyboxProgram.u_vpMatrix || !skyboxProgram.u_skybox) console.log("获取数据失败");

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

function setSkyPosition() {
    var positions = new Float32Array(
        [
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
        ]);
    skyPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, skyPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

function draw() {
    drawSkyBox();
    requestAnimationFrame(draw);
}
function drawSkyBox() {
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enableVertexAttribArray(skyboxProgram.a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, skyPositionBuffer);
    var size = 2;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.vertexAttribPointer(skyboxProgram.a_position, size, type, normalize, stride, offset);
    setSkyVpMatrix();
    gl.useProgram(skyboxProgram);
    gl.uniform1i(skyboxProgram.u_skybox, 1);
    gl.depthFunc(gl.LEQUAL);
    gl.drawArrays(gl.TRIANGLES, 0, 1 * 6);
    gl.useProgram(null);
    gl.bindBuffer(gl.ARRAY_BUFFER,null);
}
function setSkyVpMatrix() {
    var cameraMatrix = new Matrix4();
    cameraMatrix.lookAt(0, 0, 0.1, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
    var viewMatrix = new Matrix4();
    viewMatrix.setInverseOf(cameraMatrix);

    var projectionMatrix = new Matrix4();
    var aspect = canvas.clientWidth / canvas.clientHeight;
    projectionMatrix.setPerspective(50, aspect, 1, 2000);

    var vpMatrix = new Matrix4();
    vpMatrix.multiply(projectionMatrix).multiply(viewMatrix);
    vpMatrix.setInverseOf(vpMatrix);
    gl.useProgram(skyboxProgram);
    gl.uniformMatrix4fv(skyboxProgram.u_vpMatrix, false, vpMatrix.elements);
}


