{
    var canvas, gl, bloomProgram;
    var sunColor=new Vector3([0.4,0.4,0.4]);

}
function main() {
    initProgramAndShaders();
    getVarFromShader();
    listenSlider();
    draw();
}

/**
 * 初始化着色器
 */
function initProgramAndShaders() {
    //获取canvas对象
    canvas = document.getElementById("canvas");
    //将画布设为屏幕大小
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    //获取WebGL上下文
    gl = getWebGLContext(canvas);
    if (!gl) console("您的浏览器不支持WebGL");

    var vsForBloom = document.getElementById("vsForBloom").innerHTML;
    var fsForBloom = document.getElementById("fsForBloom").innerHTML;
    bloomProgram = createProgram(gl, vsForBloom, fsForBloom);
    if (!bloomProgram) console.log("创建炫光program失败");

}

/**
 * 绑定着色器变量
 */
function getVarFromShader() {
    bloomProgram.a_Position = gl.getAttribLocation(bloomProgram, "a_Position");
    bloomProgram.width = gl.getUniformLocation(bloomProgram, "width");
    bloomProgram.height = gl.getUniformLocation(bloomProgram, "height");
    bloomProgram.sunColor = gl.getUniformLocation(bloomProgram,"sunColor");
    bloomProgram.lightPosition = gl.getUniformLocation(bloomProgram,"lightPosition");
    if (!bloomProgram.width||!bloomProgram.height||bloomProgram.a_Position < 0 ) console.log("获取炫光着色器变量失败");
}



function draw() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    setBloomPosition();
    requestAnimationFrame(draw);

}

function setBloomPosition() {
    var vertexData = new Float32Array([
        -1.0,  1.0,
        -1.0, -1.0,
        1.0,  1.0,
        1.0, -1.0,
    ]);
    var vertexDataBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(bloomProgram.a_Position);
    gl.vertexAttribPointer(bloomProgram.a_Position, 2, gl.FLOAT, false, 2 * 4, 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(bloomProgram);
    console.log(sunColor);
    gl.uniform3fv(bloomProgram.sunColor,sunColor.elements);

    gl.uniform2fv(bloomProgram.lightPosition,new Float32Array([0.01,0.2]));
    gl.uniform1f(bloomProgram.width, window.innerWidth);
    gl.uniform1f(bloomProgram.height, window.innerHeight);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}


const listenSlider = () => {
    var sliderControl;
    var realValue;
    layui.use('slider', function () {
        var $ = layui.$
            , slider = layui.slider;

        sliderControl = slider.render({
            elem: '#timeSlider'
            , max: 24 * 60
            , showstep: true
            , step: 1
            , setTips: function (value) {
                realValue = value;
                return parseInt(value / 60) + '点' + value % 60 + '分';
            }
            , change: function (value) {
                sunColor.elements[1]=0.4-Math.abs(realValue-720) * ((0.2)/520);
                sunColor.elements[2]=0.4-Math.abs(realValue-720) * ((0.3)/520);
            }
        });
        sliderControl.setValue(720);
    });
}
