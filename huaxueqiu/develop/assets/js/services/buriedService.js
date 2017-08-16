/**
 * 数据埋点服务
 * @author dongxiaochai@163.com
 * @since 2017-05-20
 */
define(["serviceModule", 'cnzzStat', "util"], function(app, czc){
    app.factory("buriedService", ["$q", "$ajaxJson", function($q, $ajaxJson) {
        var services = {
            /**
             * 推送页面浏览埋点
             * @param  {Object} config 埋点配置
             *            {
             *                actionName: "车源详情页",   //事件名称（目前是调用三方的，需要传这个，后期可以不需要）
             *                
             *                actionId: "s_detail",     //事件ID，服务端预先生成的code
             *                extras: {                 //扩展属性
             *                    carId
             *                }
             *            }
             */
            pushPV: function(config){
                console.log(config,"页面")
                var _this = this;
                if(GConfig.isAppProject && GConfig.isInApp){
                    wv.bury({
                        actionId: config.actionId,
                        // actionBusinessId: config.actionBusinessId,
                        actionType: 3,
                        extras: config.extras
                    });
                } else{
                    czc.pushPV();
                    //再推送一个浏览的事件
                    /*czc.pushEvent({
                        category: config.actionName,
                        action: "",
                        label: config.extras
                    });*/
                    _this.pushEvent(config);
                }
            },
            /**
             * 推送事件埋点
             * @param  {Object} config 埋点配置
             *            {
             *                actionName: "车源详情页",   //事件名称（目前是调用三方的，需要传这个，后期可以不需要）
             *                
             *                actionId: "s_detail",     //事件ID，服务端预先生成的code
             *                extras: {                 //扩展属性
             *                    carId
             *                }
             *            }
             */
            pushEvent: function(config){
                console.log(config,"点击")
                // console.log(config);
                var _this = this;
                if(GConfig.isAppProject && GConfig.isInApp){
                    wv.bury({
                        actionId: config.actionId,
                        // actionBusinessId: config.actionBusinessId,
                        actionType: 1,
                        extras: config.extras
                    });
                } else{
                    var actionName = config.actionName,
                        actionArr = actionName.split("_"),
                        category = actionArr[0],
                        action = actionArr.splice(1, actionArr.length - 1).join('_')

                    czc.pushEvent({
                        category: category,
                        action: action,
                        label: config.extras
                    });
                }
            }
        };
        return services;
    }]);
});