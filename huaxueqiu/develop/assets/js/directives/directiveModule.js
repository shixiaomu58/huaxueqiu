/**
 * 备胎通用模块应用
 *
 * @author dongxiaochai @163.com
 * @since 2016-06-15
 */
define(["angular", "globalBase"], function(angular){
    var module = angular.module('btBaseModule', []);
    module.config(['$compileProvider','$provide', function($compileProvider, $provide){
        //暴露相应的注册方法出来
        module.directive  = $compileProvider.directive;
        module.factory = $provide.factory;
        module.service = $provide.service;
    }]);

    var _util = {
        getPicSizeUrl: function(src, element, size) {
            var PIC_SIZE_ARR = [100, 300, 700], //图片的尺寸
                PRIVATE_PIC_REG = /^\d+$/ //私有图片验证前缀，有可能是完整http或者fileId
                ;
            if (!src || src.indexOf('file:') == 0) {
                return src;
            }

            src = src.toString();
            if (src.toUpperCase().indexOf("/PUBLIC") >= 0) { //公有图片
                if (src.indexOf("http") != 0) {
                    src = (GConfig.PUBLIC_PIC_HOST || "") + src;
                }

                if(size == "auto"){
                    size = getSize();
                }
                if (size) {
                    var sizeReg = /\-\d{2,3}\./ig;
                    if (sizeReg.test(src)) { //已经带了尺寸了
                        if(size == "original"){//如果是原图去掉-size
                            size = "YT";
                        }
                        return src.replace(sizeReg, "-" + size + ".");

                    } else {
                        if(size == "original"){//如果是原图  返回原来的src
                            size = 'YT';
                        }
                        var asSrc = src.split(".");
                        asSrc[asSrc.length - 2] = asSrc[asSrc.length - 2] + "-" + size;
                        src = asSrc.join(".");
                    }
                }
                //} else if (PRIVATE_PIC_REG.test(src) || src.indexOf(GConfig.PRIVATE_PIC_HOST) >= 0) { //私有图片
                /**
                 * 服务端说给全地址以后，在此我以路径给private来判断
                 * ashaLiu
                 * 2017-3-31
                 */
            } else if (PRIVATE_PIC_REG.test(src) || src.toUpperCase().indexOf("/PRIVATE") >= 0) { //私有图片
                if(size == "auto"){
                    size = getSize();
                }

                if (size) {
                    var sizeReg = /zoom=[0-9]+/;
                    if (sizeReg.test(src)) {
                        if(size == "original"){//如果是原图去掉-size
                            src = src.replace(sizeReg, "isOriginal=1");
                        }else{
                            src = src.replace(sizeReg, "zoom=" + size);
                        }
                    } else {
                        if(size == "original"){//如果是原图去掉-size
                            src = src + "&isOriginal=1"
                        }else{
                            src = src + "&zoom=" + size;
                        }
                    }
                }
            }

            //根据父级布局尺寸计算size
            function getSize() {
                var jParent = element.parent(),
                    maxWidth = jParent.innerWidth(),
                    maxHeight = jParent.innerHeight(),
                    maxSize, //父级最大尺寸
                    percent = 3 / 4, //幅度比例
                    size = 0;

                while (maxWidth == 0) {
                    jParent = jParent.parent();
                    maxWidth = jParent.innerWidth();
                    maxHeight = jParent.innerHeight();
                }

                maxSize = (maxWidth > maxHeight ? maxWidth : maxHeight) * percent;

                for (var i = 0; i < PIC_SIZE_ARR.length; i++) {
                    var nSizeItem = PIC_SIZE_ARR[i];

                    //如果大于那个比例就用这个尺寸了
                    if (nSizeItem >= maxSize) {
                        size = nSizeItem;
                        break;
                    }
                }

                if (size == 0) {
                    size = PIC_SIZE_ARR[PIC_SIZE_ARR.length - 1];
                }

                return size;
            }

            return src;
        }
    };

    /*
     * 获取移动坐标信息
     */
    function fnGetTouchPosition(e) {
        var touches = e.changedTouches || e.originalEvent.changedTouches,
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

    //注册服务
    (function(){
        //页面跳转
        module.factory("btPage", [function() {
            /**
             * 判断是否在我们的app内
             * @return {Boolean}
             */
            function getIsInApp(){
                var defer = $.Deferred();
                if(window.wv){
                    return wv.getIsInApp();
                } else{
                    defer.reject();
                }
                return defer.promise();
            }

            /**
             * 获取网页跳转地址
             */
            function getWebUrl(config){
                if(config.params != undefined && typeof(config.params) == 'object'){
                    var paramsStr = $.param(config.params);

                    config.url += config.url.indexOf('?') > -1 ? "&" : "?";
                    config.url += paramsStr;
                }

                if(config.url.indexOf("/") == 0 && location.href.indexOf("#") > -1){ //app的项目路径是带井号的
                    config.url = "#" + config.url;
                }
            }

            /**
             * 获取当前环境应跳的url
             */
            function getWebFullUrl(config){
                if(config.url.indexOf('http') == 0){
                    return '';
                } else if(location.href.indexOf('http') != 0){ //当前页面不是已http形式访问
                    return '';
                }

                var isExistRoute = window.hasHref && hasHref(config.url);//当前h5应用是否存在要跳转的这个path
                if(!isExistRoute){
                    return '';
                }

                if(location.href.indexOf('#') > -1){
                    config.url = location.href.substr(0, location.href.indexOf('#') + 1) + config.url;
                } else{
                    config.url = location.origin + config.url;
                }

                return config.url;
            }

            var _service = {
                /**
                 * 转化参数为对象
                 * @param  {Object|String} config或者url
                 */
                _getArgus: function(config){
                    if(typeof(config) == 'string'){
                        config = {
                            url: config
                        };
                    }

                    return config;
                },
                /*
                 * 统一的页面跳转服务
                 * @param  {Object|String} config或者url
                 *         {
                 *             url: "/index",   //必传, 跳转的地址
                 *             type: 1,         //跳转类型，1先关闭后打开，0直接打开，默认不传为直接打开
                 *             title: "标题",    //要打开的页面的标题
                 *             params: {        //参数
                 *                 aa: 1,
                 *                 id: 2332
                 *             },
                 *             jsOnResume: function(){  //页面返回时候执行的回掉
                 *                 alert('这是页面返回时候调用的');
                 *             }
                 *         }
                 * @return {void}
                 */
                open: function(config){
                    var _this = this, config = _this._getArgus(config);

                    getIsInApp().then(
                        function(){
                            var url = getWebFullUrl(config);
                            if(url){
                                config.url = url;
                                wv.openWebPage(config);
                            } else{
                                wv.openPage(config);
                            }
                        },
                        function(){
                            getWebUrl(config);
                            location.href = config.url;
                        }
                    );
                },

                /**
                 * 打开全屏网页
                 * @param  {Object|String} config或者url 参数参考openPage方法
                 * @return {void}
                 */
                openFull: function(config){
                    var _this = this, config = _this._getArgus(config);

                    getIsInApp().then(
                        function(){
                            var url = getWebFullUrl(config);
                            if(url){
                                config.url = url;
                            }
                            wv.openFullPage(config);
                        },
                        function(){
                            getWebUrl(config);
                            location.href = config.url;
                        }
                    );
                }
            };

            return _service;
        }]);
    })();

    //注册指令
    (function(){
        /**
         * 打开state或者URL地址(支持ui-sref的写法，或者直接url地址)
         */
        module.directive('btSref', ["$state", "$stateParams", "btPage", function($state, $stateParams, btPage) {
            return {
                restrict:"A",
                priority: 2,
                scope: true,
                link: function ($scope, element, attrs, ctrl) {
                    var btSref = attrs.btSref,
                        config
                        ;

                    $(element).tap(function(){
                        if(btSref && btSref.indexOf('{') == 0 && btSref.lastIndexOf("}") == btSref.length - 1){//传的是一个对象
                            config = $scope.$eval(btSref);
                            if(config.openType){
                                config.type = config.openType;
                                delete config.openType;
                            }
                        } else{
                            config = {
                                url: attrs.btSref || "",        //url地址
                                type: attrs.openType || 0,      //在native中的打开方式，默认为直接打开
                                title: attrs.title || ""        //打开页面的标题（一般用于外部访问页面）
                            };
                        }

                        btPage.open(config);
                    });
                }
            }
        }]);

        //替代点击事件
        module.directive('tapHandler', [function() {
            return {
                restrict: "A",  //一共四种，分别是AECM
                link: function(scope, element, attr) {
                    var startX = 0, startY = 0, isMove = false;

                    var doFn = function(e){
                        scope.$apply(function() {
                            scope.$event = e;
                            scope.$eval(attr["tapHandler"]);
                        });
                    }

                    $(element).tap(doFn);
                }
            };
        }]);

        /**
         * 头像图片如果加载失败的话加载默认图片
         * modify by liting 当src为null或者空字符串时给默认图片
         */
        module.directive('headErrSrc', function() {
            return {
                restrict:"A",
                link: function (scope, element, attrs) {
                    var sSrc = attrs.ngSrc;
                    if (!sSrc && attrs.headErrSrc) {
                        attrs.$set('src', attrs["headErrSrc"]);
                    } else {
                        element.bind('error',function(){
                            if (sSrc != attrs["headErrSrc"]) {
                                attrs.$set('src', attrs["headErrSrc"]);
                            }
                        })
                    }
                }
            }
        });

        /**
         * ng-repeat渲染完成后执行回调
         * 指令的地方，必须标明callbacfn  回调函数名字
         */
        module.directive('onFinishRenderFilters', ["$timeout", function($timeout) {
            return {
                restrict:"A",
                scope: {callbackfn:'&'},
                link: function (scope, element, attrs) {
                    if(scope.$parent.$last == true){
                        $timeout(function () {
                            scope.callbackfn();
                        });
                    }
                }
            }
        }]);


        /**
         * 打开APP对应的页面，如果没下载的话就跳转到下载的页面去
         * 主要针对ios和Android,其他手机类型的直接跳下载页
         * iosDownUrl  ios下载地址 【选填】 默认连接到appstore
         * https://itunes.apple.com/cn/app/bei-tai-hao-che-er-shou-che/id1066750890?mt=08
         * androidDownUrl  安卓的下载地址 【选填】 默认连接到我们自己的下载页面
         * http://m.b2b.cheok.com/download.html
         */
        module.directive('openApp', [function() {
            return {
                restrict:"AC",
                // scope: {appUrl:'@'},
                link: function (scope, element, attrs) {
                    $(element).tap(function(){
                        openApp(attrs.openApp);
                        return false;
                    });
                }
            }
        }]);

        /**
         * 图片区域自适应（会自动补足公有图片和私有图片的前缀和请求的尺寸）
         */
        module.directive('btPic', ["$timeout", function($timeout) {
            var LOADING_CLASS = "loading",
                LOADED_CLASS = "loaded",
                ERR_CLASS = "loadError";//图片载入出错给其父容器加个className
            /**
             * 设置图片居中
             * @param {[Elem]} target 目标jq Elm
             * @param {[Object]} img    图片对象
             * @param {[String]} sSrc   图片地址
             */
            function _setPicCenter(target, img, sSrc){
                //function fnCallback() {
                var nMaxWidth = target.parent().innerWidth();
                var nMaxHeight =  target.parent().innerHeight();

                // if(img.width > nMaxWidth || img.height > nMaxHeight){//宽度或者高度有超出的情况
                if (img.width / img.height >= nMaxWidth / nMaxHeight) { //宽高比例偏大
                    // if(img.height > nMaxHeight){
                    img.width = img.width * (nMaxHeight / img.height);
                    img.height = nMaxHeight;
                    // }
                } else { //高宽比例偏大
                    // if(img.width > nMaxWidth || isHeightFixed){
                    // console.log(nMaxHeight,img.parent().html());
                    img.height = img.height * (nMaxWidth / img.width);
                    img.width = nMaxWidth;
                    // }
                }

                // }
                target.css({
                    display: "block",
                    position: "relative",
                    "transition": ".2s linear opacity",
                    "webkitTransition": ".2s linear opacity",
                    opacity: "1",
                    maxWidth: "none",
                    maxHeight: "none",
                    width: img.width + "px",
                    height: img.height + "px",
                    left: ((nMaxWidth - img.width) / 2) + "px",
                    top: ((nMaxHeight - img.height) / 2) + "px"
                })
                    .attr("src", sSrc)
                    .parent().css("overflow", "hidden");

                /*img.onload = null;
                 img.onerror = null;
                 img = null;*/
                // }
            };
            return {
                restrict: "AC",
                require: ["ngModel", "?^imgScroll"],
                /*scope: {
                 heightFixed: "@", //是否宽度撑满高度适配
                 errSrc: "@", //图片加载失败替换加载失败图片
                 preview: "@" //是否可以预览
                 },*/
                scope: false,
                transclude: true, //注意此处必须设置为true【为什么？】
                controller: ["$scope", "$element", "$attrs", "$transclude", function ($scope, $element, $attrs, $transclude) {
                    //在这里你可以注入你想注入的服务

                    // this.setPicCenter = _setPicCenter;

                    // this.getPicSizeUrl = _getPicSizeUrl;
                }],
                // compile: function(element, attr, transclude){
                //     return {
                //         pre: function(scope, element, attr, ctrls) {
                //             console.log("pre", ctrls);
                //         },
                //         post: function(scope, element, attr, ctrls) {
                //             console.log("post", ctrls);
                //         }
                //     }
                // },
                link: function($scope, element, attrs, ctrls) {
                    var ngModel = ctrls[0],
                        isInImgScroll = ctrls[1] != null, //是否在imgScroll指令内，如果父级是轮播图，就不要重新计算了
                        isLazyload = attrs.lazyload != undefined || element.hasClass('bt-lazyload'),
                        isCanPreview = attrs.preview != undefined ? (attrs.preview != 'false' ? true : false)  : false,
                        sDefaultErrorSrc = attrs.errSrc || './img/banner-defaultD.png'//加载出错的时候默认的图片
                        ;
                    // if (ngModel) {

                    ngModel.$render = function() {
                        renderPic(ngModel.$viewValue);
                    };
                    // } else {
                    //     var sSrcAttr;
                    //     if (attrs.ngSrc != undefined) {
                    //         sSrcAttr = "ngSrc";
                    //     } else if (attrs.src != undefined) {
                    //         sSrcAttr = "src";
                    //     }
                    //     if (sSrcAttr) {
                    //         attrs.$observe(sSrcAttr, function(value) {
                    //             renderPic(value);
                    //         });
                    //     }
                    // }

                    function renderPic(src) {
                        element.removeAttr("src");
                        // if (!src) {
                        //     return;
                        // }
                        var sErrSrc = attrs.errSrc != undefined ? sDefaultErrorSrc : '',
                            sSrc = src || sErrSrc,
                            // sSrc = src || "",
                            nSize = attrs.size, //显示的图片尺寸(100,300,700)，如果传auto，会根据父级尺寸计算合适尺寸
                            isHeightFixed = attrs.heightFixed != undefined || false, //是否高度固定
                            nInitWinWidth = 0,
                            jParentBox = element.parent(),
                            nPreviewSize = attrs.previewSize || '700' //预览查看原图有大小的尺寸  默认700
                            ;

                        sSrc = _util.getPicSizeUrl(sSrc, element, nSize);

                        //居中已由图片滚动实现，这里不要重复执行
                        if (isInImgScroll) {
                            element.attr({
                                defaultSrc: sSrc, //这个是默认尺寸的图片，根据屏幕当前尺寸适当取用某个尺寸
                                originSrc: _util.getPicSizeUrl(sSrc, element, nPreviewSize) //大图，用于预览使用
                            });

                            return;
                        }
                        //如果使用了懒加载，则图片加载由懒加载自己实现
                        if(isLazyload){
                            return;
                        }

                        function resizePic() {
                            if (nInitWinWidth > 0 && nInitWinWidth == $(window).width()) { //宽度没改变的话，不重新计算
                                return;
                            }
                            nInitWinWidth = $(window).width();

                            if (element.attr("src") != sSrc) {
                                element.css({
                                    "opacity": "0"
                                });
                            }
                            if(isCanPreview){
                                element.attr({
                                    "defaultSrc": sSrc,
                                    "originSrc": _util.getPicSizeUrl(sSrc, element, nPreviewSize)//modify by dongxiaochai@163.com 都改成700，否则有些预览的用的还是小图不清晰
                                });
                            }

                            jParentBox.addClass(LOADING_CLASS);
                            var img = new Image();
                            img.src = sSrc;

                            if (img.complete) { // 如果图片已经存在于浏览器缓存，直接调用回调函数
                                $timeout(_fnLoadSuccess, 0, false);
                                return;
                            }
                            img.onload = function() {
                                $timeout(_fnLoadSuccess, 0, false);
                            };
                            img.onerror = function() {
                                $timeout(_fnLoadError, 0, false);
                            };

                            function _fnLoadSuccess (){
                                _setPicCenter(element, img, sSrc);

                                jParentBox.removeClass(LOADING_CLASS).addClass(LOADED_CLASS);
                                _destoryImg();
                            }

                            function _fnLoadError(){
                                sSrc = sErrSrc;
                                if (sErrSrc && img.src != sErrSrc) {
                                    img.src = sErrSrc;
                                    jParentBox.removeClass(LOADING_CLASS).addClass(ERR_CLASS);

                                    if (img.complete) { // 如果图片已经存在于浏览器缓存，直接调用回调函数
                                        _setPicCenter(element, img, sSrc);
                                        _destoryImg();
                                    } else{
                                        img.onload = function(){
                                            _setPicCenter(element, img, sSrc);
                                            _destoryImg();
                                        };
                                    }
                                } else{
                                    _destoryImg();
                                    jParentBox.removeClass(LOADING_CLASS).addClass(ERR_CLASS);
                                }
                            }

                            function _destoryImg(){
                                img.onload = null;
                                img.onerror = null;
                                img = null;
                            }
                        }

                        resizePic();
                        $(window).on("resize", resizePic);
                    }
                }
            }
        }]);

        /**
         * 图片懒加载
         */
        module.directive('btLazyload', ["$timeout", function($timeout) {
            return {
                restrict:"CA",
                priority: 2,
                require: ["ngModel", "?btPic"],
                scope: {
                    lazyFn:"&",
                    errSrc: "@",
                    preview: "@"
                },
                link: function ($scope, element, attrs, ctrls) {
                    var ngModel = ctrls[0],
                        isBtPic = ctrls[1] != null,
                        isPreview = $scope.preview != undefined ? ($scope.preview == "false" ? false : true) : false,
                        sDefaultErrorSrc = attrs.errSrc || './img/banner-defaultD.png'//加载出错的时候默认的图片
                        ;
                    var renderHandler = ngModel.$render;

                    ngModel.$render = function() {
                        renderPic(ngModel.$viewValue);
                    };

                    function renderPic(src){
                        if(!src){
                            return;
                        }
                        var sSrc = _util.getPicSizeUrl(src, element, attrs.size);
                        element
                            .removeAttr("src")
                            .attr({
                                defaultSrc: sSrc
                            })
                        ;

                        require(["imgLazyload"], function(ImgLazyload){
                            new ImgLazyload({
                                imgTarget: element,
                                lazyFn: renderHandler,
                                threshold: 0,
                                autoLoad: !isBtPic,
                                errSrc: attrs.errSrc != undefined ? sDefaultErrorSrc : ''
                            })
                        });
                    }
                }
            }
        }]);

        /**
         * 滚动盒子
         */
        module.directive('myScroll', ["$timeout", function($timeout) {
            var DEFAULT_CONFIG = {
                    useTransition: true,
                    topOffset: 0,
                    hideScrollbar: true
                    // ,
                    // vScrollbar: false
                }
                ;
            return {
                restrict:"AC",
                scope: {
                    loadMark: "="//,              //必需，加载标示计数，用来识别加载结束事件（请动态加1）
                    // onScrolling: "&"            //滚动中事件
                },
                link: function ($scope, element, attrs) {
                    $scope.loadMark = $scope.loadMark || 0;

                    var jWrapper = element,
                        jScrollBody = jWrapper.find(">*:first").css("minHeight", "100%"),
                        jMainBody = jWrapper.find(">*:first")
                        ;

                    require(["iscroll"], function(iScroll){
                        var myScroll,
                            config = {
                                // onScrolling: $scope.onScrolling,
                                // onScrolling: function(){console.log(5464);},
                                onRefresh: function () {
                                    // $scope.onRefresh && $scope.onRefresh();
                                },
                                onScrollMove: function () {
                                    // var _this = this,
                                    //     moveY = _this.y + config.topOffset
                                    // ;
                                },
                                onScrollEnd: function () {
                                    // var _this = this,
                                    //     moveY = _this.y + config.topOffset
                                    // ;
                                    // $scope.onScrolling && $scope.onScrolling();
                                }
                            };

                        /**
                         * 刷新
                         * @return {void}
                         */
                        function _refresh(){
                            $timeout(function(){
                                myScroll && myScroll.refresh();
                            }, 200, false);
                        }

                        /**
                         * 初始化
                         */
                        function _init(){
                            myScroll = new iScroll(jWrapper.get(0), $.extend({}, DEFAULT_CONFIG, config));

                            $scope.$watch("loadMark", function(newData, oldData){
                                if($scope.loadMark > 0){
                                    _refresh();
                                }
                            }, true);
                        }

                        _init();
                    });
                }
            }
        }]);

        /**
         * 滚动分页加载
         */
        module.directive('myScrollPager', ["$timeout", function($timeout) {
            var LOADING_TOP_HTML =
                    '<div id="pullDown" class="flip loading">'+
                    '<span class="pullDownIcon"></span><span class="pullDownLabel"></span>'+
                    '</div>',
                LOADING_BOTTOM_HTML =
                    '<div id="pullUp" class="loading">'+
                    '<span class="pullUpIcon"></span><span class="pullUpLabel"></span>'+
                    '</div>'
                ;
            return {
                restrict:"AC",
                require: "ngModel", //当前分页
                scope: {
                    isFixed: "@",               //容器是否固定的(非固定容器，暂时是不支持下拉刷新~~)
                    getDataFn: "&",             //必需，数据初始化回调
                    loadMark: "=",              //必需，加载标示计数，用来识别加载结束事件（请动态加1）
                    canPullUp: "=",             //非必需，是否支持上拉加载更多
                    canPullDown: "=",           //非必需，是否支持下拉刷新（默认支持）（非固定模式默认是可以下拉的）
                    targetElement: "@",         //非必需，目标元素（用来存放上下加载拉节点的）
                    pageCount: "=",             //必需，总页数
                    isValid: "=",               //非必需，是否无效，默认有效
                    beginPage: "@",              //非必需，第一页是从几开始，默认0是第一页
                    onScrolling: "&"           //非必需，滚动中事件
                },
                link: function ($scope, element, attrs, ngModel) {
                    /**
                     * 会导致出现两个jBottom jTop   就不添加了
                     * 原因  列表初始化会再一次触发ngModel.render(),
                     * 会导致出现两个jBottom jTop,会导致出现两个jBottom jTop
                     * modify by ashaLiu 2016.12.8
                     */
                    var jTop,
                        jBottom,
                        sTargetElement = $scope.targetElement || ">*:first",
                        jWrapper = element,
                        jScrollBody = jWrapper.find(">*:first").css("minHeight", "100%"),//第一个元素如果不比容器大，内容少的时候会导致无法滚动
                        jMainBody = jWrapper.find(sTargetElement),
                        isFixed = $scope.isFixed || true,//如果不传或者为true，表示用iscroll固定布局内进行滚动，否则用普通的滚动区域请求方式
                        sTopHtml = LOADING_TOP_HTML,
                        sBottomHtml = LOADING_BOTTOM_HTML,
                        myPager
                        ;
                    $scope.getDataFn = $scope.getDataFn || function(){};
                    $scope.loadMark = $scope.loadMark || 0;

                    if(jWrapper.is("ul")){
                        sTopHtml = sTopHtml.replace(/div/ig, "li");
                        sBottomHtml = sBottomHtml.replace(/div/ig, "li");
                    }

                    /**
                     * 分页器
                     */
                    function MyPager(config){
                        this.beginPage = $scope.beginPage || 0 >> 0;//第一页开始页号
                        this.pageIndex = ngModel.$viewValue - this.beginPage + 1;//真实分页号（第一页为1）

                        this.onLoadFinish = config.onLoadFinish;
                        this.upPullBindler = config.upPullBindler;

                        this._setWatcher();

                        if($scope.isValid !== false){
                            $scope.getDataFn && $scope.getDataFn();
                        }
                    }
                    MyPager.prototype = {
                        isLoading: false,       //是否请求加载中，如果还在请求中，需要拦截重复请求
                        hasNextPage: false,     //是否有下一页
                        onLoadFinish: null,     //数据加载完需要执行的回调函数
                        upPullBindler: null,    //上拉绑定器
                        /**
                         * 设置加载标示监视器
                         */
                        _setWatcher: function(){
                            var _this = this;

                            $scope.$watch("loadMark", function(newData, oldData){
                                if($scope.loadMark > 0){
                                    myPager.hasNextPage = false;
                                    myPager.isLoading = false;

                                    if($scope.canPullUp !== false){
                                        //底部的判断
                                        if($scope.pageCount === 0){//无数据
                                            jBottom && jBottom.remove();
                                        } else{//有数据
                                            if(!jBottom){
                                                jBottom = $(sBottomHtml).appendTo(jMainBody);
                                                _this.upPullBindler && _this.upPullBindler();
                                            }
                                            jBottom.show();
                                            if(myPager.pageIndex >= $scope.pageCount){//已经到底
                                                jBottom.find(".pullUpIcon").hide().end().find(".pullUpLabel").html("已经到底啦~");
                                            } else{
                                                jBottom.find(".pullUpIcon").show().end().find(".pullUpLabel").html("");
                                                myPager.hasNextPage = true;
                                            }
                                        }
                                    }

                                    _this.onLoadFinish && _this.onLoadFinish();
                                }
                                // else{
                                //     jBottom && jBottom.remove();
                                //     jBottom = null;
                                // }

                            }, true);
                        },
                        /**
                         * 刷新当前列表，读取第一页
                         * @return this
                         */
                        resetPage: function(){
                            var _this = this;

                            if(_this.isLoading){
                                return;
                            }

                            ngModel.$setViewValue(_this.beginPage);
                            _this.pageIndex = ngModel.$viewValue - _this.beginPage + 1;

                            //如果有底部，先隐藏，否则会出现两个滚轮显示不友好
                            jBottom && jBottom.hide();

                            _this.isLoading = true;
                            $scope.getDataFn && $scope.getDataFn();

                            return _this;
                        },
                        /**
                         * 加载下一页
                         * @return this
                         */
                        getNextPage: function(){
                            var _this = this;

                            if(_this.isLoading || !myPager.hasNextPage){
                                return;
                            }

                            ngModel.$setViewValue(ngModel.$viewValue + 1);
                            _this.pageIndex = ngModel.$viewValue - _this.beginPage + 1;

                            _this.isLoading = true;
                            $scope.getDataFn && $scope.getDataFn();

                            return _this;
                        }
                    };

                    ngModel.$render = function(){
                        if(!isFixed || isFixed == "false"){//先用简单jquery实现不用iscroll

                            function _bindScrollHandler(){
                                //滚动加载更多
                                function fnScrollHandler(e){
                                    if(jBottom == null || $scope.isValid === false){
                                        return;
                                    }
                                    var jPullUpIcon = jBottom.find(".pullUpIcon"),
                                        hasMore = $scope.pageCount > myPager.pageIndex,
                                        isInView
                                        ;

                                    isInView = jPullUpIcon.offset().top - $(window).scrollTop() < $(window).height() + 20;
                                    if(isInView && hasMore){
                                        myPager.getNextPage();
                                    }
                                }

                                // fnScrollHandler();

                                $(window).on("scroll", fnScrollHandler);
                            }

                            myPager = new MyPager({
                                upPullBindler: _bindScrollHandler
                            });
                        } else{
                            require(["iscroll5"], function(iScroll){
                                var myScroll,
                                    config = {
                                        disableMouse: true, //是否关闭鼠标事件探测
                                        disablePointer: false,//是否关闭指针事件探测
                                        // bounce: false,//是否支持回弹
                                        mouseWheel: false,//是否监听鼠标滚轮事件
                                        scrollbars: true,//是否显示默认滚动条
                                        fadeScrollbars: true,//是否渐隐滚动条，关掉可以加速
                                        click: false,
                                        probeType: Util.isBadAndroid ? 1 : 2   //这个属性是调节在scroll事件触发中探针的活跃度或者频率。有效值有：1, 2, 3。数值越高表示更活跃的探测（性能越差）。
                                    },
                                    topOffset = 0
                                    ;
                                //阻止移动默认事件 不加这个的话有的机型卡顿（不要用jq的方式绑定，否则会导致touch事件都被拦截）
                                element.get(0).addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

                                /**
                                 * 刷新iScroll
                                 */
                                function _refresh(){
                                    $timeout(function(){
                                        if (jTop && jTop.is('.loading')) {
                                            jTop.removeClass("flip").removeClass("loading");//find(".pullDownLabel").html("下拉刷新");

                                            myScroll && myScroll.scrollTo(0, -topOffset, 500);
                                        } else if(jBottom){
                                            jBottom.removeClass("flip");
                                        }
                                        myScroll && myScroll.refresh();
                                    }, 200, false);
                                }

                                // /**
                                //  * 销毁iScroll
                                //  */
                                // function _destroy(){
                                //     jTop && jTop.remove();
                                //     jTop = null;
                                //     jBottom && jBottom.remove();
                                //     jBottom = null;
                                //     myScroll && myScroll.destroy();
                                //     myScroll = null;
                                // }

                                /**
                                 * 初始化
                                 */
                                function _initIScroll(){
                                    if($scope.canPullDown !== false){
                                        if(!jTop){
                                            jTop = $(sTopHtml).prependTo(jScrollBody);
                                        }

                                        topOffset = jTop.outerHeight();
                                    } else{
                                        topOffset = 0;
                                    }

                                    myPager = new MyPager({
                                        onLoadFinish: _refresh
                                    });

                                    config.topOffset = topOffset;
                                    myScroll = new iScroll(jWrapper.css("overflow", "hidden").get(0), config);
                                    /**
                                     * 产品要求第一次加载列表的时候
                                     * 主动实现顶部pullDown loading不出现
                                     */
                                    myScroll && myScroll.scrollTo(0, -topOffset, 0);
                                    myScroll.on('scroll', function(){
                                        var _this = this,
                                            moveY = _this.y + topOffset
                                            ;

                                        if(myPager.isLoading){
                                            return;
                                        }

                                        if (jTop && moveY > topOffset && !jTop.is('.flip')) {
                                            jTop.addClass("flip");//.find(".pullDownLabel").html("释放刷新");
                                            _this.minScrollY = 0;
                                        } else if(jBottom && myPager.hasNextPage && moveY < 0 && !jBottom.is(".flip")){
                                            if (moveY < _this.maxScrollY + topOffset + jBottom.outerHeight()) {
                                                // _this.maxScrollY = topOffset;
                                                jBottom.addClass("flip");
                                            }
                                        }

                                        $scope.onScrolling && $scope.onScrolling();
                                    });

                                    myScroll.on("scrollEnd", function(){
                                        var _this = this,
                                            moveY = _this.y + topOffset
                                            ;
                                        if(myPager.isLoading){
                                            return;
                                        }

                                        if (jTop && jTop.is('.flip')) {
                                            jTop.addClass("loading");//.find('.pullDownLabel').html("加载中...");

                                            myPager.resetPage();
                                        } else if(jBottom && myPager.hasNextPage){
                                            if ((moveY < 0 && moveY < _this.maxScrollY + topOffset + jBottom.outerHeight()) || jBottom.is(".flip")) {
                                                jBottom.addClass("loading");//.find('.text').html("加载中");

                                                myPager.getNextPage();
                                            }
                                        }

                                        window.lazyloadHandler && window.lazyloadHandler();//主动触发懒加载验证
                                    });
                                }

                                _initIScroll();
                            });
                        }
                    };
                }
            }
        }]);

        /**
         * 滚动分页加载（老的iscroll4方式，以防万一先保留）
         */
        module.directive('myScrollPagerOld', ["$timeout", function($timeout) {
            var LOADING_TOP_HTML =
                    '<div id="pullDown" class="flip loading">'+
                    '<span class="pullDownIcon"></span><span class="pullDownLabel"></span>'+
                    '</div>',
                LOADING_BOTTOM_HTML =
                    '<div id="pullUp" class="loading">'+
                    '<span class="pullUpIcon"></span><span class="pullUpLabel"></span>'+
                    '</div>'
                ;
            return {
                restrict:"AC",
                require: "ngModel", //当前分页
                scope: {
                    isFixed: "@",               //容器是否固定的(非固定容器，暂时是不支持下拉刷新~~)
                    getDataFn: "&",             //必需，数据初始化回调
                    loadMark: "=",              //必需，加载标示计数，用来识别加载结束事件（请动态加1）
                    canPullUp: "=",             //非必需，是否支持上拉加载更多
                    canPullDown: "=",           //非必需，是否支持下拉刷新（默认支持）（非固定模式默认是可以下拉的）
                    targetElement: "@",         //非必需，目标元素（用来存放上下加载拉节点的）
                    pageCount: "=",             //必需，总页数
                    // onScrolling: "&",           //非必需，滚动中事件
                    isValid: "=",             //非必需，是否无效，默认有效
                    beginPage: "@"              //非必需，第一页是从几开始，默认0是第一页
                },
                link: function ($scope, element, attrs, ngModel) {
                    /**
                     * 会导致出现两个jBottom jTop   就不添加了
                     * 原因  列表初始化会再一次触发ngModel.render(),
                     * 会导致出现两个jBottom jTop,会导致出现两个jBottom jTop
                     * modify by ashaLiu 2016.12.8
                     */
                    var jTop,
                        jBottom,
                        sTargetElement = $scope.targetElement || ">*:first",
                        jWrapper = element,
                        jScrollBody = jWrapper.find(">*:first").css("minHeight", "100%"),
                        jMainBody = jWrapper.find(sTargetElement),
                        isFixed = $scope.isFixed || true,//如果不传或者为true，表示用iscroll固定布局内进行滚动，否则用普通的滚动区域请求方式
                        sTopHtml = LOADING_TOP_HTML,
                        sBottomHtml = LOADING_BOTTOM_HTML,
                        myPager
                        ;
                    $scope.getDataFn = $scope.getDataFn || function(){};
                    $scope.loadMark = $scope.loadMark || 0;

                    if(jWrapper.is("ul")){
                        sTopHtml = sTopHtml.replace(/div/ig, "li");
                        sBottomHtml = sBottomHtml.replace(/div/ig, "li");
                    }

                    /**
                     * 分页器
                     */
                    function MyPager(config){
                        this.beginPage = $scope.beginPage || 0 >> 0;//第一页开始页号
                        this.pageIndex = ngModel.$viewValue - this.beginPage + 1;//真实分页号（第一页为1）

                        this.onLoadFinish = config.onLoadFinish;
                        this.upPullBindler = config.upPullBindler;

                        this._setWatcher();

                        if($scope.isValid !== false){
                            $scope.getDataFn && $scope.getDataFn();
                        }
                    }
                    MyPager.prototype = {
                        isLoading: false,       //是否请求加载中，如果还在请求中，需要拦截重复请求
                        hasNextPage: false,     //是否有下一页
                        onLoadFinish: null,     //数据加载完需要执行的回调函数
                        upPullBindler: null,    //上拉绑定器
                        /**
                         * 设置加载标示监视器
                         */
                        _setWatcher: function(){
                            var _this = this;

                            $scope.$watch("loadMark", function(newData, oldData){
                                if($scope.loadMark > 0){
                                    myPager.hasNextPage = false;
                                    myPager.isLoading = false;

                                    if($scope.canPullUp !== false){
                                        //底部的判断
                                        if($scope.pageCount === 0){//无数据
                                            jBottom && jBottom.remove();
                                        } else{//有数据
                                            if(!jBottom){
                                                jBottom = $(sBottomHtml).appendTo(jMainBody);
                                                _this.upPullBindler && _this.upPullBindler();
                                            }
                                            jBottom.show();
                                            if(myPager.pageIndex >= $scope.pageCount){//已经到底
                                                jBottom.find(".pullUpIcon").hide().end().find(".pullUpLabel").html("没有更多了..");
                                            } else{
                                                jBottom.find(".pullUpIcon").show().end().find(".pullUpLabel").html("");
                                                myPager.hasNextPage = true;
                                            }
                                        }
                                    }
                                } else{
                                    jBottom && jBottom.remove();
                                    jBottom = null;
                                }

                                _this.onLoadFinish && _this.onLoadFinish();
                            }, true);
                        },
                        /**
                         * 刷新当前列表，读取第一页
                         * @return this
                         */
                        resetPage: function(){
                            var _this = this;

                            if(_this.isLoading){
                                return;
                            }

                            ngModel.$setViewValue(_this.beginPage);
                            _this.pageIndex = ngModel.$viewValue - _this.beginPage + 1;

                            //如果有底部，先隐藏，否则会出现两个滚轮显示不友好
                            jBottom && jBottom.hide();

                            _this.isLoading = true;
                            $scope.getDataFn && $scope.getDataFn();

                            return _this;
                        },
                        /**
                         * 加载下一页
                         * @return this
                         */
                        getNextPage: function(){
                            var _this = this;

                            if(_this.isLoading || !myPager.hasNextPage){
                                return;
                            }

                            ngModel.$setViewValue(ngModel.$viewValue + 1);
                            _this.pageIndex = ngModel.$viewValue - _this.beginPage + 1;

                            _this.isLoading = true;
                            $scope.getDataFn && $scope.getDataFn();

                            return _this;
                        }
                    };

                    ngModel.$render = function(){
                        if(!isFixed || isFixed == "false"){//先用简单jquery实现不用iscroll
                            function _bindScrollHandler(){
                                //滚动加载更多
                                function fnScrollHandler(e){
                                    if(jBottom == null || $scope.isValid === false){
                                        return;
                                    }
                                    var jPullUpIcon = jBottom.find(".pullUpIcon"),
                                        hasMore = $scope.pageCount > myPager.pageIndex,
                                        isInView
                                        ;

                                    isInView = jPullUpIcon.offset().top - $(window).scrollTop() < $(window).height() + 20;
                                    if(isInView && hasMore){
                                        myPager.getNextPage();
                                    }
                                }

                                // fnScrollHandler();

                                $(window).on("scroll", fnScrollHandler);
                            }

                            myPager = new MyPager({
                                upPullBindler: _bindScrollHandler
                            });
                        } else{
                            require(["iscroll"], function(iScroll){
                                var myScroll,
                                    DEFAULT_CONFIG = {
                                        // useTransform: true,
                                        useTransition: true,
                                        topOffset: 0,
                                        hideScrollbar: true
                                        // ,
                                        // vScrollbar: false
                                    },
                                    config = {
                                        // onScrolling: $scope.onScrolling,
                                        // onScrolling: function(){console.log(5464);},
                                        // onRefresh: function () {
                                        //     // $scope.onRefresh && $scope.onRefresh();
                                        // },
                                        onScrollMove: function () {
                                            var _this = this,
                                                moveY = _this.y + config.topOffset
                                                ;
                                            if(myPager.isLoading){
                                                return;
                                            }

                                            if (jTop && moveY > 5 && !jTop.is('.flip')) {
                                                jTop.addClass("flip");//.find(".pullDownLabel").html("释放刷新");
                                                _this.minScrollY = 0;
                                            } else if(jBottom && myPager.hasNextPage && moveY < 0 && !jBottom.is(".flip")){
                                                if (moveY < _this.maxScrollY + config.topOffset + jBottom.outerHeight()) {
                                                    _this.maxScrollY = config.topOffset;
                                                    jBottom.addClass("flip");
                                                }
                                            }
                                        },
                                        onScrollEnd: function () {
                                            var _this = this,
                                                moveY = _this.y + config.topOffset
                                                ;
                                            if(myPager.isLoading){
                                                return;
                                            }
                                            // $scope.onScrolling && $scope.onScrolling();

                                            if (jTop && jTop.is('.flip')) {
                                                jTop.addClass("loading");//.find('.pullDownLabel').html("加载中...");

                                                myPager.resetPage();
                                            } else if(jBottom && myPager.hasNextPage){
                                                if ((moveY < 0 && moveY < _this.maxScrollY + config.topOffset + jBottom.outerHeight()) || jBottom.is(".flip")) {
                                                    jBottom.addClass("loading");//.find('.text').html("加载中");

                                                    myPager.getNextPage();
                                                }
                                            }
                                        }
                                    };

                                /**
                                 * 刷新iScroll
                                 */
                                function _refresh(){
                                    $timeout(function(){
                                        if (jTop && jTop.is('.loading')) {
                                            jTop.removeClass("flip").removeClass("loading");//.find(".pullDownLabel").html("下拉刷新");
                                        } else if(jBottom){
                                            jBottom.removeClass("flip");
                                        }
                                        myScroll && myScroll.refresh();
                                    }, 200, false);
                                }

                                // /**
                                //  * 销毁iScroll
                                //  */
                                // function _destroy(){
                                //     jTop && jTop.remove();
                                //     jTop = null;
                                //     jBottom && jBottom.remove();
                                //     jBottom = null;
                                //     myScroll && myScroll.destroy();
                                //     myScroll = null;
                                // }

                                /**
                                 * 初始化
                                 */
                                function _initIScroll(){
                                    if($scope.canPullDown !== false){
                                        if(!jTop){
                                            jTop = $(sTopHtml).prependTo(jScrollBody);
                                        }

                                        config.topOffset = jTop.outerHeight();
                                    } else{
                                        config.topOffset = 0;
                                    }

                                    myPager = new MyPager({
                                        onLoadFinish: _refresh
                                    });

                                    myScroll = new iScroll(jWrapper.get(0), $.extend({}, DEFAULT_CONFIG, config));
                                }

                                _initIScroll();
                            });
                        }
                    };
                }
            }
        }]);

        /**
         * 内容切换盒子
         */
        module.directive('slideBox', ["$timeout", function($timeout) {
            return {
                restrict:"C",
                scope: {
                    index: "=",         //当前播放索引（0开始）
                    onChange: "&"       //
                },
                link: function ($scope, element, attrs) {
                    var nCount = element.find(">*").length,
                        nBoxMinHeight = 1,  //盒子最小高度
                        nBoxWidth, //盒子宽度
                        rAF = window.requestAnimationFrame||
                            window.webkitRequestAnimationFrame||
                            window.mozRequestAnimationFrame||
                            window.oRequestAnimationFrame||
                            window.msRequestAnimationFrame||
                            function(callback){
                                window.setTimeout(callback, 1000 / 60)
                            },
                        nDuration = 200//ms为单位
                        ;

                    $scope.index = Number($scope.index); //指令的数据传递是会转换成字符串的

                    function fnResize(){
                        if(attrs.calcExcludeHeight){
                            nBoxMinHeight = $(window).height() - attrs.calcExcludeHeight;
                            element.css({
                                minHeight: nBoxMinHeight + "px"
                            });
                        }

                        nBoxWidth = element.parent().css({
                            overflowX: "hidden"
                            //position:"relative"
                        }).innerWidth();

                        element
                            .addClass("ks-clear")
                            .css({
                                width: (nBoxWidth * nCount) + "px",
                                // position: "relative",
                                // left: "0px",
                                // top: "0px",
                                transform: "translateX(-" + (nBoxWidth * $scope.index) + "px)",
                                webkitTransform: "translateX(-" + (nBoxWidth * $scope.index) + "px)",
                                transition: "transform "+ nDuration +"ms linear",
                                webkitTransition: "-webkit-transform "+ nDuration +"ms linear"
                                //position: "absolute"
                                // ,
                                // display: "table-row"
                            })
                            .find(">*").css({
                            width: (100 / nCount) + "%",
                            minHeight: nBoxMinHeight + "px",
                            float: "left",
                            // display: "table-cell",
                            // minHeight: "100%",
                            position: "relative"
                        })
                        ;
                    }
                    fnResize();

                    $(window).resize(fnResize);
                    $scope.$watch("index", function(newData, oldData){
                        setAnimate(- nBoxWidth * $scope.index, nDuration);
                    });
                    /*
                     * 禁止整个浏览器溢出拖动(手机端)
                     */
                    /*(function forbidOverMove(){
                     element.ontouchmove = function(e){
                     e.preventDefault && e.preventDefault();
                     e.returnValue = false;
                     e.stopPropagation && e.stopPropagation();
                     return false;
                     }
                     })();*/
                    /**
                     * 增加tab选项卡左右滑动的功能
                     * modify by ashaLiu 2016-11-9
                     */

                    function _bindTouchEvent(){
                        var oThis = this;

                        oThis._bIsTouch = false;
                        oThis._sTouchType = '';

                        element
                            .on('touchstart',_fnTouchStart)
                            .on('touchmove',_fnTouchMove)
                            .on('touchend',_fnTouchEnd);
                    };

                    //定义了onchange事件才绑定水平移动事件
                    var isAndroid = new RegExp(/Android/ig).test(navigator.userAgent);
                    if(attrs.onChange != undefined && !isAndroid){
                        _bindTouchEvent();
                    }
                    /**
                     * 获取移动坐标信息
                     *
                     * @method
                     * @reurn {void}
                     */
                    function _fnGetTouchPosition(e) {
                        var touches = e.changedTouches || e.originalEvent.changedTouches,
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
                    };
                    /**
                     * 开始事件
                     *
                     * @method
                     * @reurn {void}
                     */
                    function _fnTouchStart(e) {
                        var oThis = this,
                            oMove = _fnGetTouchPosition(e)
                            ;
                        oThis.sTouchType = '';
                        oThis._bIsTouch = true;

                        oThis._StartX = oMove.x;
                        oThis._StartY = oMove.y;

                    };
                    /**
                     * 移动事件
                     *
                     * @method
                     * @reurn {void}
                     */
                    function _fnTouchMove(e) {
                        var oThis = this,
                            oMove = _fnGetTouchPosition(e)
                            ;

                        if(!oThis._bIsTouch){
                            return;
                        }
                        //手指离开之后，手开始到结束的距离
                        oThis._MoveX = oMove.x - oThis._StartX;
                        oThis._MoveY = oMove.y - oThis._StartY;

                        var nMoveXYCompare = Math.abs(oThis._MoveX) - (Math.abs(oThis._MoveY) * 2);
                        if(!oThis.sTouchType){
                            oThis.sTouchType = nMoveXYCompare > 0 ? 'horizontal' : 'vertical';
                        }

                        if(oThis.sTouchType == 'horizontal'){
                            //如果响应水平切换的话，阻止默认行为以及阻止冒泡到isscroll5的touchmove事件
                            e.stopPropagation && e.stopPropagation();
                            e.preventDefault && e.preventDefault();

                            setAnimate(- nBoxWidth * $scope.index + oThis._MoveX, 0);
                        }
                    };
                    /**
                     * 结束事件
                     *
                     * @method
                     * @reurn {void}
                     */
                    function _fnTouchEnd(e) {
                        var oThis = this,
                            oMove = _fnGetTouchPosition(e)
                            ;

                        //手指离开之后，手开始到结束的距离
                        oThis._MoveX = oMove.x - oThis._StartX;
                        oThis._MoveY = oMove.y - oThis._StartY;

                        //忽略手指纵向滚动
                        /*if(Math.abs(oThis._MoveY) >= Math.abs(oThis._MoveX)){
                         return;
                         }*/

                        //忽略移动距离比较小
                        /*if(Math.abs(oThis._MoveX) < 120){
                         return;
                         }*/
                        if(oThis.sTouchType == 'horizontal'){
                            if (oThis._MoveX > 0) {
                                //手指向右滑动(右移)
                                if($scope.index == 0 || oThis._MoveX < 50){//当前是第一页，或者横向移动小于50
                                    setAnimate(- nBoxWidth * $scope.index, nDuration);
                                } else{
                                    var nIndex = $scope.index == 0 ? 0 : $scope.index - 1;

                                    $scope.onChange({index: nIndex});

                                    $scope.$apply(function(){
                                        $scope.index = nIndex;
                                    });
                                }
                            } else {
                                //手指向左滑动(左移)
                                if($scope.index == nCount - 1 || - oThis._MoveX < 50){//当前是最后一页，或者竖向移动小于50
                                    setAnimate(- nBoxWidth * $scope.index, nDuration);
                                } else{
                                    var nIndex = $scope.index == nCount - 1 ? nCount - 1 : $scope.index + 1;

                                    $scope.onChange({index: nIndex});

                                    $scope.$apply(function(){
                                        $scope.index = nIndex;
                                    });
                                    // setAnimate(- nBoxWidth * nIndex, nDuration, nIndex);
                                }
                            }
                        }

                    };
                    /**
                     * 移动切换动画
                     * @param  {Float} moveX   X轴位移
                     * @param  {Integer} duration 动画时间
                     * @return {void}
                     */
                    function setAnimate(moveX, duration){
                        var duration = duration ? duration : 0;
                        rAF(function(){
                            element.css({
                                transitionDuration: duration + "ms",
                                webkitTransitionDuration:  duration + "ms",
                                transform: "translate3d(" + moveX + "px, 0px, 0px)",
                                webkitTransform: "translate3d(" + moveX + "px, 0px, 0px)"
                            })
                                .find(">*")
                                .css({
                                    "height": "auto",
                                    "opacity": "1",
                                    "filter": "alpha(opacity=100)",
                                    "overflow": "visible"
                                })
                            ;
                        });
                        //
                        if(duration > 0){
                            $timeout(function(){
                                element.find(">*")
                                    .eq($scope.index).siblings().css({
                                    "height": nBoxMinHeight + "px",
                                    "opacity": "0",
                                    "filter": "alpha(opacity=0)",
                                    "overflow": "hidden"
                                })
                                ;
                            }, duration, false);
                        }
                    };
                }
            }
        }]);

        /**
         * 高度自适应指令
         */
        module.directive('btFlexHeight', ["$state", "$stateParams", function($state, $stateParams) {
            return {
                restrict:"AC",
                priority: 1,
                link: function ($scope, element, attrs, ctrl) {
                    var nHeight = attrs.btFlexHeight || element.height();
                    function _resize(){
                        var fWidthRate = $(window).width() / 375;

                        element.height(nHeight * fWidthRate);
                    }

                    _resize();
                    $(window).on("resize", _resize);
                }
            }
        }]);

        /**
         * 轮播图指令
         */
        module.directive('imgScroll', ["$timeout", function($timeout) {
            return {
                restrict:"AC",
                scope: {
                    isInit: "=",    //是否已初始化，如果不设置这个值，默认初始化
                    flexable: "@",    //是否弹性适配高度
                    index: "=",         //当前播放索引（0开始）
                    fixedWidth: "@",    //固定宽度
                    fixedHeight: "@",   //固定高度，以375的宽度为基准，会因屏幕宽度调整而适配
                    loop: "@",          //是否循环滚动
                    auto: "@",          //是否自动播放
                    preview: "@",       //是否可预览
                    onSwitch: "&",      //切换回调
                    isScale: "@",       //是否缩放切换
                    onResize: "&",       //窗口大小改变触发回调
                    errSrc: "@", //默认图片
                    previewOnSwitch: "&",//给预览用的切换函数回调
                    previewData: "@" //传递给预览用的数据
                },
                priority: 2,
                controller: ["$scope", "$element", "$attrs", "$transclude", function($scope, $element, $attrs, $transclude){
                    // this.method1 = function(){
                    // };
                }],
                link: function ($scope, element, attrs) {
                    // console.log("imgscroll link");
                    require(["imgScroll"], function(ImgScroll){
                        function fnOnSwitch(index){
                            $timeout(function(){
                                $scope.index = index;
                                $scope.onSwitch && $scope.onSwitch();
                            }, 0);
                        }

                        var fixedHeight = 0;
                        if(attrs.fixedHeight != undefined){
                            fixedHeight = $scope.fixedHeight || element.height();
                        }

                        var oConfig = {
                            slideWrapper: $(element),
                            isFlexable: $scope.flexable != undefined ? ($scope.flexable == "false" ? false : true) : false,
                            fixedWidth: $scope.fixedWidth || 0,//$(element).parent().width() || 0,
                            fixedHeight: fixedHeight,
                            isLoop: $scope.loop != undefined ? ($scope.loop == "false" ? false : true) : true,
                            isAuto: $scope.auto != undefined ? ($scope.auto == "false" ? false : true) : true,
                            isScale: $scope.isScale != undefined ? ($scope.isScale == "false" ? false : true) : false,
                            canPreview: $scope.preview != undefined ? ($scope.preview == "false" ? false : true) : false,
                            showIndex: $scope.index != undefined ? $scope.index : 0,
                            changeCallback: fnOnSwitch,
                            onResize: $scope.onResize || null,
                            errSrc: $scope.errSrc || null,
                            previewChangeCallback: $scope.previewOnSwitch,
                            previewData: $scope.previewData || null
                        };

                        $timeout(function(){
                            //var imgScroll = new ImgScroll(oConfig);
                            /**
                             * 由于previewData是接口拿到的需要时间
                             * 在此监听到isInit是true的时候 再次获取下
                             * modify by ashaLiu
                             */
                            var imgScroll = new ImgScroll(oConfig);
                            if(element.is('[is-init]') && $scope.isInit != true){
                                var watch = $scope.$watch("isInit", function(newData, oldData){
                                    if(newData == true){
                                        imgScroll.config.previewData = $scope.previewData || null;
                                        imgScroll.init();
                                        watch();
                                    }
                                });
                            } else{
                                imgScroll.init();
                            }
                        }, 0, false);
                    });
                }
            }
        }]);

        /**
         * 日历选择
         */
        module.directive('btDatePicker', ["$state", "$stateParams", function($state, $stateParams) {
            return {
                restrict:"AC",
                require: ['?ngModel'],
                scope: {
                    //dateName:"@"
                },
                compile: function(scope, tElem, tAttrs){
                    if ($("link[href*=mobiscroll\\.min\\.css]").size() == 0) {
                        Util.getStyle(GConfig.LIB_ADDRESS + "mobiscroll2.5.1/mobiscroll.min.css?bust=" + GConfig.TAG);
                    }
                    var bIsIOS = new RegExp(/iPhone|iPod|iPad/ig).test(navigator.userAgent),
                        sPlaceholderHtml = '<input type="date" ng-model="'+ tElem.dateName +'"  class="dateInput" min="'+ tElem.min +'" max="'+ tElem.max +'">'
                        ;
                    //bIsIOS = true;
                    if(bIsIOS){
                        $(tElem.$$element)
                        //.removeClass('bt-date-picker')
                        //.removeAttr('bt-date-picker')
                            .after(sPlaceholderHtml)
                        //.removeAttr('ng-model')
                        // .attr({
                        //     'value': '{{'+ tElem.dateName +' | date:"yyyy-MM-dd"}}'
                        // })
                        ;
                    }

                    return {
                        pre: function($scope, element, attrs){
                            element.attr("readonly", "readonly");
                        },
                        post: function($scope, element, attrs, ctrl){

                            if(!bIsIOS){
                                var startYear = new Date(attrs.minDate).getFullYear() || 2000,
                                    endYear = new Date(attrs.maxDate).getFullYear() || new Date().getFullYear() + 10
                                    ;
                                require(["mobiscroll"],function(){
                                    element.mobiscroll().date({
                                        defaultValue: new Date(),
                                        dateFormat: 'yyyy-mm-dd',
                                        yearText: '年',
                                        monthText: '月',
                                        dayText: '日',
                                        // width: $(window).width(),
                                        theme: 'android-ics light',      // Specify theme like: theme: 'ios' or omit setting to use default
                                        lang: 'zh',    // Specify language like: lang: 'pl' or omit setting to use default
                                        display: 'modal',  // Specify display mode like: display: 'bottom' or omit setting to use default
                                        mode: 'datetimeMinmax',         // More info about mode: https://docs.mobiscroll.com/3-0-0_beta2/measurement#!opt-mode
                                        // min: minDate,    // More info about min: https://docs.mobiscroll.com/3-0-0_beta2/datetime#!opt-min
                                        // max: maxDate     // More info about max: https://docs.mobiscroll.com/3-0-0_beta2/datetime#!opt-max
                                        startYear: startYear, //开始年份
                                        endYear: endYear //结束年份
                                    });
                                });

                                //element.find('.mbsc-fr-btn-cont').addClass('half-bottom-border');

                            }else{
                                var ngModel = ctrl[0];

                                ngModel.$formatters.push(function(modelValue){
                                    if(modelValue) {
                                        return Util.formatDate(modelValue, 'yyyy-MM-dd');
                                    }
                                });

                                ngModel.$parsers.push(function(value){
                                    if(value) {
                                        return Util.formatDate(value, 'yyyy-MM-dd');
                                    }
                                });
                            }

                        }
                    }
                }

            }
        }]);


        /**
         * 点击事件埋点指令
         */
        module.directive('btBury', ["buriedService", function(buriedService) {
            return {
                restrict:"A",
                scope:{
                    btBury: "@",
                    actionName: "@",  //返回的回调函数（目前是调用三方的，需要传这个，后期可以不需要）
                    extras: "="
                },
                priority: 2,
                link: function ($scope, element, attrs, ctrl) {
                    // console.log($scope.btBury, $scope.actionName, $scope.extras);
                    // console.log(typeof($scope.extras));
                    $(element).tap(function(){
                        buriedService.pushEvent({
                            actionName: $scope.actionName,
                            actionId: $scope.btBury,
                            extras: $scope.extras
                        });
                    });
                }
            }
        }]);

    })();

    return module;
});