// Size of off screen
var OFFSCREEN_WIDTH = 2048;
var OFFSCREEN_HEIGHT = 2048;

var currentAngle = [0.0, 15.0]; // 绕X轴Y轴的旋转角度 ([x-axis, y-axis])
var curScale = 1.0; //当前的缩放比例

var centerX = 0.0;
var centerY = 1.0;
var centerZ = 0.0;
var radius = 10.0;

{
    // webgl基本参数
    var canvas, gl, drawProgram, frameProgram, fbo, plane, cube;
}
{//太阳光高度角方位角计算所需变量和数据
    var solarAltitude;//太阳高度
    var solarAzimuth;//太阳方位角
    var dimension = 31.265524;//上海杨浦区地理纬度
    var sunDeclination;//太阳赤纬
    var t;//太阳时角
    var n = 1;//距离年初1月1日的天数 2020/7/28
    const myDate = new Date();//获取系统当前时间
    var shadowDate = myDate.Format("yyyy/MM/dd");
    var shadowTime = 6;
// shadowTime = parseInt(value.split("点")[0])+parseInt(value.split("点")[1].split("分")[0])/60;
    var realSunHour;//真太阳时

}

//获取光线:平行光
// var lightDirection = getLight();
var lightDirection;


function main() {
    // 获取 <canvas> 元素
    canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initEventHandlers(canvas);

    // 获取WebGL渲染上下文
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('获取上下文失败');
        return;
    }

    //初始化两个着色器，drawProgram绘制到界面，frameProgram绘制到帧缓存
    var shadowVertexShader = document.getElementById('shadowVertexShader').innerHTML;
    var shadowFragmentShader = document.getElementById('shadowFragmentShader').innerHTML;
    var vertexShader = document.getElementById('vertexShader').innerHTML;
    var fragmentShader = document.getElementById('fragmentShader').innerHTML;
    drawProgram = createProgram(gl, vertexShader, fragmentShader);
    frameProgram = createProgram(gl, shadowVertexShader, shadowFragmentShader);
    if (!drawProgram || !frameProgram) {
        console.log('初始化着色器失败.');
        return;
    }

    //从着色器中获取地址，保存到对应的变量中
    GetProgramLocation();

    // 初始化帧缓冲区对象 (FBO)
    fbo = initFramebufferObject(gl);
    if (!fbo) {
        console.log('获取帧缓冲区失败');
        return;
    }

    // 开启深度测试
    gl.enable(gl.DEPTH_TEST);

    // 指定清空<canvas>的颜色
    gl.clearColor(0.8, 0.8, 0.8, 0.85);

    //清空颜色和深度缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    listenSlider();


}

//从着色器中获取地址，保存到对应的变量中
function GetProgramLocation() {

    drawProgram.a_Position = gl.getAttribLocation(drawProgram, 'a_Position');
    drawProgram.a_Color = gl.getAttribLocation(drawProgram, 'a_Color');
    drawProgram.a_Normal = gl.getAttribLocation(drawProgram, 'a_Normal');
    if (drawProgram.a_Position < 0 || drawProgram.a_Color < 0 || drawProgram.a_Normal < 0) {
        console.log('获取正常着色器attribute变量失败');
        //return;
    }


    drawProgram.u_MvpMatrix = gl.getUniformLocation(drawProgram, 'u_MvpMatrix');
    drawProgram.u_MvpMatrixFromLight = gl.getUniformLocation(drawProgram, 'u_MvpMatrixFromLight');
    drawProgram.u_Sampler = gl.getUniformLocation(drawProgram, "u_Sampler");
    drawProgram.u_AmbientLight = gl.getUniformLocation(drawProgram, 'u_AmbientLight');
    drawProgram.u_DiffuseLight = gl.getUniformLocation(drawProgram, 'u_DiffuseLight');
    drawProgram.u_LightDirection = gl.getUniformLocation(drawProgram, 'u_LightDirection');
    if (!drawProgram.u_MvpMatrix || !drawProgram.u_MvpMatrixFromLight || !drawProgram.u_DiffuseLight || !drawProgram.u_LightDirection || !drawProgram.u_AmbientLight) {
        console.log('获取正常着色器uniform变量失败');
        //return;
    }


    frameProgram.a_Position = gl.getAttribLocation(frameProgram, 'a_Position');
    frameProgram.a_Color = gl.getAttribLocation(frameProgram, 'a_Color');
    frameProgram.u_MvpMatrix = gl.getUniformLocation(frameProgram, 'u_MvpMatrix');

    if (frameProgram.a_Position < 0 || frameProgram.a_TexCoord < 0 || !frameProgram.u_MvpMatrix) {
        console.log('获取帧着色器变量失败');
        //return;
    }
}

