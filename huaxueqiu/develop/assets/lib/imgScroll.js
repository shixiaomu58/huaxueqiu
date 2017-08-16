/**
 * 轮播图滚动
 *
 * @author dongxiaochai@163.com
 * @since 2016-05-19
 */
define(["jquery"], function($) {
	var
	// 默认配置。
		DEFAULT_CONFIG = {
			currClass: "curr", //当前选中样式名
			slideWrapper: null, //容器节点的样式筛选规则字符串或者对象
			sortUl: null, //焦点对象的样式筛选规则字符串或者对象，可不传，最好通过changeCallback自行修改状态
			isLoop: true, //是否循环滚动
			isAuto: true, //是否自动播放
			autoPlayTime: 3, //自动轮播时间(单位：秒)
			showIndex: 0, //显示第几张
			fixedHeight: 0, //容器固定高度（如果不传，则取第一张图片的高度）
			fixedWidth: 0, //容器的固定宽度（如果不传，则取当前窗口的宽度）
			isFullSupport: true, //如果图片比容器小，是否等比放大撑满
			// initCallback: null,		//高度尺寸初始化完后回调函数
			changeCallback: null, //修改显示图片执行的回调，会把当前选中项的索引值作为参数
			tapHandler: null, //图片点击事件
			picFixed: true, //图片是否适配容器
			canPreview: false, //是否可预览
			isScale: false, //是否缩放切换(相册)
			onResize: null, //窗口尺寸改变触发事件
			isFlexable: false, //是否弹性适配高度
			errSrc: "",
            previewChangeCallback: null,//放大预览的回调函数
            previewData: null //放大预览的数据
		},

		loadStateObj = {}, //每张图片加载状态

		/**
		 *
		 * @param {Object} oConfig
		 */
		Fn = function(oConfig) {
			var _self = this;
			_self.fScale = 0.94; //旁边的图缩放比例

			_self.nWrapperLeft = 0;

			// 合并配置。
			oConfig = $.extend({}, DEFAULT_CONFIG, oConfig);
			if (!oConfig.slideWrapper) {
				console.log("容器不能为空");
				return;
			}

			_self.wrapper = $(oConfig.slideWrapper); //容器
			_self.slideUl = _self.wrapper.find(">*").eq(0); //ul节点
			_self.sortUl = $(oConfig.sortUl); //焦点区域母节点

            _self._wrapperWidth = _self.wrapper.width() || $(window).width();

            _self.nContainerWidth = _self._wrapperWidth; //容器默认宽度

			_self.config = oConfig;

			if (_self.picCount > 0) {
				_self.init(); // 执行自身初始化。
			}
		};


	// 从 Overlay 中扩展公共方法。
	$.extend(Fn.prototype, {
		/**
		 * 与 Overlay 类中不同，该为仅自己访问的初始化方法。
		 *
		 * @method
		 * @return {Class}
		 */
		init: function() {
			var _self = this;
			if (_self.hasInit) { //防止重复初始化
				return _self;
			}
			_self.hasInit = true;

			_self._resizeContainer(); //容器高度初始化

			_self.originalSildeItems = _self.slideUl.find(">*");
			_self.sildeItems = _self.originalSildeItems;
			// _self.loopIndex = _self.config.showIndex;
			_self.showIndex = _self.config.showIndex;

			_self.moveLeft = 0;
			_self.picCount = _self.sildeItems.length; //图片张数
			_self.isAnimating = false; //是否还在执行动画

			_self.timer = null; //自动播放定时器
			_self._loadStatObj = {};

			_self
				._initRender()
				._renderLiItems()
				// ._setPicCenter()
				._addEventListener()
				.showPic(false)
				.autoPlay();

			return _self;
		},

		/**
		 * 区域高度尺寸定义
		 */
		_resizeContainer: function() {
			var _self = this;

			//设置容器尺寸
			function setContainerSize() {
				var fWidthRate = _self.config.isFlexable ? _self._wrapperWidth / 375 : 1,
                    //fWidthRate = _self.config.isFlexable ? _self.wrapper.width() / 375 : 1,
					nHeight = _self.config.fixedHeight * fWidthRate;

				if (_self.config.isScale) {
					_self.wrapper.css({
						// overflow: "hidden",
						height: nHeight + "px",
						minHeight: nHeight + "px"
					});
				} else {
					_self.wrapper.css({
						overflow: "hidden",
						height: nHeight + "px",
						minHeight: nHeight + "px"
					});
				}

				//设置ul宽度
				_self.slideUl
					.css({
						height: nHeight + "px",
						minHeight: nHeight + "px"
					});
			}

			function resizeFn() {
				if (_self.config.fixedWidth) {
					_self.nContainerWidth = _self.config.fixedWidth;
				} else {
					_self.nContainerWidth = _self.wrapper.innerWidth() || _self._wrapperWidth;
				}
				_self.nWrapperLeft = _self.wrapper.offset().left;

				if (_self.config.fixedHeight <= 0) {
					var jContainer = _self.wrapper;
					_self.config.fixedHeight = jContainer.height();
					while (_self.config.fixedHeight <= 0 && jContainer.parent().size()) {
						jContainer = jContainer.parent();
						_self.config.fixedHeight = jContainer.height();
					}
				}

				// if(_self.config.fixedWidth){
				// 	_self.nContainerWidth = _self.config.fixedWidth;
				// } else{
				// 	_self.nContainerWidth = _self.wrapper.innerWidth() || _self._wrapperWidth;
				// }
				// _self.nWrapperLeft = _self.wrapper.offset().left;

				_self.config.onResize && _self.config.onResize();
			}
			resizeFn();

			var resizeTimer = null;
			//窗口resize事件
			$(window).on("resize orientationchange", function() {
				resizeFn();
                _self._wrapperWidth = _self.wrapper.width() || $(window).width();

				resizeTimer = setTimeout(function() {
					clearTimeout(resizeTimer);

					setContainerSize();
					_self._renderLiItems.call(_self)._setPicCenter.call(_self);
				}, 100);
			});
			setContainerSize();
			return _self;
		},

		/**
		 * 渲染内容
		 */
		_initRender: function() {
			var _self = this;

			//默认样式
			_self.slideUl.css({
				"transition": "transform 0ms ease",
				"webkitTransition": "-webkit-transform 0ms ease",
				"msTransition": "-ms-transform 0ms ease",
				"oTransition": "-o-transform 0ms ease",
				"mozTransition": "-moz-transform 0ms ease",

				//默认启动硬件加速
				"will-change": "transform"
					// "transform": "translateZ(0px)",
					// "webkitTransform": "translateZ(0px)"
					// "msTransform": "translateZ(0px)",
					// "oTransform": "translateZ(0px)",
					// "mozTransform": "translateZ(0px)"
			});

			//循环轮播
			if (_self.config.isLoop) {
				// _self.slideUl
				_self.showIndex++;

				var jLastClone = _self.sildeItems.eq(_self.picCount - 1).clone(),
					jFirstClone = _self.sildeItems.eq(0).clone();
				_self.slideUl
					.prepend(jLastClone)
					.append(jFirstClone)
					.find(">*").each(function(i) {
						$(this).data("index", i);
					});;
			}

			_self.sildeItems = _self.slideUl.find(">*");

			return _self;
		},

		/**
		 * 获取真实当前显示图片索引（如果循环播放的话，+1）
		 */
		_getTrueCurrIndex: function() {
			var _self = this;

			var nShowIndex = _self.showIndex;
			if (_self.config.isLoop) {
				if (nShowIndex == _self.sildeItems.length - 1) {
					nShowIndex = 0;
				} else if (nShowIndex <= 0) {
					nShowIndex = _self.sildeItems.length - 3;
				} else {
					nShowIndex--;
				}
			}

			return nShowIndex;
		},

		/**
		 * 渲染每一项
		 * @return this
		 */
		_renderLiItems: function() {
			var _self = this,
				fWidthRate = _self.config.isFlexable ? _self._wrapperWidth / 375 : 1,
				nHeight = _self.config.fixedHeight * fWidthRate;

			_self.sildeItems = _self.slideUl.find(">*");

			// _self.slideUl.find("img").css({
			// 	opacity: "1",
			// 	filter: "alpha(opacity=100)"
			// });

			//每一项的宽度
			if (_self.sildeItems && _self.sildeItems.length > 0) {
				_self.sildeItems
					.css({
						width: _self.nContainerWidth + "px",
						height: nHeight + "px"
					});

				//设置ul宽度
				_self.slideUl
					.css({
						width: _self.nContainerWidth * _self.sildeItems.length + "px"
					});
			}

			_self.moveLeft = -_self.showIndex * _self.nContainerWidth;
			_self._setTransform(0, _self.moveLeft);

			// if(_self.config.initCallback){
			// 	_self.config.initCallback();
			// }
			return _self;
		},

		/**
		 * 获取节点的src
		 * @param  {Dom} domItem 节点
		 * @return {String}
		 */
		_getImgSrc: function(domItem) {
			return $(domItem).attr("src") || $(domItem).attr("defaultSrc") || $(domItem).attr("originSrc");
		},

		/**
		 * 获取节点的大图src
		 * @param  {Dom} domItem 节点
		 * @return {String}
		 */
		_getImgOriginSrc: function(domItem) {
			return $(domItem).attr("originSrc") || $(domItem).attr("src") || $(domItem).attr("defaultSrc");
		},

		/**
		 * 返回所有图片对象数组
		 * @return {doms}
		 */
		_getAllPicItems: function() {
			return this.slideUl.find("li img");
		},

		/**
		 * 图片居中显示
		 * @param  {Integer} index 渲染第几项
		 */
		_setPicCenter: function(index) {
			var _self = this,
				jImgs = _self._getAllPicItems();

			if (index != undefined) {
				_self._setCenter(index);
			} else {
				jImgs.each(function(i) {
					_self._setCenter(i);
				});
			}
			return _self;
		},

		/**
		 * 计算图片的应用尺寸
		 * @param  {Float} sourceWidth  原图宽
		 * @param  {Float} sourceHeight 原图高
		 * @param  {Float} maxWidth     最大宽
		 * @param  {Float} maxHeight    最大高
		 * @return {Float}              尺寸对象
		 */
		_getPicSizeObj: function(sourceWidth, sourceHeight, maxWidth, maxHeight) {
			var _self = this;
			if (_self.config.picFixed) { //图片适配
				if (sourceWidth / sourceHeight >= maxWidth / maxHeight) {
					// if(sourceHeight > maxHeight){
					sourceWidth = sourceWidth * (maxHeight / sourceHeight);
					sourceHeight = maxHeight;
					// }
				} else {
					// if(sourceWidth > maxWidth){
					sourceHeight = sourceHeight * (maxWidth / sourceWidth);
					sourceWidth = maxWidth;
					// }
				}
			} else { //最大高度和宽度自适应
				if (sourceWidth > maxWidth || sourceHeight > maxHeight) {
					if (sourceWidth / sourceHeight >= maxWidth / maxHeight) {
						sourceHeight = sourceHeight * (maxWidth / sourceWidth);
						sourceWidth = maxWidth;
					} else {
						sourceWidth = sourceWidth * (maxHeight / sourceHeight);
						sourceHeight = maxHeight;
					}
				}
			}

			return {
				width: sourceWidth,
				height: sourceHeight
			};
		},

		/**
		 * 设置某一张图片居中
		 * @param  {Integer} index 渲染第几项
		 */
		_setCenter: function(index) {
			var _self = this,
				jThis = jImgs = _self._getAllPicItems().eq(index),
				sSrc = _self._getImgSrc(jThis),
				jParentBox = jThis.parents("li"),
				nMaxWidth = jParentBox.innerWidth(),
				nMaxHeight = jParentBox.innerHeight(),
				nImgSourceWidth = jThis.data("sourceWidth"),
				nImgSourceHeight = jThis.data("sourceHeight"),
				img;
			if (!sSrc) {
				return;
			}

			nMaxWidth = nMaxWidth - parseFloat(jParentBox.css("paddingLeft")) - parseFloat(jParentBox.css("paddingRight"));
			nMaxHeight = nMaxHeight - parseFloat(jParentBox.css("paddingTop")) - parseFloat(jParentBox.css("paddingBottom"));

			// if(!jParentBox.hasClass("loading")){
			// 	return _self;
			// }

			if (nImgSourceWidth) {
				fnCallback();
			} else {
				img = new Image();
				img.src = sSrc;

				if (img.complete) { // 如果图片已经存在于浏览器缓存，直接调用回调函数
					nImgSourceWidth = img.width;
					nImgSourceHeight = img.height;
					jThis.data("sourceWidth", nImgSourceWidth);
					jThis.data("sourceHeight", nImgSourceHeight);
					fnCallback();
					return; // 直接返回，不用再处理onload事件
				}

				jThis.siblings().andSelf().css({
					"opacity": "0"
				});

				img.onload = function() {
					nImgSourceWidth = img.width;
					nImgSourceHeight = img.height;
					jThis.data("sourceWidth", nImgSourceWidth);
					jThis.data("sourceHeight", nImgSourceHeight);
					fnCallback();
				}
				img.onerror = function(){
					if(_self.config.errSrc && _self.config.errSrc != sSrc){
						img.src = _self.config.errSrc;
						sSrc = _self.config.errSrc;
					}
				}
			}

			//设置尺寸和显示状态
			function fnCallback() {
				var sizeObj = _self._getPicSizeObj(nImgSourceWidth, nImgSourceHeight, nMaxWidth, nMaxHeight);

				jThis.css({
					transition: ".2s linear opacity",
					webkitTransition: ".2s linear opacity",
					opacity: "1"
				}).siblings().css({
					opacity: "1"
				});

				jThis.css({
						display: "block",
						position: "relative",
						maxWidth: "none",
						maxHeight: "none",
						width: sizeObj.width + "px",
						height: sizeObj.height + "px",
						left: ((nMaxWidth - sizeObj.width) / 2) + "px",
						top: ((nMaxHeight - sizeObj.height) / 2) + "px"
					})
					.attr("src", sSrc)
					.parent().css("overflow", "hidden");
				if (img) {
					img.onload = null;
					img.onerror = null;
					img = null;
				}

				jParentBox.removeClass("loading").addClass("loaded");
			}
		},

		/**
		 * 用来记录是否已加载
		 * @type {Object}
		 */
		_loadStatObj: {},

		/**
		 * 加载图片
		 * @param  {Integer} index 渲染第几项
		 * @return
		 */
		_loadImg: function(index) {
			var _self = this;
			if (index == undefined) {
				return _self;
			}
			if(_self._loadStatObj[index] == true){
				return _self;
			}
			_self._loadStatObj[index] = true;
			var jThis = jImgs = _self._getAllPicItems().eq(index),
				sSrc = _self._getImgSrc(jThis),
				jParentBox = jThis.parents("li");

			if (jParentBox.hasClass("loading")) {
				return _self;
			}

			if (!jParentBox.hasClass("loaded") && sSrc) {
				jParentBox.addClass("loading");

				_self._setCenter(index);

				if (_self.config.isLoop) { //循环的话
					var cloneIndex;
					if (index == 0) {
						cloneIndex = _self.sildeItems.length - 2;
					} else if (index == 1) {
						cloneIndex = _self.sildeItems.length - 1;
					} else if (index == _self.sildeItems.length - 2) {
						cloneIndex = 0;
					} else if (index == _self.sildeItems.length - 1) {
						cloneIndex = 1;
					}

					if (cloneIndex != index) {
						_self._loadImg(cloneIndex);
					}
				}
			}
			return _self;
		},

		/**
		 * 加载第几张图片和它旁边的两张图片
		 * @param  {Integer} index 渲染第几项
		 * @returnthis
		 */
		_loadImgAndSide: function (index) {
			var _self = this;
			setTimeout(function(){
				_self._loadImg(index + 1)._loadImg(index - 1);
			}, 200);
			return _self._loadImg(index);
		},

		/**
		 * 自动播放
		 *
		 * @private
		 * @method
		 * @return {Class}
		 */
		autoPlay: function() {
			var _self = this;
			if (_self.config.isAuto == true && _self.config.autoPlayTime > 0) {
				_self.timer = setInterval(function() {

					if (_self.config.isLoop) {
						_self.showIndex++;
					} else {
						if (_self.showIndex == _self.picCount - 1) {
							_self.showIndex = 0;
						} else {
							_self.showIndex++;
						}
					}

					_self.showPic(true);
				}, _self.config.autoPlayTime * 1000);
			}
			return _self;
		},

		/**
		 * 显示第几张图片
		 *
		 * @param {Boolean} isAnimate 是否使用动画
		 * @param {Integer} index 显示的图片索引
		 * @return {Class}
		 */
		showPic: function(isAnimate, index) {
			var _self = this,
				nDuration = 400, //动画时间（单位：毫秒）
				nTrueShowIndex;

			if (index != undefined) {
				_self.showIndex = index;
			}

			_self._loadImgAndSide(_self.showIndex);

			nTrueShowIndex = _self._getTrueCurrIndex();

			_self.moveLeft = -_self.showIndex * _self.nContainerWidth;

			_self._setPicScale(isAnimate ? nDuration : 0);
			_self._setTransform(isAnimate ? nDuration : 0, _self.moveLeft);

			if (isAnimate) {
				_self.isAnimating = true;
				setTimeout(function() {
					_self.isAnimating = false;
					//循环轮播的情况
					if (!!_self.config.isLoop && (_self.showIndex === 0 || _self.showIndex === _self.sildeItems.length - 1)) {
						if (_self.showIndex == 0) {
							_self.showIndex = _self.sildeItems.length - 2;
						} else if (_self.showIndex === _self.sildeItems.length - 1) {
							_self.showIndex = 1;
						}

						_self.moveLeft = -_self.showIndex * _self.nContainerWidth;

						_self._loadImgAndSide(_self.showIndex);

						_self._setPicScale(0);
						_self._setTransform(0, _self.moveLeft);
					}
				}, nDuration);
			}

			//焦点
			_self.sortUl.find("li")
				.removeClass(_self.config.currClass)
				.eq(nTrueShowIndex).addClass(_self.config.currClass);

			if (_self.config.changeCallback) {
				setTimeout(function() {
					_self.config.changeCallback(nTrueShowIndex);
				}, 10);
			}

			return this;
		},

		/**
		 * 设置图片缩放动画
		 * @param {Integer} duration   动画时间（单位：毫秒）
		 */
		_setPicScale: function(duration) {
			var _self = this;

			//缩放
			if (_self.config.isScale) {
				_self.sildeItems.find(">*").each(function(i) {
					var scale = _self.showIndex == i ? 1 : _self.fScale;
					$(this).css({
						"transform": "scale(" + scale + ")",
						"webkitTransform": "scale(" + scale + ")",
						"transitionDuration": duration + "ms",
						"webkitTransitionDuration": duration + "ms",
					});
				});
			}
		},

		/**
		 * 设置水平移动动画
		 * @param {Integer} duration   动画时间（单位：毫秒）
		 * @param {Integer} translateX X轴平移距离
		 */
		_setTransform: function(duration, translateX) {
			var _self = this;

			_self.slideUl.css({
				"transitionDuration": duration + "ms",
				"webkitTransitionDuration": duration + "ms",
				"msTransitionDuration": duration + "ms",
				"oTransitionDuration": duration + "ms",
				"mozTransitionDuration": duration + "ms",

				"transform": "translateX(" + translateX + "px)",
				"webkitTransform": "translateX(" + translateX + "px)",
				"msTransform": "translateX(" + translateX + "px)",
				"oTransform": "translateX(" + translateX + "px)",
				"mozTransform": "translateX(" + translateX + "px)"
			});
		},

		/**
		 * 侦听事件。
		 *
		 * @private
		 * @method
		 * @return {Class}
		 */
		_addEventListener: function() {
			var _self = this,
				_touchType = "", //触碰类型，默认为移动，tap单击；doubleTap双击；swipe挥；move移动；pinch缩放；rotate旋转；长按longPress，pinchEnd缩放结束（特殊的，以防止缩放结束以后马上出发touchmove）
				_oStartTouchInfo = {} //开始触碰时候的位置信息
			;
			/**
			 * 绑定事件绑定滑动
			 */
			(function _fnBindTouch() {
				_self.wrapper
					.on("touchstart", _fnTouchStart)
					.on("touchmove", _fnTouchMove)
					.on("touchend", _fnTouchEnd)
                    .on("mousedown", _fnTouchStart)
                    //.on("mousemove", _fnTouchMove)
                    .on("mouseup", _fnTouchEnd);
			})();

			/**
			 * 获取移动坐标信息
			 *
			 * @method
			 * @reurn {void}
			 */
			function _fnGetTouchPosition(e) {
				e = e.originalEvent || e;
				var event = e.originalEvent || e,
					point = (e.touches && e.touches.length) ? e.touches[0] : (e.changedTouches && e.changedTouches.length) ? e.changedTouches[0] : e
					oMove = {
						pageX: point.pageX || 0,
						pageY: point.pageY || 0,
						touches: e.touches || [],
						changedTouches: e.changedTouches
					}
				;

				return oMove;
			}

			/**
			 * 开始事件
			 *
			 * @method
			 * @reurn {void}
			 */
			function _fnTouchStart(e) {
				_touchType = "";
				// e.preventDefault();

				if (_self.timer) {
					clearInterval(_self.timer);
				}

				// e.stopPropagation();
				var startTime = new Date().getTime(),
					oMove = _fnGetTouchPosition(e);

				_oStartTouchInfo = {
					time: startTime,
					pageX: oMove.pageX,
					pageY: oMove.pageY
				};
			}

			/**
			 * 移动事件
			 *
			 * @method
			 * @reurn {void}
			 */
			function _fnTouchMove(e) {
				var oMove = _fnGetTouchPosition(e),
					nMoveX = oMove.pageX - _oStartTouchInfo.pageX, //本次手指移动的X距离
					nMoveY = oMove.pageY - _oStartTouchInfo.pageY //本次手指移动的Y距离
				;

				//横向滚动
				if (Math.abs(nMoveY) < Math.abs(nMoveX)) {
					e && e.preventDefault();
				}
				/*if(nMoveX < 0){//左移
					_self._loadImg(_self.showIndex + 1);
				} else{//右移
					_self._loadImg(_self.showIndex - 1);
				}*/

				var nLeft = _self.moveLeft + nMoveX;

				//缩放
				if (_self.config.isScale && !_self.isAnimating) {
					for (var i = _self.showIndex - 1; i <= _self.showIndex + 1; i++) {
						var jThis = _self.sildeItems.eq(i),
							scale = _self.fScale + Math.abs((_self.nContainerWidth - Math.abs(_self.nWrapperLeft - jThis.offset().left))) / _self.nContainerWidth * (1 - _self.fScale);
						if (scale > 1) {
							scale = 1;
						} else if (scale < _self.fScale) {
							scale = _self.fScale;
						}

						jThis.find(">*").css({
							transitionDuration: "0ms",
							webkitTransitionDuration: "0ms",
							msTransitionDuration: "0ms",
							oTransitionDuration: "0ms",
							mozTransitionDuration: "0ms",

							transform: "scale(" + scale + ") translateZ(0)",
							webkitTransform: "scale(" + scale + ") translateZ(0)",
							msTransform: "scale(" + scale + ") translateZ(0)",
							oTransform: "scale(" + scale + ") translateZ(0)",
							mozTransform: "scale(" + scale + ") translateZ(0)"
						});
					}
				}

				_self._setTransform(0, nLeft);
			}

			/**
			 * 结束事件
			 *
			 * @method
			 * @reurn {void}
			 */
			function _fnTouchEnd(e) {
				var oMove = _fnGetTouchPosition(e),
					nMoveX = oMove.pageX - _oStartTouchInfo.pageX, //本次手指移动的X距离
					nMoveY = oMove.pageY - _oStartTouchInfo.pageY, //本次手指移动的Y距离
					fAbsMoveX = Math.abs(nMoveX),
					fAbsMoveY = Math.abs(nMoveY)
				;
				var nDistance = 10; //超出10距离就表示是点击
				nDur = new Date().getTime() - _oStartTouchInfo.time //执行的时间
				;

				if (oMove.touches.length == 0 && nDur < 200 && fAbsMoveX < nDistance && fAbsMoveY < nDistance) {
					_touchType = "tap";
				}

				//忽略手指纵向滚动
				if (Math.abs(nMoveY) >= Math.abs(nMoveX)) {
					return goToEnd();
				}

				//忽略移动距离比较小
				if (Math.abs(nMoveX) < 50) {
					return goToEnd();
				}

				if (!_self.isAnimating) {
					if (nMoveX > 0) {
						if (_self.config.isLoop || _self.showIndex > 0) {
							_self.showIndex--;
						}
					} else {
						if (_self.config.isLoop || _self.showIndex < _self.picCount - 1) {
							_self.showIndex++;
						}
					}
				}

				function goToEnd() {
					if (_touchType == "tap" && !_self.isAnimating) { //点击触碰事件
						var nShowIndex = _self._getTrueCurrIndex();

						//预览
						if (_self.config.canPreview) {
							require(["photoSwipe"], function(PhotoSwipe) {
								clearInterval(_self.timer);
								new PhotoSwipe({
									targetImgs: _self.originalSildeItems.find("img"),
									currentIndex: nShowIndex,
									errSrc: _self.config.errSrc,
									onClose: function(index) {
										if(_self.config.isLoop){
											index++;
										}
										_self.showPic(false, index);
										_self.autoPlay();
									},
									onSwitch: function(index){
										if(_self.config.isLoop){
											index++;
										}

										_self._loadImg(index);

										_self.config.previewChangeCallback && _self.config.previewChangeCallback({index: index});
									},
                                    data: Util.parseJson(_self.config.previewData) || null
								});
							});
						} else if (_self.config.isScale) {
							var jTargetLi = $(e.target).parents("li");
							if (jTargetLi.size()) {
								_self.showIndex = jTargetLi.data("index");
							}
						}

						_self.config.tapHandler && _self.config.tapHandler(nShowIndex);
					}

					_self.showPic(true, _self.showIndex);
					_self.autoPlay();
				}

				goToEnd();
			}

			return _self;
		}
	});

	return Fn;
});