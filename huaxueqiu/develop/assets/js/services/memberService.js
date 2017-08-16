/**
 * 通知服务
 *
 * @author dongxiaochai @163.com
 * @since 2015-11-13
 */
define(["serviceModule", 'util'], function(app, Util) {
    var FETCH_INTERVAL = 10 * 1000 * 60; //请求数据间隔（分钟）

    app.factory("memberService", ["$q", "$ajaxJson", function($q, $ajaxJson) {
        var services = {
            /**
             * 获取当前登录用户信息   
             *  roleID
             *  4   车商-已授信
             *  5  车商-未授信
             *  6  客户经理-车商已授信
             *  7  客户经理-车商未授信
             *  8  职业经理人-已授信
             *  9  职业经理人-未授信
             *  10 注册用户
             *  11 游客
             *  12 经纪人-已授信
             *  13 经纪人-未授信
             *  14 合作车商-已授信
             *  15 合作车商-未授信
             *  16 合作客户经理-合作车商已授信
             *  17 合作客户经理-合作车商未授信
             *  18 实名用户             
             */
            getLoginUserInfo: function(){
                var _this = this,
                    deferred = $q.defer(),
                    URL = "/json/userInfo.json", //正式接口地址
                    TEST_URL = "json/userInfo.json" //测试接口地址
                ;
                
                if(GConfig.isInApp){
                    wv.getUserInfo(function(data){
                        //判断如果是{}的话就置为null
                        if(data && typeof data.id == "undefined"){
                            data = null;
                        }
                        //data是''或者undefined
                        if(!data){
                            data = null;
                        }
                        if(data){
                            _this.getAccessToken().then(function (accessData) {
                                if (accessData.code != 1) {
                                    deferred.resolve(data);
                                } else {
                                    if (accessData.object) {
                                        // accessToken: "f7678140-33c9-4307-856c-9f8b37cd3891"
                                        Util.setLocalData("access_token", accessData.object);
                                        deferred.resolve(data);
                                    }
                                }
                            })
                        }

                    });
                } else{
                    $ajaxJson({
                        url: URL,
                        testUrl: TEST_URL,
                        method: "get",
                        data: {}
                    }).then(function(data) {
                        //判断如果是{}的话就置为null
                        if(data && typeof data.id == "undefined"){
                            data = null;
                        }
                        //data是''或者undefined
                        if(!data){
                            data = null;
                        }
                        if(data){
                            _this.getAccessToken().then(function (accessData) {
                                if (accessData.code != 1) {
                                    deferred.resolve(data);
                                } else {
                                    if (accessData.object) {
                                        // accessToken: "f7678140-33c9-4307-856c-9f8b37cd3891"
                                        Util.setLocalData("access_token", accessData.object);
                                        deferred.resolve(data);
                                    }
                                }
                            })
                        }
                    });
                }

                return deferred.promise;
            },
            /**
             * 获取accessToken
             */
            getAccessToken: function () {
                var deferred = $q.defer(),
                    URL = "/activity/login/get/accesstoken", //正式接口地址
                    TEST_URL = "assets/json/accessToken.json" //测试接口地址
                ;

                wv.fetchData({
                    url: URL,
                    testUrl: TEST_URL,
                    method: "get"
                }, function(data) {
                    deferred.resolve(data);
                });

                return deferred.promise;
            }
        };

        return services;
    }]);
});