//绘制
function DrawScene() {
    // 设置顶点位置
    plane = initVertexBuffersForPlane(gl);
    cube = initVertexBuffersForCube(gl);
    if (!cube || !plane) {
        console.log('获取顶点坐标失败');
        return;
    }
    gl.useProgram(frameProgram);
    //设置在帧缓存中绘制的MVP矩阵
    var MvpMatrixFromLight = setFrameMVPMatrix(gl, lightDirection, frameProgram);
    //使用颜色缓冲区着色器
    gl.useProgram(drawProgram);
    //设置在颜色缓冲区中绘制时光线的MVP矩阵
    gl.uniformMatrix4fv(drawProgram.u_MvpMatrixFromLight, false, MvpMatrixFromLight.elements);
    unchangeconst();
    //开始绘制
    drawEvery();
    //tick();
}

function unchangeconst() {
    //预先给着色器传递一些不变的量
    {
        //使用颜色缓冲区着色器
        gl.useProgram(drawProgram);
        //设置光线的强度和方向
        gl.uniform3f(drawProgram.u_DiffuseLight, 1.0, 1.0, 1.0);    //设置漫反射光
        gl.uniform3fv(drawProgram.u_LightDirection, lightDirection.elements);   // 设置光线方向(世界坐标系下的)
        gl.uniform3f(drawProgram.u_AmbientLight, 0.2, 0.2, 0.2);    //设置环境光
        //将绘制在帧缓冲区的纹理传递给颜色缓冲区着色器的0号纹理单元
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
        gl.uniform1i(drawProgram.u_Sampler, 0);

        gl.useProgram(null);
    }
}

//设置帧MVP矩阵
function setFrameMVPMatrix() {
    //模型矩阵
    var modelMatrix = new Matrix4();
    modelMatrix.translate(-centerX, -centerY, -centerZ);

    //视图矩阵
    var viewMatrix = new Matrix4();
    var r = radius + 3;
    var eyex = -lightDirection.elements[0] * r;
    var eyey = lightDirection.elements[1] * r;
    var eyez = lightDirection.elements[2] * r;
    viewMatrix.lookAt(eyex, eyey, eyez, 0, 0, 0, 0, 1, 0);
    // console.log('eyex:' + eyex + 'eyey:' + eyey + 'eyez:' + eyez);
    //viewMatrix.lookAt(0, 0, r, 0, 0, 0, 0, 1, 0);

    //投影矩阵
    var projMatrix = new Matrix4();
    var diameter = radius * 2.1;
    var ratioWH = OFFSCREEN_WIDTH / OFFSCREEN_HEIGHT;
    var nearHeight = diameter;
    var nearWidth = nearHeight * ratioWH;
    projMatrix.setPerspective(70.0, canvas.width / canvas.height, 1.0, 100.0);

    //MVP矩阵
    var mvpMatrix = new Matrix4();
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

    //将MVP矩阵传输到着色器的uniform变量u_MvpMatrix
    gl.uniformMatrix4fv(frameProgram.u_MvpMatrix, false, mvpMatrix.elements);

    return mvpMatrix;
}

