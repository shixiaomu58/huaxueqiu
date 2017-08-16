/**
 * 买车/分期购车
 *
 * @authors ashaLiu
 * @since 	2017-06-14
 */
define(["serviceModule", "wx"], function(app, wx) {
    app.factory("wxService", ["$q", "$ajaxJson", function($q, $ajaxJson) {

        var services = {
            /**
             * 获取调用微信jsSDK所需要的参数
             * @param o
             */
            getSdkParam: function(o){
                var deferred = $q.defer(),
                    isProductEv = location.host.indexOf('cheok.com') > -1, //是否线上环境
                    URL = isProductEv ? "http://activity.cheok.com/bt-weixin/api/weixin/config/jsonp?callback=JSON_CALLBACK" : "http://super.beitaijf.cn/bt-weixin/api/weixin/config/jsonp?callback=JSON_CALLBACK",   //正式接口地址
                    TEST_URL = "json/wxjssdk.json"   //测试接口地址
                ;
                $ajaxJson({
                    url: URL,
                    testUrl: TEST_URL,
                    method: "jsonp",
                    data: o
                }).then(function(data){
                    deferred.resolve(data);//成功
                });

                return deferred.promise;
            },
            config: function(o){
                wx.config({
                    debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                    appId: o.appId, // 必填，公众号的唯一标识
                    timestamp: o.timestamp, // 必填，生成签名的时间戳
                    nonceStr: o.nonceStr, // 必填，生成签名的随机串
                    signature: o.signature,// 必填，签名，见附录1
                    jsApiList: ['checkJsApi',
                        'onMenuShareTimeline',
                        'onMenuShareAppMessage',
                        'onMenuShareQQ',
                        'onMenuShareWeibo',
                        'hideMenuItems',
                        'showMenuItems',
                        'hideAllNonBaseMenuItem',
                        'showAllNonBaseMenuItem',
                        'translateVoice',
                        'startRecord',
                        'stopRecord',
                        'onRecordEnd',
                        'playVoice',
                        'pauseVoice',
                        'stopVoice',
                        'uploadVoice',
                        'downloadVoice',
                        'chooseImage',
                        'previewImage',
                        'uploadImage',
                        'downloadImage',
                        'getNetworkType',
                        'openLocation',
                        'getLocation',
                        'hideOptionMenu',
                        'showOptionMenu',
                        'closeWindow',
                        'scanQRCode',
                        'chooseWXPay',
                        'openProductSpecificView',
                        'addCard',
                        'chooseCard',
                        'openCard'] // 必填，需要使用的JS接口列表，
                });
            },
            share: function (o) {
                //分享到朋友圈
                wx.onMenuShareTimeline({
                    title: o.title, // 分享标题
                    link: o.link, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
                    imgUrl: o.imgUrl, // 分享图标
                    success: function () {
                        // 用户确认分享后执行的回调函数
                    },
                    cancel: function () {
                        // 用户取消分享后执行的回调函数
                    }
                });

                //分享给朋友
                wx.onMenuShareAppMessage({
                    title: o.title, // 分享标题
                    desc: o.desc, // 分享描述
                    link: o.link, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
                    imgUrl: o.imgUrl, // 分享图标
                    type: '', // 分享类型,music、video或link，不填默认为link
                    dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
                    success: function () {
                        // 用户确认分享后执行的回调函数
                    },
                    cancel: function () {
                        // 用户取消分享后执行的回调函数
                    }
                });

                //分享到QQ
                wx.onMenuShareQQ({
                    title: o.title, // 分享标题
                    desc: o.desc, // 分享描述
                    link: o.link, // 分享链接
                    imgUrl: o.imgUrl, // 分享图标
                    success: function () {
                        // 用户确认分享后执行的回调函数
                    },
                    cancel: function () {
                        // 用户取消分享后执行的回调函数
                    }
                });

                //分享到腾讯微博
                wx.onMenuShareWeibo({
                    title: o.title, // 分享标题
                    desc: o.desc, // 分享描述
                    link: o.link, // 分享链接
                    imgUrl: o.imgUrl, // 分享图标
                    success: function () {
                        // 用户确认分享后执行的回调函数
                    },
                    cancel: function () {
                        // 用户取消分享后执行的回调函数
                    }
                });

                //分享到QQ空间
                wx.onMenuShareQZone({
                    title: o.title, // 分享标题
                    desc: o.desc, // 分享描述
                    link: o.link, // 分享链接
                    imgUrl: o.imgUrl, // 分享图标
                    success: function () {
                        // 用户确认分享后执行的回调函数
                    },
                    cancel: function () {
                        // 用户取消分享后执行的回调函数
                    }
                });
            }
        };
        return services;
    }]);
});
