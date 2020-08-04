/**
 * @description:  计算太阳时角
 * @params:  { realSunHour } : number 真太阳时
 * @params:  太阳时角(degree)
 * @return:
 * @example:

 */
const computeSunHourangle = (realSunHour) => {
    return (realSunHour - 12) * 15
}
/**
 * @description:  太阳高度角计算公式
 * @params: { dimension } : number  地理纬度  角度
 * @params: { sunDeclination } : number 太阳赤纬  角度
 * @params: { t } : 太阳时角  角度
 * @return: 太阳高度角

 */
const computeSolarAltitude = (dimension, sunDeclination, t) => {
    const hdT = t * (Math.PI / 180);  // 角度转弧度
    const hdSunDeclination = sunDeclination;  // 角度转弧度 太阳赤纬
    const hdDimension = dimension * (Math.PI / 180);  // 角度转弧度
    const sinSolarAltitude = Math.sin(hdDimension) * Math.sin(hdSunDeclination)
        + Math.cos(hdDimension) * Math.cos(hdSunDeclination) * Math.cos(hdT);
    const solarAltitude = Math.asin(sinSolarAltitude);  // 输出太阳高度角的弧度角度
    const jdSolarAltitude = (180/Math.PI)*solarAltitude; // 转换成角度
    return solarAltitude;
}


/**
 * @description: 计算太阳赤纬公式
 * @params:  { n } : number , 每年从1月1日起，距离计算日的天数
 * @return:  太阳赤维 角度
 * @example:

 */
const computeSunDeclination = (n) => {
    let b = 2 * Math.PI * (n - 1) / 365;
    // var sinSundegree = 0.39795 * Math.cos(0.98563 * (n - 173) / 180 * Math.PI);
    const sinSundegree = 0.006918 - 0.399912 * Math.cos(b) + 0.070257 * Math.sin(b) - 0.006758 * Math.cos(2 * b) + 0.000907 * Math.sin(2 * b) - 0.002697 * Math.cos(3 * b) + 0.00148 * Math.sin(3 * b);
    return Math.asin(sinSundegree);
}
/**
 * @description:  太阳方位角计算公式
 * @params: { dimension } : number  地理纬度
 * @params: { sunDeclination } : number 太阳赤纬
 * @params: { h }         : number  太阳高度角
 * @return:
 * @example:

 */
const computeSolarAzimuth = (dimension, sunDeclination, h, realSunhour) => {
    const hdSunDeclination = sunDeclination;  // 角度转弧度  太阳赤纬
    const hdDimension = dimension * (Math.PI / 180);  // 角度转弧度  纬度
    const solarAzimuth = (-Math.sin(h) * Math.sin(hdDimension) + Math.sin(hdSunDeclination)) / (Math.cos(h) * Math.cos(hdDimension))
    let solarAltitude
    if (realSunhour < 12) {
        solarAltitude = Math.acos(solarAzimuth); // 太阳方位角的弧度角度
    } else {
        solarAltitude = 2 * Math.PI - Math.acos(solarAzimuth); // 太阳方位角的弧度角度
    }
    //const jdSolarAltitude = (180 / Math.PI) * solarAltitude; // 转换成角度

    return solarAltitude;
}

/**
 * @description: 计算真太阳时
 * @params:  { sunHour } 平太阳时，日常时间  "13.45"
 * @params:  { date } 平太阳时，日常时间   "2020/7/28"
 * @params:  { lat } 纬度
 * @return:
 * @example:

 */

const computeRealSunHour = (date, sunHour) => {
    const dateStringArray = date.split("/");//将日期分开
    const dateString = dateStringArray[1] + "月" + dateStringArray[2] + "日";//取出月日，设置格式
    const timeDifference = window.sunRealHour.filter(item => item.name === dateString)[0].value;//取出对应天数时差
    const symbol = timeDifference.substr(0, 1);//取正负
    const fen = timeDifference.substr(1, 2);//取分钟
    let miao;
    if (fen.length === 7) {
        miao = timeDifference.substr(4, 2);

    } else {
        miao = timeDifference.substr(4, 1);
    }

    let fenmiao = parseInt(fen) + parseInt(miao) / 60;
    let shifenmiao = null;

    if (symbol === "+") {
        shifenmiao = sunHour + fenmiao / 60;
    } else {
        shifenmiao = sunHour - fenmiao / 60;
    }
    return shifenmiao;
}
/**
 * 对Date的扩展，将 Date 转化为指定格式的String
 * 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
 * 例子：
 * (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
 * (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
 */
Date.prototype.Format = function (fmt) {
    let o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "H+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (let k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
/**
 * 计算当前日期到一月一日的天数
 * @Para {date} 当前日期
 *
 */
const computerDayFromNewYear = (nowDate) => {
    const newYearDay = nowDate.split("/")[0] + "/1/1";
    const beginDay = new Date(newYearDay);
    const today = new Date(nowDate);
    return (today.getTime() - beginDay.getTime()) / (24 * 60 * 60 * 1000);
}
