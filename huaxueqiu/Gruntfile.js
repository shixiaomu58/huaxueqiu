'use strict';

module.exports = function (grunt) {
    /**
     * 配置grunt
     * @return {void}
     */
    function initConfig(buildType){
        var pkg = grunt.file.readJSON('package.json'),
            orignPath = pkg.orignPath,    //原目录
            buildPath = pkg.outPath,      //目标目录
            staticHostName = "http://static.cheok.com",
            oConfig
        ;

        //-------得到当前日期------
        var d = new Date(),
            sDate = ""
        ;
        sDate += d.getFullYear();
        sDate += getFormatInt(d.getMonth()+1);
        sDate += getFormatInt(d.getDate());
        sDate += getFormatInt(d.getHours());
        sDate += getFormatInt(d.getMinutes());
        // sDate += getFormatInt(d.getSeconds());

        function getFormatInt(str){
            str = str.toString();
            if(str.length < 2){
                str = "0" + str;
            }
            return str;
        }
        //-------得到当前日期 END------

        oConfig = {
            pkg: grunt.file.readJSON('package.json'),
            /**
             * 自动生成css3前缀写法
             */
            autoprefixer : {
                dist : {
                    files: [{
                        expand: true,
                        cwd: buildPath,
                        src: '**/*.css',
                        dest: buildPath
                    }]
                }
            },
            /**
             * 复制文件或目录
             */
            copy:{
                my_target: {
                    files: [{
                        expand: true,
                        cwd: orignPath,
                        src: '**',
                        dest: buildPath,
                        filter: function(fileName){  //过滤不需要的文件或文件夹                         
                            var bIsCopy = true,
                                asFilterList = [
                                    "/test(/|$)",
                                    "/demo(/|$)",
                                    "/aspnet_client",
                                    ".psd(/|$)",
                                    "desktop.ini",
                                    "thumbs.db",
                                    ".map(/|$)",
                                    ".less(/|$)",
                                    ".zip(/|$)",
                                    "web.config",
                                    "/node_modules",
                                    "npm-debug.log",
                                    "package.json",
                                    "Gruntfile.js",
                                    "sftp-config.json"
                                ]
                            ;
                            if(buildType != "debug"){
                                asFilterList.push("/json(/|$)");
                            }

                            fileName = fileName.replace(/\\/g,'/');
                            for(var i = 0; i < asFilterList.length; i++){                                
                                if(new RegExp(asFilterList[i]).test(fileName.toLowerCase())){
                                    // console.log("'" + fileName + "' not copy");
                                    bIsCopy = false;
                                }
                            }
                            return bIsCopy;
                        }
                    }]
                },
                libDeps: {
                    files: []
                }
            },
            /**
             * 删除文件或目录
             */
            clean: {
                my_target: {
                    src: [buildPath]
                    // src: ['<%=pkg.buildPath%>**/*.txt']
                }
            },
            
            // //压缩文件或目录为zip
            // compress: {
            //     my_target: {
            //         options: {
            //             archive: 'archive.zip'
            //         },
            //         files: [
            //             {src: ['path/*'], dest: 'internal_folder/', filter: 'isFile'}, path下所有的js
            //             {src: ['path/**'], dest: 'internal_folder2/'}, // path下的所有目录和文件
            //         ]
            //     }
            // },

            /**
             * 生成sourcemap文件
             */
            // 'jsmin-sourcemap': {
            //   all: {
            //     src: ['web/app-carseller/js/global.min.js'],
            //     dest: 'web/app-carseller/js/global.jsmin.js',
            //     destMap: 'web/app-carseller/js/global.min.js.map'
            //   }
            // },
            
            // /**
            //  * 创建文件变化监听
            //  */
            // watch : {
            //   styles : {
            //     files : ['css/style.css' ],
            //     tasks : ['autoprefixer' ]
            //   }
            // },
            
            /**
             * 合并文件
             */
            concat: {
                options:{
                separator:'\n',
                // banner: '/** \n * 这是合并后的文件 \n *\n * @author dongxiaochai@163.com\n * @since <%=new Date()%> \n */\n\n',
                // process: function(src, filepath){
                //     return '// Source: ' + filepath + '\n' +
                //     src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
                // },
                // footer: '/* this is the footer */'
                },
                dist:{
                    src: [
                        buildPath + '/assets/lib/require/require.min.js', 
                        buildPath + '/assets/js/config.min.js', 
                        buildPath + '/assets/js/app.js'
                    ],
                    dest: buildPath + '/assets/js/app.js'
                }
            },
            
            /**
             * 用于javascript代码检查（并会给出建议）
             */
            jshint: {
                options: {
                    //大括号包裹
                    curly: false,
                    //对于简单类型，使用===和!==，而不是==和!=
                    eqeqeq: false,
                    //对于首字母大写的函数（声明的类），强制使用new
                    newcap: false,
                    //禁用arguments.caller和arguments.callee
                    noarg: false,
                    //对于属性使用aaa.bbb而不是aaa['bbb']
                    sub: false,
                    //查找所有未定义变量
                    undef: true,
                    //查找类似与if(a = 0)这样的代码
                    boss: false,
                    devel:true,
                    //指定运行环境为node.js
                    node: false,
                    globals: {
                        jQuery: true,
                        console: true,
                        module: true
                    }
                },
                files: [buildPath +'/js/*.js'/*, '<%=pkg.buildPath%>/lib/myScroll.min.js'*/]
            },
            /**
             * 替换内容
             */
            'string-replace':{
                my_target1: {
                    files: [{
                        expand: true,
                        cwd: buildPath,
                        src: ['**/*.html'],
                        dest: buildPath
                    }],
                    options: {
                        replacements: [{
                            pattern: /bust=[0-9a-zA-Z]+/ig,//请求时间戳
                            replacement: 'bust=' + sDate
                        },{
                            pattern: /<script.*?target-script-min\.js.*?<\/script>/ig,
                            replacement: ''
                        // },{//合并require到app.js中
                        //     pattern: /<script.*?\/require\.min\.js.*?<\/script>/ig,
                        //     replacement: ''
                        // },{//合并config到app.js中
                        //     pattern: /<script.*?\/config\.min\.js.*?<\/script>/ig,
                        //     replacement: ''
                        },{//把base的注释去掉
                            pattern: /\<!--\s*(\<base href.*?\>)\s*--\>/ig,
                            // replacement: '$1'
                            replacement: function(match, $1){
                                if(buildType == "debug"){//调试的时候，不替换<base>标签
                                    return match;
                                } else{
                                    return $1;
                                }
                            }
                        }]
                    }
                },
                my_target2: {
                    files: [{
                        expand: true,
                        cwd: buildPath,
                        src: ['**/config.min.js'],
                        dest: buildPath
                    }],
                    options: {
                        replacements: [{
                            pattern: /bust=[0-9a-zA-Z]+/ig,//请求时间戳
                            replacement: 'bust=' + sDate
                        },{
                            pattern: /tag:([^,]*?),?\/\/版本号/ig,//请求时间戳
                            replacement: function(match, $1){
                                return match.replace($1, sDate);
                            }
                        },{
                            pattern: /isTest\: *true/g,//是否测试的配置
                            replacement: 'isTest: ' + false

                        }]
                    }
                }
            },
            /**
             * 单元测试
             * @type {Object}
             */
            // qunit:{
            //     all: ['**/*.html']
            // },

            /**
             * 压缩js文件夹
             */
            uglify: {
                // options: {
                //     banner: '/*! <%=pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */'
                // },
                // build: {
                //   src: 'js/<%=pkg.jsName %>.js',
                //   dest: 'dest/<%=pkg.file %>.min.js'
                // },
                my_target: {//压缩整个文件夹的js
                    files: [{
                        expand: true,
                        cwd: buildPath,
                        src: '**/*.js',
                        dest: buildPath,
                        filter: function(fileName){
                            if(fileName.indexOf('angular.min.js') > -1){//jenkins服务器上装的压缩版本有问题还是咋的，angular压缩会有语法出错，不过本来已经是压缩版本了，暂时设置不压好了
                                return false;
                            }
                            return true;
                        }
                    }]
                }
            },

            /**
             * 压缩css文件
             */
            cssmin:{
                // options: {
                //     banner: '/*! <%=pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */'
                // },
                options : { 
                    compatibility : 'ie8', //设置兼容模式 
                    noAdvanced : true //取消高级特性 
                },
                my_target: {//压缩整个文件夹的css
                    files: [{
                        expand: true,
                        cwd: buildPath,
                        src: '**/*.css',
                        dest: buildPath
                    }]
                }
            },
            // /**
            //  * postcss
            //  */
            // postcss: {
            //     options: {
            //         processors: [
            //             require('autoprefixer')({browsers: ['last 2 version']}),    //处理浏览器私有前缀
            //             // require('cssnext')(),                                       //使用CSS未来的语法(不要用)
            //             require('precss')()                                         //像Sass的函数
            //         ]
            //     },
            //     my_target: {//压缩整个文件夹的css,
            //         files: [{
            //             expand: true,
            //             cwd: buildPath,
            //             src: '**/*.css',
            //             dest: buildPath
            //         }]
            //     }
            // },

            /**
             * 压缩图片大小
             */
            imagemin: {
                dist: {
                    options: {
                        optimizationLevel: 3, //定义 PNG 图片优化水平
                        cache: false
                    },
                    files: [{
                        expand: true,
                        cwd: buildPath,
                        src: ['**/*.{png,jpg,jpeg,gif,webp}'],
                        dest: buildPath, //优化后的图片保存位置，覆盖旧图片，并且不作提示
                        filter: function(fileName){
                            return fileName.indexOf("\\test\\") === -1;
                        }
                    }]
                }
            },

            /**
             * requirejs打包http://www.chenliqiang.cn/node/22
             */
            requirejs:{
                build: {
                    options: {
                        appDir: buildPath + '/assets',//应用程序的目录，在这个文件夹下的所有文件将被复制到dir参数标注的文件夹下
                        baseUrl: './js/',//相对于appDir，代表查找文件的锚点
                        dir: buildPath + '/assets',//输出目录，所有应用程序文件将会被复制到该文件夹下
                        //mainConfigFile: orignPath + "/js/config.min.js",
                        allowSourceOverwrites: true,//允许源目录文件被重写
                        keepBuildDir: true,
                        // cjsTranslate: true, //如果为true, 优化器会添加define(require, exports, module) {})；包裹每一个没有调用define()的文件。
                        // inlineText: true,   //内联所有文本和依赖，避免多次异步请求这些依赖
                        // skipModuleInsertion: true, //如果是false，文件就不会用define()来定义模块而是用一个define()占位符插入其中。另外，require.pause/resume调用也会被插入。设置为”true”来避免。这个参数用在你不是用require()来创建项目或者写js文件，但是又想使用RquireJS的优化工具来合并模块是非常有用的。
                        // stubModules: [],    //将模块排除在优化文件
                        // wrap: {
                        //   start: "define(function(){",
                        //   end: "})"
                        // },
                        // findNestedDependencies: false,//寻找require()里面的require或define调用的依赖。默认为false是因为这些资源应该被认为是动态加载或者实时调用的。当然，有些优化场景也需要将它们合并在一起。
                        // normalizeDirDefines: "all",
                        // out:          
                        paths: {   //模块的相对目录
                            "jquery": "../lib/jquery.min",
                            "global": "../js/global.min",
                            "angular" : "../lib/angular/1.5.6/angular.min",
                            "util" : "../lib/util.min",
                            "loading" : "../lib/overlay/loading.min",
                            "say" : "../lib/overlay/say.min",
                            "pinyin" : "../lib/pinyin",
                            "confirm" : "../lib/overlay/confirm.min",
                            "overlayBase" : "../lib/overlay/base.min",
                            "tip" : "../lib/overlay/tip.min",
                            "serviceModule": "services/serviceModule",
                            "directiveModule" : "directives/directiveModule",
                            "webViewBridge": "../js/webViewBridge.min",
                            "baiduStat": "../lib/baiduStat.min"
                        },             
                        shim: {//为那些没有使用define声明依赖关系及设置模块值的模块，配置依赖关系与“浏览器全局”出口的脚本
                            "angular": {
                                deps: ['jquery'],
                                exports: 'angular'
                            }
                        },  
                        modules: //一个包含多个对象的数组。每个对象代表一个将被优化的模块
                        [
                            {
                                name: 'global',
                                include: []
                            }
                        ],
                        optimizeCss:"standard",//RequireJS Optimizer会自动优化应用程序下的css文件。这个参数控制css最优化设置。允许的值："none"，"standard","standard.keepLines","standard.keepComments","standard.keepComments.keepLines"
                        removeCombined: false//, //如果为true，optimizer将从输出目录中删除已合并的文件
                        // wrapShim: true                        
                    }
                }
            },  
            //html压缩
            htmlmin: {                                      // Task 
                dist: {                                      // Target 
                  options: {                                 // Target options 
                    removeComments: true,   //移除注释
                    collapseWhitespace: true    //去除空格
                  },
                files: [{
                    expand: true,
                    cwd: buildPath,
                    src: '**/*.html',
                    dest: buildPath
                }]
                }
            }
        };

        grunt.initConfig(oConfig);
    }

    // 加载插件
    // grunt.loadNpmTasks('grunt-jsmin-sourcemap');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    // grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-string-replace');
    // grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    
    // 生成正式发布版本
    grunt.registerTask('default', "正式发布版本", function(){
        initConfig("default");
        var tasks = [
            'clean',
            'copy:my_target',
            'autoprefixer',   
            'string-replace', 
            'cssmin',   
            // 'jshint',   
            'uglify',
            'requirejs',
            // 'concat',
            'htmlmin',
            'imagemin'
        ];

        grunt.task.run(tasks);
    });
}