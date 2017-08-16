/**
 * 服务模块应用
 * 
 * @author dongxiaochai @163.com
 * @since 2016-03-16
 */
define(["angular", "util"], function(angular, Util){
    var serviceModule = angular.module('serviceModule', [], ["$httpProvider", function($httpProvider){
        $httpProvider.defaults.transformRequest = function(data) {
            //把JSON数据转换成字符串形式
            var params = [];
            for (var i in data) {
                var val = data[i];
                if(typeof(val) == "object"){
                    val = JSON.stringify(val);
                }
                params.push(i + '=' + encodeURIComponent(val));
            }
            return params.join('&');
        };
        /**
         * $httpProvider.defaults.headers.common.accessToken = "abdab361-26e4-4993-87e1-cb0a019c090c";
         * $httpProvider.defaults.headers.common.Version = "3.0.0";
         */
        $httpProvider.defaults.headers.common["Version"] = GConfig.APP_VERSION;
        $httpProvider.defaults.headers.common["content-type"] = 'application/x-www-form-urlencoded; charset=utf-8';    //application/json; charset=UTF-8
    }]);

    serviceModule.config(['$provide', function($provide){
        //暴露相应的注册方法出来
        serviceModule.factory    = $provide.factory;
        serviceModule.service    = $provide.service;
    }]);

    //扩展http服务
    serviceModule.factory("$ajaxJson", ["$q", "$http", function($q, $http ) {
        return function(config){
            var deferred = $q.defer();
            //删除null项
            if(config.data){
                angular.forEach(config.data, function(val, key){
                    if(config.data[key] === null){
                        delete config.data[key];
                    }
                });
            }

            // 服务端统一一个工程
            /*if(GConfig.isInApp){
                wv.fetchData(config, function(data){
                    deferred.resolve(data);//成功
                });
            } else{*/
                config.isApi = true;
                // 如果有access_token 就传给服务端
                var access_token = Util.getLocalData("access_token");
                if(access_token){
                    config.headers = {};
                    config.headers.AccessToken = access_token;
                }
                $http(config).success(function(data) {
                    //解析分享数据格式
                    if(data.map && data.map.shareInfo && typeof(data.map.shareInfo) === "string"){
                        data.map.shareInfo = JSON.parse(data.map.shareInfo);
                    }

                    deferred.resolve(data); //成功
                });
            // }

            return deferred.promise;
        };
        // var services = {

        // };
        // return services;
    }]);

    //拦截http请求
    serviceModule.factory('$globalInjector', ["$rootScope", "$q", function($rootScope, $q) {
        var oTimeout = {};//超时定时器
        var injector = {
            request: function(config){
                // Loading.show();//显示加载中效果  
                var bIsApi = config.isApi;      //是否接口

                if(bIsApi){
                    //默认加/api前缀
                    if(config.url.indexOf('/api/') == -1){
                        config.url = "/activity/api" + config.url;
                    }

                    //替换testUrl
                    if(config.testUrl && (sessionStorage.isTest || GConfig.isTest)){//测试
                        if(config.testUrl.substr(0,1) =='/') {
                            config.testUrl = config.testUrl.substr(1, config.testUrl.length - 1);
                        }
                        console.log("当前为testUrl，原接口URL:" + config.url);
                        config.url = 'assets/' + config.testUrl;
                        config.method = "get";
                    }
                    //转换data和params  get或者jsonp的方式只能get
                    if((config.method.toLowerCase() === "get" || config.method.toLowerCase() === "jsonp") && !config.params){
                        config.params = config.data;
                        delete config.data;
                    }

                    //时间戳
                    if(bIsApi && config.url.indexOf("bust=") === -1){
                        if(config.url.indexOf("?") == -1){
                            config.url += "?";
                        } else{
                            config.url += "&";
                        }
                        config.url += "bust=" + new Date().getTime();
                    }

                    delete config.testUrl;
                }

                if(!oTimeout[config.url]){
                    //请求超时
                    oTimeout[config.url] = setTimeout(function(){
                        new Say("请求超时");
                    }, 30000);//
                }

                return config;
            },
            response: function(response) {
                // Loading.hide();

                clearTimer(response.config.url);//清除超时定时器
                
                return response;
            },
            responseError: function(response) {
                var deferred = $q.defer();
                // Loading.hide();
                if(response.status == 1000){//登录超时
                    clearTimer();//清除超时定时器
                    Util.removeLocalData('access_token');
                    new Say({title: "登录超时，请重新登录", onhide: function(){
                        $rootScope.logout && $rootScope.logout();
                    }});
                } else{
                    clearTimer(response.config.url);//清除超时定时器

                    // new Say("网络异常");
                }
                deferred.reject();
                return deferred.promise;
                // return response;
            }
        };

        /**
         * 清除超时定时器
         * @param  {String} keyStr 定时器关键词，如果不传为清除所有
         * @return {coid}
         */
        function clearTimer(keyStr){
            if(keyStr){
                if(oTimeout[keyStr]){
                    clearTimeout(oTimeout[keyStr]);
                    delete oTimeout[keyStr];
                }
            } else{
                angular.forEach(oTimeout, function(val, key){
                    if(oTimeout[key] === null){
                        clearTimeout(oTimeout[key]);
                        delete oTimeout[key];
                    }
                });
            }
        }
        return injector;
    }]);

    serviceModule.config(['$httpProvider', function($httpProvider) {
        $httpProvider.interceptors.push('$globalInjector');
    }]);

    // /**
    //  * 省市选择服务
    //  */
    // serviceModule.factory("pickAreaService", ["$q", "$state", "$compile", "$timeout", function($q, $state, $compile, $timeout) {
    //     return function(deep, $scope){
    //         var deferred = $q.defer(),
    //             DEFAULT_CONFIG = {
    //                 deep: 2     //省市区级别：1省，2省市；3省市区
    //             },
    //             config = {}
    //         ;

    //         if(typeof(deep) === "object"){
    //             config = $.extend({}, DEFAULT_CONFIG, deep);
    //         } else{
    //             config.deep = deep;
    //         }

    //         //调用webview接口
    //         if(GConfig.isInApp && wv.appVersion >= "2.5.0"){
    //             wv.showAreaPicker(function(data){
    //                 deferred.resolve(data);
    //             }, config.deep);
    //         } else{
    //             var $newScope = $scope.$new(),
    //                 angularDomEl,
    //                 modalDomEl
    //             ;
    //             $newScope.isShow = true;
    //             $newScope.pickStyle = 1;

    //             angularDomEl = angular.element('<div class="car-search-wrapper ks-fixed search-city an-slideDown" ng-if="isShow" bt-pick-area on-picked="onPicked()" on-cancel="onCancel()"></div>')
    //                 .attr({
    //                     deep: deep,
    //                     pickStyle: $newScope.pickStyle
    //                 })
    //             ;
    //             modalDomEl = $compile(angularDomEl)($newScope);                
    //             $("body").append(modalDomEl);

    //             //移除
    //             $newScope.$on('$stateChangeStart', function(){
    //                 $newScope.onCancel();
    //             });

    //             //选择成功
    //             $newScope.onPicked = function(data){
    //                 deferred.resolve(data);
    //                 $newScope.onCancel();
    //             };

    //             //取消选择
    //             $newScope.onCancel = function(){
    //                 $newScope.isShow = false;
    //                 $timeout(function(){
    //                     modalDomEl.remove();
    //                     $newScope.$destroy();
    //                     $newScope = null;
    //                 }, 500);
    //             };
    //         }

    //         return deferred.promise;
    //     };
    // }]);

    return serviceModule;
});