/**
 * 阻止默认事件
 */
(function forbidOverMove() {
    window.ontouchmove = function(e) {
        e.preventDefault && e.preventDefault();
        e.returnValue = false;
        e.stopPropagation && e.stopPropagation();
        return false;
    }
})();

/**
 * jq对象函数扩展
 */
$.fn.extend({
    /**
     * 设置Css3兼容
     * @param {String || Object} key    样式名称，支持对象方式调用
     * @param {String} value  样式值
     */
    css3: function(key, value) {
        var jThis = $(this),
            compatibleArr = ["", "webkit", "moz", "ms", "o"],
            cssObj = {},
            paramObj = {};

        if (typeof key == "object") {
            paramObj = key;
        } else {
            paramObj[key] = value;
        }

        for (var k in paramObj) {
            complieCss(k, paramObj[k]);
        }

        function complieCss(key, value) {
            for (var i = 0; i < compatibleArr.length; i++) {
                var item = compatibleArr[i];
                if (item) {
                    cssObj[item + upperFirst(key)] = value;
                } else {
                    cssObj[key] = value;
                }
            }

            function upperFirst(str) {
                str = str.substr(0, 1).toUpperCase() + str.substr(1, str.length - 1);
                return str;
            }
        }

        jThis.css(cssObj);
        return jThis;
    }
});

/**
 * 获取移动坐标信息
 */
function _fnGetTouchPosition(e) {
    var touches = e.changedTouches,
        oMove = {
            x: e.pageX,
            y: e.pageY
        }
    ;
    if(e.type.indexOf("touch") > -1){
        oMove.x = touches[touches.length - 1].pageX;
        oMove.y = touches[touches.length - 1].pageY;
    }

    return oMove;
}

/**
 * 微场景
 */
function Fn(options){
    /**
     * 容器样式名
     * @type {string}
     */
    this.containerClassName = options.container;
    /**
     * 容器
     * @type {array}
     */
    this.container = document.getElementsByClassName(this.containerClassName)[0];
    /**
     * 每一页的统一样式名
     * @type {string}
     */
    this.pageClassName = options.unitPage;
    /**
     * 页面们
     * @type {array}
     */
    this.pages = document.getElementsByClassName(this.pageClassName);
    /**
     * 单页高度
     * @type {number}
     */
    this.pageHeight = $(window).height();
    /**
     * 当前页索引
     * @type {number}
     */
    this.currIndex = options.currIndex || 0;
    /**
     * 将条页索引
     * @type {Number}
     */
    this.nextIndex = null;
    /**
     * 是否在翻页中
     * @type {booler}
     */
    this.moving = false;
    /**
     * 移动高度
     * @type {Number}
     */
    this.moveHeight = 0;
    /**
     * 回调函数
     */
    this.callBack = options.callBack;
    /**
     * 页面touchMove拖动效果
     */
    this.touchMoveEffect = options.touchMoveEffect || false;

    this.init();
}

