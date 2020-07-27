
const listenSlider = () => {

    var sliderControl;
    layui.use('slider', function () {
        var $ = layui.$
            , slider = layui.slider;

        sliderControl = slider.render({
            elem: '#slideTest1'
            , max: 24 * 60
            , showstep: true
            , step: 1
            , setTips: function (value) {
                return parseInt(value / 60) + '点' + value % 60 + '分';
            }
            , change: function (value) {
                //值改变之后 将会改变的地方


            }
        });
    });
}

listenSlider();