//设置正常MVP矩阵
function setMVPMatrix() {
    //模型矩阵
    var modelMatrix = new Matrix4();
    modelMatrix.scale(curScale, curScale, curScale);
    modelMatrix.rotate(currentAngle[0], 1.0, 0.0, 0.0); // Rotation around x-axis
    modelMatrix.rotate(currentAngle[1], 0.0, 1.0, 0.0); // Rotation around y-axis
    modelMatrix.translate(-centerX, -centerY, -centerZ);

    //投影矩阵
    var fovy = 70;
    var projMatrix = new Matrix4();
    projMatrix.setPerspective(fovy, canvas.width / canvas.height, 1, 1000);


    //视图矩阵
    var viewMatrix = new Matrix4(); // View matrix
    viewMatrix.lookAt(2, 5, 7, 0, 0, 0, 0, 1, 0);

    //MVP矩阵
    var mvpMatrix = new Matrix4();
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

    //将MVP矩阵传输到着色器的uniform变量u_MvpMatrix
    gl.uniformMatrix4fv(drawProgram.u_MvpMatrix, false, mvpMatrix.elements);
}


//获取光线 模拟一天的日照
function getLight() {
    var lightDirection;
    // 设置光线方向(世界坐标系下的)
    // var solarAltitude = 45.0;//太阳高度
    // var solarAzimuth = 315.0;//太阳方位角.
    t = computeSunHourangle(realSunHour);// 太阳时角
    sunDeclination = computeSunDeclination(n);// 太阳赤纬
    solarAltitude = computeSolarAltitude(dimension, sunDeclination, t);
    solarAzimuth = computeSolarAzimuth(dimension, sunDeclination, solarAltitude, realSunHour) * 2;
    if (solarAltitude > 0) {

        var arrayvectorX = Math.cos(solarAltitude) * Math.cos(solarAzimuth);
        var arrayvectorY = Math.cos(solarAltitude) * Math.sin(solarAzimuth);
        var arrayvectorZ = Math.sin(solarAltitude);

        lightDirection = new Vector3([arrayvectorY, arrayvectorZ, arrayvectorX]);
    } else {
        lightDirection = new Vector3([0, 0, 0]);
    }
    lightDirection.normalize(); // Normalize
    return lightDirection;
}

// 初始化帧缓冲区对象 (FBO)
function initFramebufferObject(gl) {
    var framebuffer, texture, depthBuffer;

    // Define the error handling function
    var error = function () {
        if (framebuffer) gl.deleteFramebuffer(framebuffer);
        if (texture) gl.deleteTexture(texture);
        if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
        return null;
    }

    // 创建帧缓冲区对象 (FBO)
    framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
        console.log('Failed to create frame buffer object');
        return error();
    }

    // 创建纹理对象并设置其尺寸和参数
    texture = gl.createTexture(); // 创建纹理对象
    if (!texture) {
        console.log('Failed to create texture object');
        return error();
    }
    gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the object to target
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    // 设置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    framebuffer.texture = texture; // 保存纹理对象

    // 创建渲染缓冲区对象并设置其尺寸和参数
    depthBuffer = gl.createRenderbuffer(); //创建渲染缓冲区
    if (!depthBuffer) {
        console.log('Failed to create renderbuffer object');
        return error();
    }
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); // Bind the object to target
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

    // 将纹理和渲染缓冲区对象关联到帧缓冲区对象上
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);   //关联颜色
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);    //关联深度

    // 检查帧缓冲区是否被正确设置
    var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (gl.FRAMEBUFFER_COMPLETE !== e) {
        console.log('Frame buffer object is incomplete: ' + e.toString());
        return error();
    }

    // Unbind the buffer object
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    return framebuffer;
}

//分配缓冲区对象并开启连接
function initAttributeVariable(gl, a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}