Fn.prototype = {
    /**
     * 初始化
     */
    init: function() {
        var _this = this;
        var currPage = $(_this.pages[_this.currIndex]);
        //给每一页设置高度
        // $(_this.container).css({
        //     height: _this.pageHeight + 'px'
        // })
        for (var i = 0; i < _this.pages.length; i++) {
            $(_this.pages[i]).css({
                height: _this.pageHeight + 'px'
            })
        }
        //展示当前页
        $(currPage).show();
        _this.bindTouch();
        _this.bindWheel();

        var timer = null;
        $(window).on("resize", function() {
            clearTimeout(timer);
            _this.pageHeight = $(window).height();
            for (var i = 0; i < _this.pages.length; i++) {
                $(_this.pages[i]).css({
                    height: _this.pageHeight + 'px'
                })
            }
            _this.moveHeight = - _this.pageHeight * _this.currIndex;
            // 同时整个页面平移
            $(_this.container).css3({
                'transform': 'translate3d(0, ' + _this.moveHeight + 'px, 0)',
            })
        });
    },
    /**
     * 展示nextPage
     */
    showPage: function() {
        var _this = this;
        _this.moving = true;//正在滚动

        // 页面差
        var delta = _this.nextIndex - _this.currIndex;
        var nextPage = $(_this.pages[_this.nextIndex]);
        var currPage = $(_this.pages[_this.currIndex]);

        _this.moveHeight -= delta * _this.pageHeight;

        nextPage.css3({
            'transform': 'translate3d(0, ' + (-delta * _this.pageHeight)  + 'px, 0)',
            'transition': '-webkit-transform .5s',
            'z-index': '1'
        })
        setTimeout(function() {
            //next item 还原
            nextPage.css3({
                'transform': 'translate3d(0, 0, 0)',
                'transition': 'initial',
                'z-index': '0'
            });
            for (var i = 0; i < _this.pages.length; i++) {
                if (nextPage[0] != $(_this.pages[i])[0]) {
                    $(_this.pages[i]).css3({
                        'transform': 'translate3d(0, 0, 0)',
                        'transition': 'initial',
                    })
                }
            }
            // 同时整个页面平移
            $(_this.container).css3({
                'transform': 'translate3d(0, ' + _this.moveHeight + 'px, 0)',
            })
            _this.currIndex = _this.nextIndex
            _this.moving = false;
            _this.callBack(_this.currIndex)
        }, 500)
    },
    /**
     * 绑定touch事件
     */
    bindTouch: function() {
        var _this = this;
        var touchPosition, 
            isTouchStart = false, 
            historyIndex = 0;
        function start(event) {
            if (_this.moving) {
                return;
            }
            var oMove = _fnGetTouchPosition(event);
            touchPosition = oMove.y;
            isTouchStart = true;
        };
        function move(event) {
            event.preventDefault();
            if (_this.moving || !isTouchStart) {
                return;
            }
            var oMove = _fnGetTouchPosition(event);
            // 移动距离
            var touchMove = oMove.y - touchPosition;
            // 下滑
            if (touchMove >= 0 && _this.currIndex > 0) {
                _this.nextIndex = _this.currIndex - 1;
                var naxtPage = $(_this.pages[_this.nextIndex]);
                naxtPage.css({
                    'transition': 'initial',
                    'z-index': '1'
                })
            }
            // 上滑
            if (touchMove < 0 && _this.currIndex < _this.pages.length - 1) {
                _this.nextIndex = _this.currIndex + 1;
                var naxtPage = $(_this.pages[_this.nextIndex]);
                naxtPage.css({
                    'transition': 'initial',
                    'z-index': '1'
                })
            }
            if (_this.currIndex > 0 || _this.currIndex < _this.pages.length - 1) {
                _this.touchMoveEffect && naxtPage && naxtPage.css3({
                    'transform': 'translate3d(0, ' + touchMove + 'px, 0)',
                });
            }
        }
        function end(event) {
            event.preventDefault();
            if (_this.moving || !isTouchStart) {
                return;
            }
            var oMove = _fnGetTouchPosition(event);
            // 移动距离
            var touchMove = oMove.y - touchPosition;
            if ((touchMove < 0 && _this.currIndex >= _this.pages.length - 1) || (touchMove >= 0 && _this.currIndex <= 0)) {
                return;
            }
            if (Math.abs(touchMove) > 50) {
                _this.showPage();
            } else {
                // 返回
                for (var i = 0; i < _this.pages.length; i++) {
                    $(_this.pages[i]).css3({
                        'transform': 'translate3d(0, 0, 0)',
                        'transition': 'transform .5s',
                    })
                }
            }
            isTouchStart = false; 
        }
        //绑定
        function bind() {
            if (window.attachEvent) {
                //IE绑定事件方式
                // obj.attachEvent("on" + type, fn);
                _this.container.attachEvent("ontouchstart", function(e) { start(e); });
                _this.container.attachEvent("ontouchmove", function(e) { move(e); });
                _this.container.attachEvent("ontouchend", function(e) { end(e); });
                _this.container.attachEvent("onmousedown", function(e) { start(e);});
                _this.container.attachEvent("onmousemove", function(e) { move(e);});
                _this.container.attachEvent("onmouseup", function(e) { end(e);});
            } else if (window.addEventListener) {
                _this.container.addEventListener("touchstart", function(e) { start(e); }, false);
                _this.container.addEventListener("touchmove", function(e) { move(e); }, false);
                _this.container.addEventListener("touchend", function(e) { end(e); }, false);
                _this.container.addEventListener("mousedown", function(e) { start(e);}, false);
                _this.container.addEventListener("mousemove", function(e) { move(e);}, false);
                _this.container.addEventListener("mouseup", function(e) { end(e);}, false);
            }
        }
        bind();
    },
    /**
     * 鼠标滚轮绑定
     */
    bindWheel: function() {
        var _this = this;
        function wheelBinding(e) {
            if (e.preventDefault)
                e.preventDefault(); //阻止默认行为
            e.returnValue = false; //IE5到IE8 returnValue = false，也能阻止默认行为
            if (_this.moving) {
                return;
            }
            var nDelta = 0;
            e = e || window.event;
            if (e.wheelDelta) {
                /**
                 * 其他浏览器，通过event.wheelDelta获取滚动值
                 * 正数：向上滚动，负数：向下滚动  滚动一次值120
                 */
                nDelta = e.wheelDelta / 120;
            } else if (e.detail) {
                /**
                 * 针对火狐浏览器，通过event.detail获取滚动值
                 * 正数：向下滚动，负数：向上滚动  滚动一次值3
                 */
                nDelta = -e.detail / 3;
            }
            if (nDelta) {
                if (nDelta < 0) {
                    if (_this.currIndex < _this.pages.length - 1) {
                        _this.nextIndex = _this.currIndex + 1;
                        _this.showPage();
                    }
                } else {
                    if (_this.currIndex > 0) {
                        _this.nextIndex = _this.currIndex - 1;
                        _this.showPage();
                    }
                }
            }
        }
        if (window.addEventListener) { //针对火狐浏览器
            window.addEventListener('DOMMouseScroll', wheelBinding, false);
        }
        window.onmousewheel = document.onmousewheel = wheelBinding;
    }
}
window.MicroScene = Fn;
// return Fn;
