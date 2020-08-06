{
    var canvas, gl, frameProgram, drawProgram,skyboxProgram, fbo,bloomProgram;
    var cube, plane, sphere,skyPositionBuffer,bloom, angle = 0.0;
    var OFFSCREEN_WIDTH = 4096, OFFSCREEN_HEIGHT = 4096;
    var angle_step = 30; //每秒旋转的增量
    var last = +new Date(); //保存上次调用animate()函数的方法
    var lightColor = 1;
}
{
    //矩阵
    var mvpFrameForCube = new Matrix4();
    var mvpFrameForPlane = new Matrix4();
    var mvpFrameForSphere = new Matrix4();
    var g_modelMatrix = new Matrix4();
    var g_mvpMatrix = new Matrix4();
    //声明一个光源的变化矩阵
    var vpMatrixForFrame = new Matrix4();
    //为常规绘图准备视图投影矩阵
    var viewProjectMatrix = new Matrix4();
}
{
    // 太阳高度数据
    var solarAltitude;//太阳高度
    var solarAzimuth;//太阳方位角
    var dimension = {lng: 121.53252, lat: 31.265524};//上海杨浦区 lng 经度，lat纬度
    var sunDeclination;//太阳赤纬
    var t;//太阳时角
    var n = 1;//距离年初1月1日的天数 2020/7/28
    var myDate = new Date();//获取系统当前时间
    var shadowDate = myDate.Format("yyyy/MM/dd");
    var shadowTime = 6;
// shadowTime = parseInt(value.split("点")[0])+parseInt(value.split("点")[1].split("分")[0])/60;
    var realSunHour;//真太阳时
    var lightDirection;
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
    bloomProgram = createProgram(gl,vsForBloom,fsForBloom);
    if(!bloomProgram) console.log("创建炫光program失败");

}

/**
 * 绑定着色器变量
 */
function getVarFromShader() {
    bloomProgram.a_Position = gl.getAttribLocation(bloomProgram,"a_Position");
    bloomProgram.a_PointSize = gl.getAttribLocation(bloomProgram,"a_PointSize");
    bloomProgram.u_MVPMatrix = gl.getUniformLocation(bloomProgram,"u_MVPMatrix");
    if(bloomProgram.a_Position<0||!bloomProgram.u_MVPMatrix) console.log("获取炫光着色器变量失败");
}



/**
 * 获取顶点数据
 */
function initVerBuffers() {
    //设置顶点的坐标、颜色和法向量

}



/**
 * 获取光线地址
 */
function getLight() {
    //设置光线地址（不是世界坐标系下的，所以讲这些取消掉，直接把位置传入）
    let directionLight;
    // 设置光线方向(世界坐标系下的)
    // var solarAltitude = 45.0;//太阳高度
    // var solarAzimuth = 315.0;//太阳方位角.
    t = computeSunHourangle(realSunHour);// 太阳时角
    n = computerDayFromNewYear(shadowDate) + 1;
    sunDeclination = computeSunDeclination(n);// 太阳赤纬
    //太阳高度
    //console.log("纬度： " + dimension.lat + " 太阳赤纬： " + sunDeclination + " 太阳时角 " + t);
    solarAltitude = computeSolarAltitude(dimension.lat, sunDeclination, t);
    //太阳方位角
    solarAzimuth = computeSolarAzimuth(dimension.lat, sunDeclination, solarAltitude, realSunHour);
    solarAzimuth = -solarAzimuth + Math.PI / 2;
    // console.log("太阳高度角： " + solarAltitude + "太阳方位角： " + solarAzimuth);
    if (solarAltitude > 0) {
        var arrayvectorX = Math.cos(solarAltitude) * Math.cos(solarAzimuth);
        var arrayvectorY = Math.cos(solarAltitude) * Math.sin(solarAzimuth);
        var arrayvectorZ = Math.sin(solarAltitude);
        // console.log("x: " + arrayvectorX + "y: " + arrayvectorZ + "z: " + arrayvectorY);
        directionLight = new Vector3([arrayvectorX, arrayvectorZ, arrayvectorY]);
    } else {
        directionLight = new Vector3([0, 0, 0]);
    }
    // console.log(directionLight);
    directionLight.normalize(); // Normalize
    return directionLight;
}



function draw() {
    gl.useProgram(bloomProgram);
    setBloomPosition();
    gl.drawArrays(gl.POINTS,0,1);
    requestAnimationFrame(draw);

}
function setBloomPosition() {

    gl.vertexAttrib3f(bloomProgram.a_Position, 1.0, 1.0, 1.0);
    gl.vertexAttrib1f(bloomProgram.a_PointSize,20.0);
}
/**
 * 设置光线属性以及两个视口
 */
function setLightElements() {
    lightDirection = getLight();
    //设置灯光位置
    var r = 12.0;
    var light_x = lightDirection.elements[0] * r;
    var light_y = lightDirection.elements[1] * r;
    var light_z = lightDirection.elements[2] * r;
    // console.log("lightX: " + light_x + "lightY: " + light_y + "lightZ: " + light_z);
    //声明一个光源的变化矩阵
    // vpMatrixForFrame.setOrtho(-20000, 20000, -20000, 20000, 0, 50000);
    vpMatrixForFrame.setOrtho(-30, 30, -30, 30, 1, 40);
    // vpMatrixForFrame.setPerspective(70.0, OFFSCREEN_WIDTH / OFFSCREEN_HEIGHT, 1.0, 1000.0);
    vpMatrixForFrame.lookAt(light_x, light_y, light_z, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
    //为常规绘图准备视图投影矩阵
    viewProjectMatrix.setPerspective(45.0, canvas.width / canvas.height, 1.0, 100.0);
    viewProjectMatrix.lookAt(0.0, 7.0, 20.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

    gl.useProgram(drawProgram);
    gl.uniform3f(drawProgram.u_LightColor, lightColor, lightColor, lightColor);
    gl.uniform3f(drawProgram.u_AmbientLight, 0.4, 0.4, 0.4);
    gl.uniform3f(drawProgram.u_LightDirection, light_x, light_y, light_z);
    gl.useProgram(null);
}


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
                //console.log(shadowTime);
                realSunHour = computeRealSunHour(shadowDate, shadowTime);
                //lightColor=((600-parseFloat(value))*0.001);
            }
        });
        sliderControl.setValue(720);
    });
}