/*
* 绘制平面
*/
function initVertexBuffersForPlane(gl) {
    //创建一个面
    //  v1------v0
    //  v2------v3

    //顶点坐标
    var vertices = new Float32Array([//0-1-2-3
        -23.0, -1.5, -7.0,
        23.0, -1.5, -7.0,
        13.0, -1.5, 6.0,
        -13.0, -1.5, 6.0
    ]);
    //颜色的坐标
    var colors = new Float32Array([
        0.95, 1.0, 1.0,
        0.95, 1.0, 1.0,
        0.75, 1.0, 1.0,
        0.75, 1.0, 1.0
    ]);
    //顶点的索引
    var indices = new Uint8Array([0, 1, 2, 0, 2, 3]);
    //将顶点的信息写入缓冲区对象
    var obj = {};
    obj.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    obj.colorBuffer = initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);
    obj.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
    if (!obj.vertexBuffer || !obj.colorBuffer || !obj.indexBuffer) {
        return null;
    }

    obj.numIndices = indices.length;

    /*gl.bindBuffer(target,buffer)
     * 允许使用buffer表示的缓冲区对象并将其绑定到target表示的目标上
     * @param target
     *   ARRAY_BUFFER 表示缓冲区对象中包含顶点数据
     *   ELEMENT_ARRAY_BUFFER 表示缓冲去对象中包含了顶点的索引值
     */
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    /*
    *gl.bufferData(target,data,usage)
    * 开辟存储空间，向绑定在target上的缓冲区对象写入数据data
    * @param target 同上
    * @param data 类型化数组 比如：Float32Array...
    * @param usage 优化效率 可以是以下值：
    *   STATIC_DRAW 只会向缓冲区写入一次数据 需要绘制很多次
    *   STREAM_DRAW 只会向缓冲区写入一次数据 需要绘制若干次
    *   DYNAMIC_DRAW 会向缓冲区对象中多次写入数据 并绘制很多次
    */
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return obj;
}

/*
* 绘制立方体
*/
function initVertexBuffersForCube(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    var vertices = new Float32Array([   // 顶点坐标
        0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5,  // v0-v1-v2-v3 front
        0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5,  // v0-v3-v4-v5 right
        0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5,  // v0-v5-v6-v1 up
        -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5,  // v1-v6-v7-v2 left
        -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,  // v7-v4-v3-v2 down
        0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5   // v4-v7-v6-v5 back
    ]);

    var colors = new Float32Array([     // 颜色
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v1-v2-v3 front
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v3-v4-v5 right
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v5-v6-v1 up
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v1-v6-v7-v2 left
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v7-v4-v3-v2 down
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0　    // v4-v7-v6-v5 back
    ]);

    var normals = new Float32Array([    // 法线
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
        // 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,// v0-v5-v6-v1 up
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,  // v7-v4-v3-v2 down
        // 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,// v7-v4-v3-v2 down
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0   // v4-v7-v6-v5 back
    ]);

    var indices = new Uint8Array([       // 索引
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // right
        8, 9, 10, 8, 10, 11,    // up
        12, 13, 14, 12, 14, 15,    // left
        16, 17, 18, 16, 18, 19,    // down
        20, 21, 22, 20, 22, 23     // back
    ]);
    var obj = {};
    //将顶点信息写入缓冲区对象
    obj.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    obj.colorBuffer = initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);
    obj.normalBuffer = initArrayBufferForLaterUse(gl, normals, 3, gl.FLOAT);
    //写入顶点索引值的缓冲区
    obj.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
    if (!obj.indexBuffer || !obj.colorBuffer || !obj.vertexBuffer || !obj.normalBuffer) {
        return null;
    }
    obj.numIndices = indices.length;
    /*gl.bindBuffer(target,buffer)
     * 允许使用buffer表示的缓冲区对象并将其绑定到target表示的目标上
     * @param target
     *   ARRAY_BUFFER 表示缓冲区对象中包含顶点数据
     *   ELEMENT_ARRAY_BUFFER 表示缓冲去对象中包含了顶点的索引值
     */
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    /*
    *gl.bufferData(target,data,usage)
    * 开辟存储空间，向绑定在target上的缓冲区对象写入数据data
    * @param target 同上
    * @param data 类型化数组 比如：Float32Array...
    * @param usage 优化效率 可以是以下值：
    *   STATIC_DRAW 只会向缓冲区写入一次数据 需要绘制很多次
    *   STREAM_DRAW 只会向缓冲区写入一次数据 需要绘制若干次
    *   DYNAMIC_DRAW 会向缓冲区对象中多次写入数据 并绘制很多次
    */
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return obj;

}

