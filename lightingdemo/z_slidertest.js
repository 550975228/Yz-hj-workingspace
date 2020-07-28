var solarAltitude;//太阳高度
var solarAzimuth;//太阳方位角
var dimension = 31.265524;//上海杨浦区地理纬度
var sunDeclination;//太阳赤纬
var t;//太阳时角
var n = 1;//距离年初1月1日的天数 2020/7/28
const myDate = new Date();//获取系统当前时间
var shadowDate = myDate.Format("yyyy/MM/dd");
var shadowTime;
// shadowTime = parseInt(value.split("点")[0])+parseInt(value.split("点")[1].split("分")[0])/60;
var realSunHour;//真太阳时
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
                t = computeSunHourangle(realSunHour);// 太阳时角
                sunDeclination = computeSunDeclination(n);// 太阳赤纬
                let jdSolarAltitude =computeSolarAltitude(dimension,sinSundegree,t);
                solarAltitude = (180/Math.PI)*jdSolarAltitude; // 转换成角度
                solarAzimuth =computeSolarAzimuth(dimension,sinSundegree,jdSolarAltitude,realSunHour);
                console.log(solarAltitude);
                console.log(solarAzimuth);
            }
        });
        sliderControl.setValue(720);
    });
}

listenSlider();
