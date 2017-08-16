/**
 * 王者荣耀活动
 *
 * @author
 * @since 2017-4-27
 */
define(["serviceModule"], function(app) {

    app.factory("wkgService", ["$q", "$ajaxJson", function($q, $ajaxJson) {
        var services = {
            /**
             * 获取登录用户信息
             * @return {[type]} [description]
             */
            getCustInfo: function(o) {
                var URL = "/activity/wkg/corps/getCustInfo/1_0_0_0", //正式接口
                    TEST_URL = "json/custInfo.json" //测试接口
                ;
                return $ajaxJson({
                    url: URL,
                    testUrl: TEST_URL,
                    method: "get",
                    data: o
                });
            },  
            /**
             * 开始转盘游戏接口
             * @return {[type]} [description]
             */
            doPrize: function(o) {
                var URL = "/activity/wkg/prize/getPrize/1_0_0_0", //正式接口
                    TEST_URL = "json/doPrize.json" //测试接口
                ;
                return $ajaxJson({
                    url: URL,
                    testUrl: TEST_URL,
                    method: "get",
                    data: o
                });
            },  
            /**
             * 活动信息接口
             * @return {[type]} [description]
             */
            getActivityInfo: function(o) {
                var URL = "/activity/wkg/corps/activityInfo/1_0_0_0", //正式接口
                    TEST_URL = "json/activityInfo.json" //测试接口
                ;
                return $ajaxJson({
                    url: URL,
                    testUrl: TEST_URL,
                    method: "get",
                    data: o
                });
            },  
            /**
             * 比赛流程接口
             * @return {[type]} [description]
             */
            getMatchInfo: function(o) {
                var URL = "/activity/wkg/corps/matchImages/1_0_0_0", //正式接口
                    TEST_URL = "json/competProcesses.json" //测试接口
                ;
                return $ajaxJson({
                    url: URL,
                    testUrl: TEST_URL,
                    method: "get",
                    data: o
                });
            },  
            /**
             * 列表以及人气战队信息接口
             * @return {[type]} [description]
             */
            getTeamList: function(o) {
                var URL = "/activity/wkg/corps/findCorps/1_0_0_0", //正式接口
                    TEST_URL = "json/findCorps.json" //测试接口
                ;
                return $ajaxJson({
                    url: URL,
                    testUrl: TEST_URL,
                    method: "get",
                    data: o
                });
            },  
            /**
             * 参赛战队详情接口
             * @return {[type]} [description]
             */
            getTeamDetail: function(o) {
                var URL = "/activity/wkg/corps/corpsDetail/1_0_0_0", //正式接口
                    TEST_URL = "json/teamDetail.json" //测试接口
                ;
                return $ajaxJson({
                    url: URL,
                    testUrl: TEST_URL,
                    method: "get",
                    data: o
                });
            }, 
            /**
             * 战队名验证接口
             * @return {[type]} [description]
             */
            checkCorpsName: function(o) {
                var URL = "/activity/wkg/checkCorpsName/1_0_0_0", //正式接口
                    TEST_URL = "json/checkName.json" //测试接口
                ;
                return $ajaxJson({
                    url: URL,
                    testUrl: TEST_URL,
                    method: "post",
                    data: o
                });
            }, 
            /**
             * 战队成员信息验证接口
             * @return {[type]} [description]
             */
            checkMember: function(o) {
                var URL = "/activity/wkg/corps/checkMember/1_0_0_0", //正式接口
                    TEST_URL = "json/checkMember.json" //测试接口
                ;
                return $ajaxJson({
                    url: URL,
                    testUrl: TEST_URL,
                    method: "post",
                    data: o
                });
            }, 
            /**
             * 创建团队验证
             * @return {[type]} [description]
             */
            createCorps: function(o) {
                var URL = "/activity/wkg/corps/createCorps/1_0_0_0", //正式接口
                    TEST_URL = "json/success.json" //测试接口
                ;
                return $ajaxJson({
                    url: URL,
                    testUrl: TEST_URL,
                    method: "post",
                    data: o
                });
            }

        };

        return services;
    }]);
});