/*
* 绑定ARRAY_BUFFER(包含顶点数据)缓冲区，写入缓冲区对象
*/
function initArrayBufferForLaterUse(gl, data, num, type) {
    //创建缓冲区对象
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log("无法创建缓冲区对象");
        return null;
    }
    /*gl.bindBuffer(target,buffer)
     * 允许使用buffer表示的缓冲区对象并将其绑定到target表示的目标上
     * @param target
     *   ARRAY_BUFFER 表示缓冲区对象中包含顶点数据
     *   ELEMENT_ARRAY_BUFFER 表示缓冲去对象中包含了顶点的索引值
     */
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    /*
    *gl.bufferData(target,data,usage)
    * 开辟存储空间，向绑定在target上的缓冲区对象写入数据data
    * @param target 同上
    * @param data 类型化数组 比如：Float32Array...
    * @param usage 优化效率 可以是以下值：
    *   STATIC_DRAW 只会向缓冲区写入一次数据 需要绘制很多次
    *   STREAM_DRAW 只会向缓冲区写入一次数据 需要绘制若干次
    *   DYNAMIC_DRAW 会向缓冲区对象中多次写入数据 并绘制很多次
    */
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    buffer.num = num;
    buffer.type = type;

    return buffer;

}

/*
* 绑定ELEMENT_ARRAY_BUFFER(包含了顶点的索引值)缓冲区，写入缓冲区对象
*/
function initElementArrayBufferForLaterUse(gl, data, type) {
    //创建缓冲区对象
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log("无法创建着色器");
        return null;
    }
    /*    gl.bindBuffer(target,buffer)
        允许使用buffer表示的缓冲区对象并将其绑定到target表示的目标上
        @param target
               ARRAY_BUFFER 表示缓冲区对象中包含顶点数据
               ELEMENT_ARRAY_BUFFER 表示缓冲去对象中包含了顶点的索引值*/
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    /*
    *gl.bufferData(target,data,usage)
    * 开辟存储空间，向绑定在target上的缓冲区对象写入数据data
    * @param target 同上
    * @param data 类型化数组 比如：Float32Array...
    * @param usage 优化效率 可以是以下值：
    *   STATIC_DRAW 只会向缓冲区写入一次数据 需要绘制很多次
    *   STREAM_DRAW 只会向缓冲区写入一次数据 需要绘制若干次
    *   DYNAMIC_DRAW 会向缓冲区对象中多次写入数据 并绘制很多次
    */
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

    buffer.type = type;

    return buffer;
}

/**
 * tick
 */
var tick = function () {
    drawEvery();
    requestAnimationFrame(tick);
}
/**
 *  需要循环的绘制部分
 * */
