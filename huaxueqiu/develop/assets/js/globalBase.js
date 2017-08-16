/*
 * 全局应用管理
 * 
 * @since 2017-05-10
 * @author dongxiaochai@163.com
 */

/**
 * 全局事件处理程序管理器
 * @type {Object}
 */
var GHandlerManager = {
    /**
     * 事件函数数组
     * @type {Object}
     */
    handlerList: {},
    /**
     * 获取当前编码之后的url地址
     * @returns {*|String}
     */
    _getCurrUrl: function () {
        var sPath = Util.encodeUri(window.location.href);
        return sPath.replace(/\./g, "_");
    },

    /**
     * 获取当前页面的管理器
     * @return {Object}
     */
    getCurrManage: function(){
        var _this = this,
            sPath = this._getCurrUrl(),
            oCurrManager = _this.handlerList[sPath];

        return oCurrManager;
    },

    /**
     * 向当前页面填入一个函数 挂在_this.handlerList下 以当前路由的url作为key
     * @param fnName
     * @param fn
     */
    defineHandler: function (fnName, fn) {
        var _this = this,
            sPath = _this._getCurrUrl(),
            oCurrManage = _this.handlerList[sPath];

        if(oCurrManage == undefined){
            oCurrManage = _this.handlerList[sPath] = {};
        }

        //如果只传了一个匿名函数过来，则自己取一个随机函数名，并挂上去
        if(typeof fnName == 'function'){
            fn = fnName;
            // fnName = "backFn" + (+new Date() + Math.floor(Math.random() * 1000));
            oCurrManage.anonymHandler = fn;
        } else{
            oCurrManage[fnName] = fn;
        }
    },

    /**
     * 执行前一个页面的函数
     * @param {Object}  obj
     *        {
         *            handlerName: "",  //函数名称，如果为空，直接调用最后定义的一个匿名函数
         *            args: {},         //函数参数
         *            isDelete: false   //是否删除这个函数定义，默认删除
         *        }
     */
    emitHandler: function (obj) {
        if(!obj){
            obj = {};
        }
        var _this = this,
            oParams = obj || {},
            sPath = this._getCurrUrl(),
            newCallbackStr,
            oCurrManager = _this.getCurrManage()
            ;

        oParams.args = oParams.args ? oParams.args : [];
        oParams.handlerName = oParams.handlerName || "anonymHandler";

        var args = oParams.args.join(',');
        // newCallbackStr = '_this.handlerList["' + sPath + '"]["' + oParams.handlerName + '"](' + oParams.args.join(',') + ')';
        if(oCurrManager[oParams.handlerName]){
            try {
                oCurrManager[oParams.handlerName].apply(_this, oParams.args);
                // eval('oCurrManager["'+ oParams.handlerName +'"]('+ oParams.args.join(',') +')');
            }catch (ex){
                console.log('回调执行出错');
            }
        } else{
            console.log('回调方法不存在');
        }
    },

    /**
     * 获取执行的事件句柄函数体字符串
     * @param obj
     */
    getHandler: function (obj) {
        if(!obj){
            obj = {};
        }
        var params = JSON.stringify(obj);

        return 'GHandlerManager.emitHandler('+ params +')';
    }
};

/**
 * jquery的扩展
 */
define(["jquery"], function($){
    $.fn.extend({
        tap: function(fn){
            var jThis = $(this);

            var startX = 0, startY = 0, isMove = false, isSupportTouch = false,startTime;

            jThis.on('touchstart', function(e) {
                startTime = new Date().getTime();
                isSupportTouch = true;
                isMove = false;
                var oMove = fnGetTouchPosition(e);
                startX = oMove.x;
                startY = oMove.y;
            });
            jThis.on('touchmove', function(e) {
                // e.stopPropagation();
                var oMove = fnGetTouchPosition(e),
                    nDistance = 10
                    ;

                if(Math.abs(oMove.x - startX) > nDistance || Math.abs(oMove.y - startY) > nDistance){
                    isMove = true;
                }
            });
            jThis.on('touchend', function(e) {
                var endTime = new Date().getTime();
                if(!isMove && endTime - startTime < 200){
                    e.preventDefault();
                    // e.stopPropagation(); //阻止冒泡不能随便加
                    fn.apply(this, arguments);
                }
            });

            //兼容PC端不支持touch的时候
            jThis.on('click', function(e) {
                if(!isSupportTouch){
                    e.preventDefault();
                    // e.stopPropagation();
                    fn.apply(this, arguments);
                }
            })
        }
    });
});