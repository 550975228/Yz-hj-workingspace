{
    var gl, program, canvas;
}

function main() {
    initProgramAndShader();
    var textureVertices = initVerBuffers();
    if (textureVertices < 0) console.log("获取顶点数据失败");
    initTextures(textureVertices);
}

function initProgramAndShader() {
    canvas = document.getElementById("canvas");
    if (!canvas) console.log("获取canvas失败");
    gl = getWebGLContext(canvas);
    if (!gl) console.log("获取上下文失败");
    var vs = document.getElementById("vs").innerHTML;
    var fs = document.getElementById("fs").innerHTML;
    program = createProgram(gl, vs, fs);
    if (!program) console.log("初始化shader失败");

    program.a_Position = gl.getAttribLocation(program, "a_position");
    program.a_TexCoord = gl.getAttribLocation(program, "a_TexCoord");
    program.u_Sampler = gl.getUniformLocation(program, "u_Sampler");
    if (program.a_Position < 0 || program.a_TexCoord < 0 || program.u_Sampler < 0) console.log("获取变量失败");
}

function initVerBuffers() {
    var verticesSizes = new Float32Array([
        -0.5, 0.5, 0.0, 1.0,
        -0.5, -0.5, 0.0, 0.0,
        0.5, 0.5, 1.0, 1.0,
        0.5, -0.5, 1.0, 0.0
    ]);
    var n = 4;
    var vertexSizeBuffer = gl.createBuffer();
    if (!vertexSizeBuffer) console.log("创建缓冲区失败");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexSizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesSizes, gl.STATIC_DRAW);
    var fsize = verticesSizes.BYTES_PER_ELEMENT;
    gl.vertexAttribPointer(program.a_Position, 2, gl.FLOAT, false, fsize * 4, 0);
    gl.enableVertexAttribArray(program.a_Position);
    gl.vertexAttribPointer(program.a_TexCoord, 2, gl.FLOAT, false, fsize * 4, fsize * 2);
    gl.enableVertexAttribArray(program.a_TexCoord);
    return n;
}

function initTextures(n) {
    var texture = gl.createTexture();
    if (!texture) console.log("无法创建纹理对象");
    var image = new Image();
    image.onload = function () {
        gl.useProgram(program);
        //对纹理图像进行y轴反转
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        //开启0号纹理单元
        gl.activeTexture(gl.TEXTURE0);
        //向target绑定纹理对象
        gl.bindTexture(gl.TEXTURE_2D, texture);
        //配置纹理参数
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        //配置纹理图像
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        //将0号纹理传递给着色器
        gl.uniform1i(program.u_Sampler, 0);

        //绘制
        gl.clearColor(0.0, 0.0, 0.0, 1.0);

        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    }
    image.src = "../libs/images/negx.jpg";
    return true;
}