var drawEvery = function () {
    //帧缓存绘制

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); //将绘制目标切换为帧缓冲区对象FBO
    gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT); // 为FBO设置一个视口

    gl.clearColor(0.8, 0.8, 0.8, 0.85); // 设置背景色
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // 清空fbo
    gl.useProgram(frameProgram); //准备生成纹理贴图

    //分配缓冲区对象并开启连接
    initAttributeVariable(gl, frameProgram.a_Position, cube.vertexBuffer); // 顶点坐标
    initAttributeVariable(gl, frameProgram.a_Color, cube.colorBuffer); // 颜色
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);
    gl.drawElements(gl.TRIANGLES, cube.numIndices, cube.indexBuffer.type, 0);


    initAttributeVariable(gl, frameProgram.a_Position, plane.vertexBuffer); // 顶点坐标
    initAttributeVariable(gl, frameProgram.a_Color, plane.colorBuffer); // 颜色
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, plane.indexBuffer);
    gl.drawElements(gl.TRIANGLES, plane.numIndices, plane.indexBuffer.type, 0);

    //颜色缓存绘制
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); //将绘制目标切换为颜色缓冲区
    gl.viewport(0, 0, canvas.width, canvas.height); // 设置视口为当前画布的大小

    gl.clearColor(0.8, 0.8, 0.8, 0.85);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the color buffer
    gl.useProgram(drawProgram); // 准备进行绘制

    //设置MVP矩阵
    setMVPMatrix(gl, canvas, lightDirection, drawProgram);

    //分配缓冲区对象并开启连接
    initAttributeVariable(gl, drawProgram.a_Position, cube.vertexBuffer); // Vertex coordinates
    initAttributeVariable(gl, drawProgram.a_Color, cube.colorBuffer); // Texture coordinates
    initAttributeVariable(gl, drawProgram.a_Normal, cube.normalBuffer); // Texture coordinates

    //分配索引并绘制
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);
    gl.drawElements(gl.TRIANGLES, cube.numIndices, cube.indexBuffer.type, 0);
    //分配缓冲区对象并开启连接
    initAttributeVariable(gl, drawProgram.a_Position, plane.vertexBuffer); // Vertex coordinates
    initAttributeVariable(gl, drawProgram.a_Color, plane.colorBuffer); // Texture coordinates

    //分配索引并绘制
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, plane.indexBuffer);
    gl.drawElements(gl.TRIANGLES, plane.numIndices, plane.indexBuffer.type, 0);

}


//注册鼠标事件
function initEventHandlers(canvas) {
    var dragging = false; // Dragging or not
    var lastX = -1,
        lastY = -1; // Last position of the mouse

    //鼠标按下
    canvas.onmousedown = function (ev) {
        var x = ev.clientX;
        var y = ev.clientY;
        // Start dragging if a moue is in <canvas>
        var rect = ev.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            lastX = x;
            lastY = y;
            dragging = true;
        }
    };

    //鼠标离开时
    canvas.onmouseleave = function (ev) {
        dragging = false;
    };

    //鼠标释放
    canvas.onmouseup = function (ev) {
        dragging = false;
    };

    //鼠标移动
    canvas.onmousemove = function (ev) {
        var x = ev.clientX;
        var y = ev.clientY;
        if (dragging) {
            var factor = 100 / canvas.height; // The rotation ratio
            var dx = factor * (x - lastX);
            var dy = factor * (y - lastY);
            currentAngle[0] = currentAngle[0] + dy;
            currentAngle[1] = currentAngle[1] + dx;
        }
        lastX = x, lastY = y;
    };

    //鼠标缩放
    canvas.onmousewheel = function (event) {
        if (event.wheelDelta > 0) {
            curScale = curScale * 1.1;
        } else {
            curScale = curScale * 0.9;
        }
    };
}


//layui监听slider变化
const listenSlider = () => {

    var sliderControl;
    layui.use('slider', function () {
        var $ = layui.$
            , slider = layui.slider;

        sliderControl = slider.render({
            elem: '#timeSlider'
            , max: 24 * 60
            , showstep: true
            , step: 1
            , setTips: function (value) {
                return parseInt(value / 60) + '点' + value % 60 + '分';
            }
            , change: function (value) {
                //值改变之后 将会改变的地方

                shadowTime = parseInt(value.split("点")[0]) + parseInt(value.split("点")[1].split("分")[0]) / 60;
                realSunHour = computeRealSunHour(shadowDate, shadowTime);
                //获取光线:平行光
                lightDirection = getLight();
                // console.log(lightDirection);
                DrawScene();

            }
        });
        sliderControl.setValue(720);
    });
}
