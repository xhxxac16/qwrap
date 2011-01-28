
//document.write('<script type="text/javascript" src="'+srcPath+'core/core_base.js"><\/script>');
/*
	Copyright (c) 2009, Baidu Inc. All rights reserved.
	http://www.youa.com
	version: $version$ $release$ released
	author: wuliang@baidu.com
*/


/**
 * @singleton 
 * @class QW QW是QWrap的默认域，所有的核心Class都应定义在QW的域下
 */
(function(){
var _previousQW=window.QW;

var QW = {
	/**
	 * @property {string} VERSION 脚本库的版本号
	 * @default $version$
	 */
	VERSION: "$version$",
	/**
	 * @property {string} RELEASE 脚本库的发布号（小版本）
	 * @default $release$
	 */
	RELEASE: "$release$",
	/**
	 * @property {string} PATH 脚本库的运行路径
	 * @type string
	 */
	PATH: (function(){
		var sTags=document.getElementsByTagName("script");
		return  sTags[sTags.length-1].src.replace(/\/[^\/]+\/[^\/]+$/,"/");
	})(),
	/**
	 * 获得一个命名空间
	 * @method namespace
	 * @static
	 * @param { String } sSpace 命名空间符符串。如果是以“.”打头，则是表示以QW为根，否则以window为根。如果没有，则自动创建。
	 * @return {any} 返回命名空间对应的对象 
	 */		
	namespace: function(sSpace) {
		var root=window,
			arr=sSpace.split('.'),
			i=0;
		if(sSpace.indexOf('.')==0){
			i=1;
			root=QW;
		}
		for(;i<arr.length;i++){
			root=root[arr[i]] || (root[arr[i]]={});
		}
		return root;
	},
	
	/**
	 * QW无冲突化，还原可能被抢用的window.QW变量
	 * @method noConflict
	 * @static
	 * @return {json} 返回QW的命名空间 
	 */		
	noConflict: function() {
		window.QW=_previousQW;
		return QW;
	},
	/**
	 * 异步加载脚本
	 * @method loadJs
	 * @static
	 * @param { String } url Javascript文件路径
	 * @param { Function } onsuccess (Optional) Javascript加载后的回调函数
	 * @param { Option } options (Optional) 配置选项，例如charset
	 */
	loadJs: function(url,onsuccess,options){
		options = options || {};
		var head = document.getElementsByTagName('head')[0] || document.documentElement,
			script = document.createElement('script'),
			done = false;
		script.src = url;
		if( options.charset )
			script.charset = options.charset;
		script.onerror = script.onload = script.onreadystatechange = function(){
			if ( !done && (!this.readyState ||
					this.readyState == "loaded" || this.readyState == "complete") ) {
				done = true;
				onsuccess && onsuccess();
				script.onerror = script.onload = script.onreadystatechange = null;
				head.removeChild( script );
			}
		};
		head.insertBefore( script, head.firstChild );
	},
	/**
	 * 抛出异常
	 * @method error
	 * @static
	 * @param { obj } 异常对象
	 * @param { type } Error (Optional) 错误类型，默认为Error
	 */
	error: function(obj, type){
		type = type || Error;
		throw new type(obj);
	}
};

/**
* @class Wrap Wrap包装器。在对象的外面加一个外皮
* @namespace QW
* @param {any} core 被包装对象  
* @return {Wrap} 
*/
/*
QW.Wrap=function(core) {
	this.core=core;
};
*/

window.QW = QW;
})();

//document.write('<script type="text/javascript" src="'+srcPath+'core/module.h.js"><\/script>');
/*
	Copyright (c) 2009, Baidu Inc. All rights reserved.
	http://www.youa.com
	version: $version$ $release$ released
	author: yingjiakuan@baidu.com
*/

/**
 * @class ModuleH 模块管理Helper
 * @singleton 
 * @namespace QW
 * @helper
 */
(function(){

var modules={},
	mix = function(des, src, override){
		for(var i in src){
			if(override || !(i in des)){
				des[i] = src[i];
			}
		}
		return des;
	},
	isPlainObject = function(obj){return !!obj && obj.constructor == Object;},
	loadJs = QW.loadJs,
	loadingModules=[],
	isLoading=false;
function loadsJsInOrder(){
	//浏览器不能保证动态添加的ScriptElement会按顺序执行，所以人为来保证一下
	//参见：http://www.stevesouders.com/blog/2009/04/27/loading-scripts-without-blocking/
	//todo: 目前没有充分利用部分浏览器的并行下载功能，可以改进。
	//todo: 如果服务器端能combo，则可修改以下内容以适应。
	var moduleI=loadingModules[0];
	if (!isLoading && moduleI)	{
		//alert(moduleI.url);
		isLoading=true;
		loadingModules.splice(0,1);
		function loadedDone(){
			moduleI.loadStatus=2;
			var cbs=moduleI.__callbacks;
			for(var i=0;i<cbs.length;i++) cbs[i]();
			isLoading=false;
			loadsJsInOrder();
		};
		var checker=moduleI.loadedChecker;
		if(checker && checker()){ //如果有loaderChecker，则用loaderChecker判断一下是否已经加载过
			loadedDone();
		}
		else loadJs(moduleI.url.replace(/^\/\//,QW.PATH), loadedDone);
	}
};


var ModuleH = {
	/**
	 * @property {Array} provideDomains provide方法针对的命名空间
	 */
	provideDomains:[QW],
	/**
	 * 向QW这个命名空间里设变量
	 * @method provide
	 * @static
	 * @param {string|Json} moduleName 如果类型为string，则为key，否则为Json，表示将该Json里的值dump到QW命名空间
	 * @param {any} value (Optional) 值
	 * @return {void} 
	 */		
	provide: function(moduleName, value){
		if(typeof moduleName =='string'){
			var domains=ModuleH.provideDomains;
			for(var i=0;i<domains.length;i++){
				if(!domains[i][moduleName]) domains[i][moduleName]=value;
			}
		}
		else if(isPlainObject(moduleName)) {
			for(i in moduleName){
				ModuleH.provide(i,moduleName[i]);
			}
		}
	},
	
	/** 
	* 添加模块配置。
	* @method addConfig
	* @static
	* @param {string} moduleName 模块名。（如果为json，则是moduleName/details 的键值对json）
	* @param {json} details 模块的依整配置，目前支持以下：
		url: string，js路径名。如果以"//"开头，则指相对于QW.PATH。
		requires: string，本模所依赖的其它模块。多个模块用“,”分隔
		use: 本模所加载后，需要接着加载的模块。多个模块用“,”分隔
		loadedChecker: 模块是否已经预加载的判断函数。如果本函数返回true，表示已经加载过。
	* @example 
		addConfig('Editor',{url:'wed/editor/Editor.js',requires:'Dom',use:'Panel,Drap'});//配置一个模块
		addConfig({'Editor':{url:'wed/editor/Editor.js',requires:'Dom',use:'Panel,Drap'}});//配置多个模块
	*/
	addConfig : function(moduleName,details){
		if(typeof moduleName =='string'){
			var json=mix({},details);
			json.moduleName=moduleName;
			json.__callbacks=[];
			modules[moduleName]=json;
		}
		else if(isPlainObject(moduleName)) {
			for(var i in moduleName){
				ModuleH.addConfig(i,moduleName[i]);
			}
		}
	},

	/** 
	* 在数组中的每个项上运行一个函数，并将全部结果作为数组返回。
	* @method use
	* @static
	* @param {string} moduleName 需要接着加载的模块名。多个模块用“,”分隔
	* @param {Function} callback 需要执行的函数.
	* @return {void} 
	* @remark 
		需要考虑的情况：
		use的module未加载/加载中/已加载、二重required或use的文件已加载/加载中/未加载
	*/
	use: function(moduleName,callback){
		var modulesJson={},//需要加载的模块Json（用json效率快）
			modulesArray=[],//需要加载的模块Array（用array来排序）			
			names=moduleName.split(','),
			i,
			j,
			k,
			len,
			moduleI;

		while (names.length){//收集需要排队的模块到modulesJson
			var names2={};
			for(i=0;i<names.length;i++){
				var nameI=names[i];
				if(!nameI || QW[nameI]) continue; //如果已被预加载，也会忽略
				if (!modulesJson[nameI]){	//还没进行收集
					if(!modules[nameI]){	//还没进行config
						throw 'Unknown module: '+nameI;
					}
					if(!modules[nameI].loadStatus!=2) {//还没被加载过  loadStatus:1:加载中、2:已加载
						var checker=modules[nameI].loadedChecker;
						if(checker && checker()){ //如果有loaderChecker，则用loaderChecker判断一下是否已经加载过
							continue;
						}
						modulesJson[nameI]=modules[nameI];//加入队列。
					}
					var refs=['requires','use'];
					for(j=0;j<refs.length;j++){ //收集附带需要加载的模块
						var sRef= modules[nameI][refs[j]];
						if(sRef){
							var refNames=sRef.split(',');
							for(k=0;k<refNames.length;k++) names2[refNames[k]]=0;
						}
					}					
				}
			}
			names=[];
			for(i in names2){
				names.push(i);
			}
		}
		for(i in modulesJson){//转化成加载数组
			modulesArray.push(modulesJson[i]);
		}

		for(i=0,len=modulesArray.length;i<len;i++) {//排序。 本排序法节约代码，但牺了性能
			if(!modulesArray[i].requires) continue;
			for(j=i+1;j<len;j++){
				if(new RegExp('(^|,)'+modulesArray[j].moduleName+'(,|$)').test(modulesArray[i].requires)) {
					//如果发现前面的模块requires后面的模块，则将被required的模块移到前面来，并重新查它在新位置是否合适
					var moduleJ=modulesArray[j];
					modulesArray.splice(j,1);
					modulesArray.splice(i,0,moduleJ);
					i--;
					break;
				}
			}
		}

		var loadIdx=-1,//需要加载并且未加载的最后一个模块的index
			loadingIdx=-1;//需要加载并且正在加载的最后一个模块的index
		for(i=0;i<modulesArray.length;i++){
			moduleI=modulesArray[i];
			if(!moduleI.loadStatus && (new RegExp('(^|,)'+moduleI.moduleName+'(,|$)').test(moduleName)) ) loadIdx=i;
			if(moduleI.loadStatus == 1 && (new RegExp('(^|,)'+moduleI.moduleName+'(,|$)').test(moduleName)) ) loadingIdx=i;
		}
		if(loadIdx != -1) {//还有未开始加载的
			modulesArray[loadIdx].__callbacks.push(callback);
		}
		else if(loadingIdx!=-1) {//还有正在加载的
			modulesArray[loadingIdx].__callbacks.push(callback);
		}
		else{
			callback();
			return;
		}
		
		for(i=0;i<modulesArray.length;i++){
			moduleI=modulesArray[i];
			if(!moduleI.loadStatus) {//需要load的js。todo: 模块combo加载
				moduleI.loadStatus=1;
				loadingModules.push(moduleI);
			}
		}
		loadsJsInOrder();
	}
};

QW.ModuleH=ModuleH;

})();

//document.write('<script type="text/javascript" src="'+srcPath+'core/browser.js"><\/script>');
/*
	Copyright (c) 2009, Baidu Inc. All rights reserved.
	http://www.youa.com
	version: $version$ $release$ released
	author: yingjiakuan@baidu.com
*/


/**
 * @class Browser js的运行环境，浏览器以及版本信息。（Browser仅基于userAgent进行嗅探，存在不严谨的缺陷。）
 * @singleton 
 * @namespace QW 
 */
QW.Browser=function(){
	var na = window.navigator,
		ua = na.userAgent.toLowerCase(),
		browserTester = /(msie|webkit|gecko|presto|opera|safari|firefox|chrome|maxthon)[ \/]([\d.]+)/ig,
		Browser = {platform: na.platform};
	ua.replace(browserTester,function(a,b,c){
		var bLower=b.toLowerCase();
		Browser[bLower]=c;
	});
	if(Browser.opera) {//Opera9.8后版本号位置变化
		ua.replace(/opera.*version\/([\d.]+)/, function(a,b){Browser.opera=b;});
	}
	if(Browser.msie){
		Browser.ie = Browser.msie;
		var v = parseInt(Browser.msie);
		Browser.ie6 = v==6;
		Browser.ie7 = v==7;
		Browser.ie8 = v==8;
		Browser.ie9 = v==9;
	}
	return Browser;
}();
if(QW.Browser.ie){try{document.execCommand("BackgroundImageCache",false,true);}catch(e){}}

//document.write('<script type="text/javascript" src="'+srcPath+'core/string.h.js"><\/script>');
/*
	Copyright (c) 2009, Baidu Inc. All rights reserved.
	http://www.youa.com
	version: $version$ $release$ released
	author: yingjiakuan@baidu.com
*/

/**
 * @class StringH 核心对象String的扩展
 * @singleton
 * @namespace QW
 * @helper
 */

(function(){

var StringH = {
	/** 
	* 除去字符串两边的空白字符
	* @method trim
	* @static
	* @param {String} s 需要处理的字符串
	* @return {String}  除去两端空白字符后的字符串
	* @remark 如果字符串中间有很多连续tab,会有有严重效率问题,相应问题可以用下一句话来解决.
		return s.replace(/^[\s\xa0\u3000]+/g,"").replace(/([^\u3000\xa0\s])[\u3000\xa0\s]+$/g,"$1");
	*/
	trim:function(s){
		return s.replace(/^[\s\xa0\u3000]+|[\u3000\xa0\s]+$/g, "");
	},
	/** 
	* 对一个字符串进行多次replace
	* @method mulReplace
	* @static
	* @param {String} s  需要处理的字符串
	* @param {array} arr  数组，每一个元素都是由replace两个参数组成的数组
	* @return {String} 返回处理后的字符串
	* @example alert(mulReplace("I like aa and bb. JK likes aa.",[[/aa/g,"山"],[/bb/g,"水"]]));
	*/
	mulReplace:function (s,arr){
		for(var i=0;i<arr.length;i++) s=s.replace(arr[i][0],arr[i][1]);
		return s;
	},
	/** 
	* 字符串简易模板
	* @method format
	* @static
	* @param {String} s 字符串模板，其中变量以{0} {1}表示
	* @param {String} arg0 (Optional) 替换的参数
	* @return {String}  模板变量被替换后的字符串
	* @example alert(format("{0} love {1}.",'I','You'))
	*/
	format:function(s,arg0){
		var args=arguments;
		return s.replace(/\{(\d+)\}/ig,function(a,b){return args[b*1+1]||''});
	},

	/*
	* 字符串简易模板
	* @method tmpl
	* @static
	* @param {String} sTmpl 字符串模板，其中变量以｛$aaa｝表示
	* @param {Object} opts 模板参数
	* @return {String}  模板变量被替换后的字符串
	* @example alert(tmpl("{$a} love {$b}.",{a:"I",b:"you"}))
	tmpl:function(sTmpl,opts){
		return sTmpl.replace(/\{\$(\w+)\}/g,function(a,b){return opts[b]});
	},
	*/

	/** 
	* 字符串模板
	* @method tmpl
	* @static
	* @param {String} sTmpl 字符串模板，其中变量以{$aaa}表示。模板语法：
		分隔符为{xxx}，"}"之前没有空格字符。
		js表达式/js语句里的'}', 需使用' }'，即前面有空格字符
		{strip}...{/strip}里的所有\r\n打头的空白都会被清除掉
		{}里只能使用表达式，不能使用语句，除非使用以下标签
		{js ...}		－－任意js语句, 里面如果需要输出到模板，用print("aaa");
		{if(...)}		－－if语句，写法为{if($a>1)},需要自带括号
		{elseif(...)}	－－elseif语句，写法为{elseif($a>1)},需要自带括号
		{else}			－－else语句，写法为{else}
		{/if}			－－endif语句，写法为{/if}
		{for(...)}		－－for语句，写法为{for(var i=0;i<1;i++)}，需要自带括号
		{/for}			－－endfor语句，写法为{/for}
		{while(...)}	－－while语句,写法为{while(i-->0)},需要自带括号
		{/while}		－－endwhile语句, 写法为{/while}
	* @param {Object} opts (Optional) 模板参数
	* @return {String|Function}  如果调用时传了opts参数，则返回字符串；如果没传，则返回一个function（相当于把sTmpl转化成一个函数）

	* @example alert(tmpl("{$a} love {$b}.",{a:"I",b:"you"}));
	* @example alert(tmpl("{js print('I')} love {$b}.",{b:"you"}));
	*/
	tmpl:(function(){
		/*
		sArrName 拼接字符串的变量名。
		*/
		var sArrName="sArrCMX",sLeft=sArrName+'.push("';
		/*
			tag:模板标签,各属性含义：
			tagG: tag系列
			isBgn: 是开始类型的标签
			isEnd: 是结束类型的标签
			cond: 标签条件
			rlt: 标签结果
			sBgn: 开始字符串
			sEnd: 结束字符串
		*/
		var tags={
			'js':{tagG:'js',isBgn:1,isEnd:1,sBgn:'");',sEnd:';'+sLeft},	//任意js语句, 里面如果需要输出到模板，用print("aaa");
			'if':{tagG:'if',isBgn:1,rlt:1,sBgn:'");if',sEnd:'{'+sLeft},	//if语句，写法为{if($a>1)},需要自带括号
			'elseif':{tagG:'if',cond:1,rlt:1,sBgn:'");} else if',sEnd:'{'+sLeft},	//if语句，写法为{elseif($a>1)},需要自带括号
			'else':{tagG:'if',cond:1,rlt:2,sEnd:'");}else{'+sLeft},	//else语句，写法为{else}
			'/if':{tagG:'if',isEnd:1,sEnd:'");}'+sLeft},	//endif语句，写法为{/if}
			'for':{tagG:'for',isBgn:1,rlt:1,sBgn:'");for',sEnd:'{'+sLeft},	//for语句，写法为{for(var i=0;i<1;i++)},需要自带括号
			'/for':{tagG:'for',isEnd:1,sEnd:'");}'+sLeft},	//endfor语句，写法为{/for}
			'while':{tagG:'while',isBgn:1,rlt:1,sBgn:'");while',sEnd:'{'+sLeft},	//while语句,写法为{while(i-->0)},需要自带括号
			'/while':{tagG:'while',isEnd:1,sEnd:'");}'+sLeft}	//endwhile语句, 写法为{/while}
		};

		return function (sTmpl,opts){
			var N=-1,NStat=[];//语句堆栈;
			var ss=[
				[/\{strip\}([\s\S]*?)\{\/strip\}/g, function(a,b){return b.replace(/[\r\n]\s*\}/g," }").replace(/[\r\n]\s*/g,"");}],
				[/\\/g,'\\\\'],[/"/g,'\\"'],[/\r/g,'\\r'],[/\n/g,'\\n'], //为js作转码.
				[/\{[\s\S]*?\S\}/g,	//js里使用}时，前面要加空格。
					function(a){
					a=a.substr(1,a.length-2);
					for(var i=0;i<ss2.length;i++) a=a.replace(ss2[i][0],ss2[i][1]);
					var tagName=a;
					if(/^(.\w+)\W/.test(tagName)) tagName=RegExp.$1;
					var tag=tags[tagName];
					if(tag){
						if(tag.isBgn){
							var stat=NStat[++N]={tagG:tag.tagG,rlt:tag.rlt};
						}
						if(tag.isEnd){
							if(N<0) throw new Error("多余的结束标记"+a);
							stat=NStat[N--];
							if(stat.tagG!=tag.tagG) throw new Error("标记不匹配："+stat.tagG+"--"+tagName);
						}
						else if(!tag.isBgn){
							if(N<0) throw new Error("多余的标记"+a);
							stat=NStat[N];
							if(stat.tagG!=tag.tagG) throw new Error("标记不匹配："+stat.tagG+"--"+tagName);
							if(tag.cond && !(tag.cond & stat.rlt)) throw new Error("标记使用时机不对："+tagName);
							stat.rlt=tag.rlt;
						}
						return (tag.sBgn||'')+a.substr(tagName.length)+(tag.sEnd||'');
					}
					else{
						return '",('+a+'),"';
					}
				}]
			];
			var ss2=[[/\\n/g,'\n'],[/\\r/g,'\r'],[/\\"/g,'"'],[/\\\\/g,'\\'],[/\$(\w+)/g,'opts["$1"]'],[/print\(/g,sArrName+'.push(']];
			for(var i=0;i<ss.length;i++){
				sTmpl=sTmpl.replace(ss[i][0],ss[i][1]);
			}
			if(N>=0) throw new Error("存在未结束的标记："+NStat[N].tagG);
			sTmpl='var '+sArrName+'=[];'+sLeft+sTmpl+'");return '+sArrName+'.join("");';
			//alert('转化结果\n'+sTmpl);
			var fun=new Function('opts',sTmpl);
			if(arguments.length>1) return fun(opts);
			return fun;
		};
	})(),

	/** 
	* 判断一个字符串是否包含另一个字符串
	* @method contains
	* @static
	* @param {String} s 字符串
	* @param {String} opts 子字符串
	* @return {String} 模板变量被替换后的字符串
	* @example alert(contains("aaabbbccc","ab"))
	*/
	contains:function(s,subStr){
		return s.indexOf(subStr)>-1;
	},

	/** 
	* 全角字符转半角字符
		全角空格为12288，转化成" "；
		全角句号为12290，转化成"."；
		其他字符半角(33-126)与全角(65281-65374)的对应关系是：均相差65248 
	* @method dbc2sbc
	* @static
	* @param {String} s 需要处理的字符串
	* @return {String}  返回转化后的字符串
	* @example 
		var s="发票号是ＢＢＣ１２３４５６，发票金额是１２.３５元";
		alert(dbc2sbc(s));
	*/
	dbc2sbc:function(s)
	{
		return StringH.mulReplace(s,[
			[/[\uff01-\uff5e]/g,function(a){return String.fromCharCode(a.charCodeAt(0)-65248);}],
			[/\u3000/g,' '],
			[/\u3002/g,'.']
		]);
	},

	/** 
	* 得到字节长度
	* @method byteLen
	* @static
	* @param {String} s 字符串
	* @return {number}  返回字节长度
	*/
	byteLen:function(s)
	{
		return s.replace(/[^\x00-\xff]/g,"--").length;
	},

	/** 
	* 得到指定字节长度的子字符串
	* @method subByte
	* @static
	* @param {String} s 字符串
	* @param {number} len 字节长度
	* @optional {string} tail 结尾字符串
	* @return {string}  返回指定字节长度的子字符串
	*/
	subByte:function(s, len, tail)
	{
		if(StringH.byteLen(s)<=len) return s;
		tail = tail||'';
		len -= StringH.byteLen(tail);
		return s=s.substr(0,len).replace(/([^\x00-\xff])/g,"$1 ")//双字节字符替换成两个
			.substr(0,len)//截取长度
			.replace(/[^\x00-\xff]$/,"")//去掉临界双字节字符
			.replace(/([^\x00-\xff]) /g,"$1") + tail;//还原
	},

	/** 
	* 驼峰化字符串。将“ab-cd”转化为“abCd”
	* @method camelize
	* @static
	* @param {String} s 字符串
	* @return {String}  返回转化后的字符串
	*/
	camelize:function(s) {
		return s.replace(/\-(\w)/ig,function(a,b){return b.toUpperCase();});
	},

	/** 
	* 反驼峰化字符串。将“abCd”转化为“ab-cd”。
	* @method decamelize
	* @static
	* @param {String} s 字符串
	* @return {String} 返回转化后的字符串
	*/
	decamelize:function(s) {
		return s.replace(/[A-Z]/g,function(a){return "-"+a.toLowerCase();});
	},

	/** 
	* 字符串为javascript转码
	* @method encode4Js
	* @static
	* @param {String} s 字符串
	* @return {String} 返回转化后的字符串
	* @example 
		var s="my name is \"JK\",\nnot 'Jack'.";
		window.setTimeout("alert('"+encode4Js(s)+"')",10);
	*/
	encode4Js:function(s){
		return StringH.mulReplace(s,[
			[/\\/g,"\\u005C"],
			[/"/g,"\\u0022"],
			[/'/g,"\\u0027"],
			[/\//g,"\\u002F"],
			[/\r/g,"\\u000A"],
			[/\n/g,"\\u000D"],
			[/\t/g,"\\u0009"]
		]);
	},

	/** 
	* 为http的不可见字符、不安全字符、保留字符作转码
	* @method encode4Http
	* @static
	* @param {String} s 字符串
	* @return {String} 返回处理后的字符串
	*/
	encode4Http:function(s){
		return s.replace(/[\u0000-\u0020\u0080-\u00ff\s"'#\/\|\\%<>\[\]\{\}\^~;\?\:@=&]/,function(a){return encodeURIComponent(a)});
	},

	/** 
	* 字符串为Html转码
	* @method encode4Html
	* @static
	* @param {String} s 字符串
	* @return {String} 返回处理后的字符串
	* @example 
		var s="<div>dd";
		alert(encode4Html(s));
	*/
	encode4Html:function(s){
		var el = document.createElement('pre');//这里要用pre，用div有时会丢失换行，例如：'a\r\n\r\nb'
		var text = document.createTextNode(s);
		el.appendChild(text);
		return el.innerHTML;
	},

	/** 
	* 字符串为Html的value值转码
	* @method encode4HtmlValue
	* @static
	* @param {String} s 字符串
	* @return {String} 返回处理后的字符串
	* @example:
		var s="<div>\"\'ddd";
		alert("<input value='"+encode4HtmlValue(s)+"'>");
	*/
	encode4HtmlValue:function(s){
		return StringH.encode4Html(s).replace(/"/g,"&quot;").replace(/'/g,"&#039;");
	},

	/** 
	* 与encode4Html方法相反，进行反编译
	* @method decode4Html
	* @static
	* @param {String} s 字符串
	* @return {String} 返回处理后的字符串
	*/
	decode4Html:function(s){
		var div = document.createElement('div');
		div.innerHTML = StringH.stripTags(s);
		return div.childNodes[0] ? div.childNodes[0].nodeValue+'' : '';
	},
	/** 
	* 将所有tag标签消除，即去除<tag>，以及</tag>
	* @method stripTags
	* @static
	* @param {String} s 字符串
	* @return {String} 返回处理后的字符串
	*/
	stripTags:function(s) {
		return s.replace(/<[^>]*>/gi, '');
	},
	/** 
	* eval某字符串。如果叫"eval"，在这里需要加引号，才能不影响YUI压缩。不过其它地方用了也会有问题，所以改名evalJs，
	* @method evalJs
	* @static
	* @param {String} s 字符串
	* @param {any} opts 运行时需要的参数。
	* @return {any} 根据字符结果进行返回。
	*/
	evalJs:function(s,opts) { //如果用eval，在这里需要加引号，才能不影响YUI压缩。不过其它地方用了也会有问题，所以改成evalJs，
		return new Function("opts",s)(opts);
	},
	/** 
	* eval某字符串，这个字符串是一个js表达式，并返回表达式运行的结果
	* @method evalExp
	* @static
	* @param {String} s 字符串
	* @param {any} opts eval时需要的参数。
	* @return {any} 根据字符结果进行返回。
	*/
	evalExp:function(s,opts) {
		return new Function("opts","return "+s+";")(opts);
	}
};

QW.StringH=StringH;

})();

//document.write('<script type="text/javascript" src="'+srcPath+'core/object.h.js"><\/script>');
/*
	Copyright (c) 2009, Baidu Inc. All rights reserved.
	http://www.youa.com
	version: $version$ $release$ released
	author: wuliang@baidu.com
*/


/**
 * @class ObjectH 核心对象Object的静态扩展
 * @singleton
 * @namespace QW
 * @helper
 */

(function(){
var encode4Js=QW.StringH.encode4Js,
	getConstructorName=function(o){
		return o!=null && Object.prototype.toString.call(o).slice(8,-1);
	};
var ObjectH = {
	/** 
	* 判断一个变量是否是boolean值或boolean对象
	* @method isBoolean
	* @static
	* @param {any} obj 目标变量
	* @returns {boolean} 
	*/
	isBoolean: function (obj){
		return typeof obj == 'boolean' || getConstructorName(obj) =='Boolean';
	},
	
	/** 
	* 判断一个变量是否是number值或Number对象
	* @method isNumber
	* @static
	* @param {any} obj 目标变量
	* @returns {boolean} 
	*/
	isNumber: function (obj){
		return getConstructorName(obj) =='Number' && isFinite(obj) ;
	},
	
	/** 
	* 判断一个变量是否是string值或String对象
	* @method isString
	* @static
	* @param {any} obj 目标变量
	* @returns {boolean} 
	*/
	isString: function (obj){
		return getConstructorName(obj) =='String';
	},
	
	/** 
	* 判断一个变量是否是Date对象
	* @method isDate
	* @static
	* @param {any} obj 目标变量
	* @returns {boolean} 
	*/
	isDate: function (obj){
		return getConstructorName(obj) == 'Date';
	},
	
	/** 
	* 判断一个变量是否是function对象
	* @method isFunction
	* @static
	* @param {any} obj 目标变量
	* @returns {boolean} 
	*/
	isFunction: function (obj){
		return getConstructorName(obj) =='Function';
	},
	
	/** 
	* 判断一个变量是否是RegExp对象
	* @method isRegExp
	* @static
	* @param {any} obj 目标变量
	* @returns {boolean} 
	*/
	isRegExp: function (obj){
		return getConstructorName(obj) =='RegExp';
	},
	/** 
	* 判断一个变量是否是Array对象
	* @method isArray
	* @static
	* @param {any} obj 目标变量
	* @returns {boolean} 
	*/
	isArray: function (obj){
		return getConstructorName(obj) =='Array';
	},
	
	/** 
	* 判断一个变量是否是typeof 'object'
	* @method isObject
	* @static
	* @param {any} obj 目标变量
	* @returns {boolean} 
	*/
	isObject: function (obj){
		return obj !== null && typeof obj == 'object';
	},
	
	/** 
	* 判断一个变量是否是Array泛型，即:有length属性并且该属性是数值
	* @method isArrayLike
	* @static
	* @param {any} obj 目标变量
	* @returns {boolean} 
	*/
	isArrayLike: function (obj){
		return !!obj && obj.nodeType!=1 && typeof obj.length == 'number';
	},

	/** 
	* 判断一个变量的constructor是否是Object。---通常可用于判断一个对象是否是{}或由new Object()产生的对象。
	* @method isPlainObject
	* @static
	* @param {any} obj 目标变量
	* @returns {boolean} 
	*/
	isPlainObject: function (obj){
		return !!obj && obj.constructor === Object;
	},
	
	/** 
	* 判断一个变量是否是Wrap对象
	* @method isWrap
	* @static
	* @param {any} obj 目标变量
	* @param {string} coreName (Optional) core的属性名，默认为'core'
	* @returns {boolean} 
	*/
	isWrap: function (obj, coreName){
		return !!obj && !!obj[coreName||'core'];
	},

	/** 
	* 判断一个变量是否是Html的Element元素
	* @method isElement
	* @static
	* @param {any} obj 目标变量
	* @returns {boolean} 
	*/
	isElement: function (obj){
		return !!obj && obj.nodeType == 1;
	},

	/** 
	* 为一个对象设置属性
	* @method set
	* @static
	* @param {Object} obj 目标对象
	* @param {string} prop 属性名
	* @param {any} value 属性值
	* @returns {void} 
	*/
	set:function (obj,prop,value){
		obj[prop]=value;
	},

	/** 
	* 获取一个对象的属性值:
	* @method set
	* @static
	* @param {Object} obj 目标对象
	* @param {string} prop 属性名
	* @returns {any} 
	*/
	get:function (obj,prop){
		return obj[prop];
	},

	/** 
	* 为一个对象设置属性，支持以下三种调用方式:
		setEx(obj, prop, value)
		setEx(obj, propJson)
		setEx(obj, props, values)
		---特别说明propName里带的点，会被当作属性的层次
	* @method setEx
	* @static
	* @param {Object} obj 目标对象
	* @param {string|Json|Array|setter} prop 如果是string,则当属性名(属性名可以是属性链字符串,如"style.display")；如果是function，则当setter函数；如果是Json，则当prop/value对；如果是数组，则当prop数组，第二个参数对应的也是value数组
	* @param {any | Array} value 属性值
	* @returns {Object} obj 
	* @example 
		var el={style:{},firstChild:{}};
		setEx(el,"id","aaaa");
		setEx(el,{className:"cn1", 
			"style.display":"block",
			"style.width":"8px"
		});
	*/
	setEx:function (obj,prop,value){
		if(ObjectH.isArray(prop)) {
			//setEx(obj, props, values)
			for(var i=0;i<prop.length;i++){
				ObjectH.setEx(obj,prop[i],value[i]);
			}
		}
		else if(typeof prop == 'object') {
			//setEx(obj, propJson)
			for(i in prop)
				ObjectH.setEx(obj,i,prop[i]);
		}
		else if(typeof prop == 'function'){//getter
			var args=[].slice.call(arguments,1);
			args[0]=obj;
			prop.apply(null,args);
		}
		else {
			//setEx(obj, prop, value);
			var keys=(prop+"").split(".");
			i=0;
			for(var obj2=obj, len=keys.length-1;i<len;i++){
				obj2=obj2[keys[i]];
			}
			obj2[keys[i]]=value;
		}
		return obj;
	},

	/** 
	* 得到一个对象的相关属性，支持以下三种调用方式:
		getEx(obj, prop) -> obj[prop]
		getEx(obj, props) -> propValues
		getEx(obj, propJson) -> propJson
	* @method getEx
	* @static
	* @param {Object} obj 目标对象
	* @param {string|Array|getter} prop 如果是string,则当属性名(属性名可以是属性链字符串,如"style.display")；如果是function，则当getter函数；如果是array，则当获取的属性名序列；
		如果是Array，则当props看待
	* @param {boolean} returnJson 是否需要返回Json对象
	* @returns {any|Array|Json} 返回属性值
	* @example 
		getEx(obj,"style"); //返回obj["style"];
		getEx(obj,"style.color"); //返回 obj.style.color;
		getEx(obj,"style.color",true); //返回 {"style.color":obj.style.color};
		getEx(obj,["id","style.color"]); //返回 [obj.id, obj.style.color];
		getEx(obj,["id","style.color"],true); //返回 {id:obj.id, "style.color":obj.style.color};
	*/
	getEx:function (obj,prop,returnJson){
		if(ObjectH.isArray(prop)){
			if(returnJson){
				var ret={};
				for(var i =0; i<prop.length;i++){
					ret[prop[i]]=ObjectH.getEx(obj,prop[i]);
				}
			}
			else{
				//getEx(obj, props)
				ret=[];
				for(i =0; i<prop.length;i++){
					ret[i]=ObjectH.getEx(obj,prop[i]);
				}
			}
		}
		else if(typeof prop == 'function'){//getter
			var args=[].slice.call(arguments,1);
			args[0]=obj;
			return prop.apply(null,args);
		}
		else {
			//getEx(obj, prop)
			var keys=(prop+"").split(".");
			ret=obj;
			for(i=0;i<keys.length;i++){
				ret=ret[keys[i]];
			}
			if(returnJson) {
				var json={};
				json[prop]=ret;
				return json;
			}
		}
		return ret;
	},

	/** 
	* 将源对象的属性并入到目标对象
	* @method mix
	* @static
	* @param {Object} des 目标对象
	* @param {Object|Array} src 源对象，如果是数组，则依次并入
	* @param {boolean} override (Optional) 是否覆盖已有属性
	* @returns {Object} des
	*/
	mix: function(des, src, override){
		if(ObjectH.isArray(src)){
			for(var i = 0, len = src.length; i<len; i++){
				ObjectH.mix(des, src[i], override);
			}
			return des;
		}
		for(i in src){
			if(override || !(des[i]) && !(i in des) ){
				des[i] = src[i];
			}
		}
		return des;
	},

	/**
	* <p>输出一个对象里面的内容</p>
	* <p><strong>如果属性被"."分隔，会取出深层次的属性</strong>，例如:</p>
	* <p>ObjectH.dump(o, "a.b"); //得到 {"a.b": o.a.b}</p>
	* @method dump
	* @static
	* @param {Object} obj 被操作的对象
	* @param {Array} props 包含要被复制的属性名称的数组
	* @return {Object} 包含被dump出的属性的对象 
	*/
	dump: function(obj, props){
		var ret = {};
		for(var i = 0, len = props.length; i < len; i++){
			if(i in props){
				var key = props[i];
				ret[key] = ObjectH.get(obj, key);
			}
		}
		return ret;
	},
	/**
	* 在对象中的每个属性项上运行一个函数，并将函数返回值作为属性的值。
	* @method map
	* @static
	* @param {Object} obj 被操作的对象
	* @param {function} fn 迭代计算每个属性的算子，该算子迭代中有三个参数value-属性值，key-属性名，obj，当前对象
	* @param {Object} thisObj (Optional)迭代计算时的this
	* @return {Object} 返回包含这个对象中所有属性计算结果的对象
	*/
	map : function(obj, fn, thisObj){
		var ret = {};
		for(var key in obj){
			ret[key] = fn.call(thisObj, obj[key], key, obj);
		}
		return ret;
	},
	/**
	* 得到一个对象中所有可以被枚举出的属性的列表
	* @method keys
	* @static
	* @param {Object} obj 被操作的对象
	* @return {Array} 返回包含这个对象中所有属性的数组
	*/
	keys : function(obj){
		var ret = [];
		for(var key in obj){
			if(obj.hasOwnProperty(key)){ 
				ret.push(key);
			}
		}
		return ret;
	},

	/**
	* 以keys/values数组的方式添加属性到一个对象<br/>
	* <strong>如果values的长度大于keys的长度，多余的元素将被忽略</strong>
	* @method fromArray
	* @static
	* @param {Object} obj 被操作的对象
	* @param {Array} keys 存放key的数组
	* @param {Array} values 存放value的数组
	* @return {Object} 返回添加了属性的对象
	*/
	fromArray : function(obj, keys, values){
		values = values || [];
		for(var i = 0, len = keys.length; i < len; i++){
			obj[keys[i]] = values[i];
		}
		return obj;
	},

	/**
	* 得到一个对象中所有可以被枚举出的属性值的列表
	* @method values
	* @static
	* @param {Object} obj 被操作的对象
	* @return {Array} 返回包含这个对象中所有属性值的数组
	*/
	values : function(obj){
		var ret = [];
		for(var key in obj){
			if(obj.hasOwnProperty(key)){ 
				ret.push(obj[key]);
			}
		}
		return ret;
	},
	/**
	 * 以某对象为原型创建一个新的对象 （by Ben Newman）
	 * @method create
	 * @static 
	 * @param {Object} proto 作为原型的对象
	 * @optional {Object} props 附加属性
	 */
	create : function(proto, props){
		var ctor = function(ps){
			if(ps){
			  ObjectH.mix(this, ps, true);
			}
		};
		ctor.prototype = proto;
		return new ctor(props);		
	},
	/** 
	* 序列化一个对象(只序列化String,Number,Boolean,Date,Array,Json对象和有toJSON方法的对象,其它的对象都会被序列化成null)
	* @method stringify
	* @static
	* @param {Object} obj 需要序列化的Json、Array对象或其它对象
	* @returns {String} : 返回序列化结果
	* @example 
		var card={cardNo:"bbbb1234",history:[{date:"2008-09-16",count:120.0,isOut:true},1]};
		alert(stringify(card));
	*/
	stringify:function (obj){
		if(obj==null) return null;
		if(obj.toJSON) {
			obj= obj.toJSON();
		}
		var type=typeof obj;
		switch(type){
			case 'string': return '"'+encode4Js(obj)+'"';
			case 'number': 
			case 'boolean': return obj+'';
			case 'object' :
				if(obj instanceof Date)  return 'new Date(' + obj.getTime() + ')';
				if(obj instanceof Array) {
					var ar=[];
					for(var i=0;i<obj.length;i++) ar[i]=ObjectH.stringify(obj[i]);
					return '['+ar.join(',')+']';
				}
				if(ObjectH.isPlainObject(obj)){
					ar=[];
					for(i in obj){
						ar.push('"'+encode4Js(i+'')+'":'+ObjectH.stringify(obj[i]));
					}
					return '{'+ar.join(',')+'}';
				}
		}
		return null;//无法序列化的，返回null;
	}

};

QW.ObjectH=ObjectH;
})();

//document.write('<script type="text/javascript" src="'+srcPath+'core/array.h.js"><\/script>');
/*
	Copyright (c) 2009, Baidu Inc. All rights reserved.
	http://www.youa.com
	version: $version$ $release$ released
	author: yingjiakuan@baidu.com
*/

/**
 * @class ArrayH 核心对象Array的扩展
 * @singleton 
 * @namespace QW
 * @helper
 */
(function(){

var ArrayH = {
	/** 
	* 在数组中的每个项上运行一个函数，并将全部结果作为数组返回。
	* @method map
	* @static
	* @param {Array} arr 待处理的数组.
	* @param {Function} callback 需要执行的函数.
	* @param {Object} pThis (Optional) 指定callback的this对象.
	* @return {Array} 返回满足过滤条件的元素组成的新数组 
	* @example 
		var arr=["aa","ab","bc"];
		var arr2=map(arr,function(a,b){return a.substr(0,1)=="a"});
		alert(arr2);
	*/
	map:function(arr,callback,pThis){
		var len=arr.length;
		var rlt=new Array(len);
		for (var i =0;i<len;i++) {
			if (i in arr) rlt[i]=callback.call(pThis,arr[i],i,arr);
		}
		return rlt;
	},

	/** 
	* 对Array的每一个元素运行一个函数。
	* @method forEach
	* @static
	* @param {Array} arr 待处理的数组.
	* @param {Function} callback 需要执行的函数.
	* @optional {Object} pThis (Optional) 指定callback的this对象.
	* @return {void}  
	* @example 
		var arr=["a","b","c"];
		var dblArr=[];
		forEach(arr,function(a,b){dblArr.push(b+":"+a+a);});
		alert(dblArr);
	*/
	forEach:function(arr,callback,pThis){
		for (var i =0,len=arr.length;i<len;i++){
			if (i in arr) callback.call(pThis,arr[i],i,arr);
		}
	},

	/** 
	* 在数组中的每个项上运行一个函数，并将函数返回真值的项作为数组返回。
	* @method filter
	* @static
	* @param {Array} arr 待处理的数组.
	* @param {Function} callback 需要执行的函数.
	* @optional {Object} pThis (Optional) 指定callback的this对象.
	* @return {Array} 返回满足过滤条件的元素组成的新数组 
	* @example 
		var arr=["aa","ab","bc"];
		var arr2=filter(arr,function(a,b){return a.substr(0,1)=="a"});
		alert(arr2);
	*/
	filter:function(arr,callback,pThis){
		var rlt=[];
		for (var i =0,len=arr.length;i<len;i++) {
			if((i in arr) && callback.call(pThis,arr[i],i,arr)) rlt.push(arr[i]);
		}
		return rlt;
	},

	/** 
	* 判断数组中是否有元素满足条件。
	* @method some
	* @static
	* @param {Array} arr 待处理的数组.
	* @param {Function} callback 需要执行的函数.
	* @optional {Object} pThis (Optional) 指定callback的this对象.
	* @return {boolean} 如果存在元素满足条件，则返回true. 
	* @example 
		var arr=["aa","ab","bc"];
		var arr2=filter(arr,function(a,b){return a.substr(0,1)=="a"});
		alert(arr2);
	*/
	some:function(arr,callback,pThis){
		for (var i =0,len=arr.length;i<len;i++) {
			if(i in arr && callback.call(pThis,arr[i],i,arr)) return true;
		}
		return false;
	},

	/** 
	* 判断数组中所有元素都满足条件。
	* @method every
	* @static
	* @param {Array} arr 待处理的数组.
	* @param {Function} callback 需要执行的函数.
	* @optional {Object} pThis (Optional) 指定callback的this对象.
	* @return {boolean} 所有元素满足条件，则返回true. 
	* @example 
		var arr=["aa","ab","bc"];
		var arr2=filter(arr,function(a,b){return a.substr(0,1)=="a"});
		alert(arr2);
	*/
	every:function(arr,callback,pThis){
		for (var i =0,len=arr.length;i<len;i++) {
			if(i in arr && !callback.call(pThis,arr[i],i,arr)) return false;
		}
		return true;
	},

	/** 
	* 返回一个元素在数组中的位置（从前往后找）。如果数组里没有该元素，则返回-1
	* @method indexOf
	* @static
	* @param {Array} arr 待处理的数组.
	* @param {Object} obj 元素，可以是任何类型
	* @optional {int} fromIdx (Optional) 从哪个位置开始找起，如果为负，则表示从length+startIdx开始找
	* @return {int} 则返回该元素在数组中的位置.
	* @example 
		var arr=["a","b","c"];
		alert(indexOf(arr,"c"));
	*/
	indexOf:function(arr,obj,fromIdx){
		var len=arr.length;
		fromIdx=fromIdx|0;//取整
		if(fromIdx<0) fromIdx+=len;
		if(fromIdx<0) fromIdx=0;
		for(; fromIdx < len; fromIdx ++){
			if(fromIdx in arr && arr[fromIdx] === obj) return fromIdx;
		}
		return -1;
	},

	/** 
	* 返回一个元素在数组中的位置（从后往前找）。如果数组里没有该元素，则返回-1
	* @method lastIndexOf
	* @static
	* @param {Array} arr 待处理的数组.
	* @param {Object} obj 元素，可以是任何类型
	* @optional {int} fromIdx (Optional) 从哪个位置开始找起，如果为负，则表示从length+startIdx开始找
	* @return {int} 则返回该元素在数组中的位置.
	* @example 
		var arr=["a","b","a"];
		alert(lastIndexOf(arr,"a"));
	*/
	lastIndexOf:function(arr,obj,fromIdx){
		var len=arr.length;
		fromIdx=fromIdx|0;//取整
		if(!fromIdx || fromIdx>=len) fromIdx=len-1;
		if(fromIdx<0) fromIdx+=len;
		for(; fromIdx >-1; fromIdx --){
			if(fromIdx in arr && arr[fromIdx] === obj) return fromIdx;
		}
		return -1;
	},

	/** 
	* 判断数组是否包含某元素
	* @method contains
	* @static
	* @param {Array} arr 待处理的数组.
	* @param {Object} obj 元素，可以是任何类型
	* @return {boolean} 如果元素存在于数组，则返回true，否则返回false
	* @example 
		var arr=["a","b","c"];
		alert(contains(arr,"c"));
	*/
	contains:function(arr,obj) {
		return (ArrayH.indexOf(arr,obj) >= 0);
	},

	/** 
	* 清空一个数组
	* @method clear
	* @static
	* @param {Array} arr 待处理的数组.
	* @return {void} 
	*/
	clear:function(arr){
		arr.length = 0;
	},

	/** 
	* 将数组里的某(些)元素移除。
	* @method remove
	* @static
	* @param {Array} arr 待处理的数组.
	* @param {Object} obj0 待移除元素
	* @param {Object} obj1 … 待移除元素
	* @return {number} 返回第一次被移除的位置。如果没有任何元素被移除，则返回-1.
	* @example 
		var arr=["a","b","c"];
		remove(arr,"a","c");
		alert(arr);
	*/
	remove:function(arr,obj){
		var idx=-1;
		for(var i=1;i<arguments.length;i++){
			var oI=arguments[i];
			for(var j=0;j<arr.length;j++){
				if(oI === arr[j]) {
					if(idx<0) idx=j;
					arr.splice(j--,1);
				}
			}
		}
		return idx;
	},

	/** 
	* 数组元素除重，得到新数据
	* @method unique
	* @static
	* @param {Array} arr 待处理的数组.
	* @return {void} 数组元素除重，得到新数据
	* @example 
		var arr=["a","b","a"];
		alert(unique(arr));
	*/
	unique:function(arr){
		var rlt = [],
			oI=null,
			indexOf=Array.IndexOf || ArrayH.indexOf;
		for(var i = 0, len=arr.length ; i < len; i ++){
			if(indexOf(rlt,oI=arr[i])<0){
				rlt.push(oI);
			}
		}
		return rlt;
	},

	/** 
	* 为数组元素进行递推操作。
	* @method reduce
	* @static
	* @param {Array} arr 待处理的数组.
	* @param {Function} callback 需要执行的函数。
	* @param {any} initial (Optional) 初始值，如果没有这初始，则从第一个有效元素开始。没有初始值，并且没有有效元素，会抛异常
	* @return {any} 返回递推结果. 
	* @example 
		var arr=[1,2,3];
		alert(reduce(arr,function(a,b){return Math.max(a,b);}));
	*/
	reduce:function(arr,callback,initial){
		var len=arr.length;
		var i=0;
		if(arguments.length<3){//找到第一个有效元素当作初始值
			var hasV=0;
			for(;i<len;i++){
				if(i in arr) {initial=arr[i++];hasV=1;break;}
			}
			if(!hasV) throw new Error("No component to reduce");
		}
		for(;i<len;i++){
			if(i in arr) initial=callback(initial,arr[i],i,arr);
		}
		return initial;
	},

	/** 
	* 为数组元素进行逆向递推操作。
	* @method reduceRight
	* @static
	* @param {Array} arr 待处理的数组.
	* @param {Function} callback 需要执行的函数。
	* @param {any} initial (Optional) 初始值，如果没有这初始，则从第一个有效元素开始。没有初始值，并且没有有效元素，会抛异常
	* @return {any} 返回递推结果. 
	* @example 
		var arr=[1,2,3];
		alert(reduceRight(arr,function(a,b){return Math.max(a,b);}));
	*/
	reduceRight:function(arr,callback,initial){
		var len=arr.length;
		var i=len-1;
		if(arguments.length<3){//逆向找到第一个有效元素当作初始值
			var hasV=0;
			for(;i>-1;i--){
				if(i in arr) {initial=arr[i--];hasV=1;break;}
			}
			if(!hasV) throw new Error("No component to reduceRight");
		}
		for(;i>-1;i--){
			if(i in arr) initial=callback(initial,arr[i],i,arr);
		}
		return initial;
	},

	/**
	* 将一个数组扁平化
	* @method expand
	* @static
	* @param arr {Array} 要扁平化的数组
	* @return {Array} 扁平化后的数组
	*/	
	expand:function(arr){
		return [].concat.apply([], arr);
	},

	/** 
	* 将一个泛Array转化成一个Array对象。
	* @method toArray
	* @static
	* @param {Array} arr 待处理的Array的泛型对象.
	* @return {Array}  
	*/
	toArray:function(arr){
		var ret=[];
		for(var i=0;i<arr.length;i++){
			ret[i]=arr[i];
		}
		return ret;
	},

	
	/** 
	* 对数组进行包装。
	* @method wrap
	* @static
	* @param {Array} arr 待处理的数组.
	* @param {Class} constructor 构造器
	* @returns {Object}: 返回new constructor(arr)
	*/
	wrap:function(arr,constructor){
		return new constructor(arr);
	}
};

QW.ArrayH=ArrayH;

})();

//document.write('<script type="text/javascript" src="'+srcPath+'core/hashset.h.js"><\/script>');
/*
	Copyright (c) 2009, Baidu Inc. All rights reserved.
	http://www.youa.com
	version: $version$ $release$ released
	author: wuliang@baidu.com
*/


/**
 * @class HashsetH HashsetH是对不含有重复元素的数组进行操作的Helper
 * @singleton 
 * @namespace QW
 * @helper 
 */

(function(){
var contains = QW.ArrayH.contains;

var HashsetH = {
   /** 
	* 合并两个已经uniquelize过的数组，相当于两个数组concat起来，再uniquelize，不过效率更高
	* @method union
	* @static
	* @param {Array} arr 待处理的数组.
	* @param {Array} arr2 待处理的数组.
	* @return {Array} 返回一个新数组
	* @example 
		var arr=["a","b"];
		var arr2=["b","c"];
		alert(union(arr,arr2));
	*/
	union:function(arr,arr2){
		var ra = [];
		for(var i = 0, len = arr2.length; i < len; i ++){
			if(!contains(arr, arr2[i])) {
				ra.push(arr2[i]);
			}
		}
		return arr.concat(ra);
	},
   /** 
	* 求两个已经uniquelize过的数组的交集
	* @method intersect
	* @static
	* @param {Array} arr 待处理的数组.
	* @param {Array} arr2 待处理的数组.
	* @return {Array} 返回一个新数组
	* @example 
		var arr=["a","b"];
		var arr2=["b","c"];
		alert(intersect(arr,arr2));
	*/
	intersect:function(arr, arr2){
		var ra = [];
		for(var i = 0, len = arr2.length; i < len; i ++){
			if(contains(arr, arr2[i])) {
				ra.push(arr2[i]);
			}
		}
		return ra;		
	},
   /** 
	* 求两个已经uniquelize过的数组的差集
	* @method minus
	* @static
	* @param {Array} arr 待处理的数组.
	* @param {Array} arr2 待处理的数组.
	* @return {Array} 返回一个新数组
	* @example 
		var arr=["a","b"];
		var arr2=["b","c"];
		alert(minus(arr,arr2));
	*/
	minus:function(arr, arr2){
		var ra = [];
		for(var i = 0, len = arr2.length; i < len; i ++){
			if(!contains(arr, arr2[i])) {
				ra.push(arr2[i]);
			}
		}
		return ra;		
	},
   /** 
	* 求两个已经uniquelize过的数组的补集
	* @method complement
	* @static
	* @param {Array} arr 待处理的数组.
	* @param {Array} arr2 待处理的数组.
	* @return {Array} 返回一个新数组
	* @example 
		var arr=["a","b"];
		var arr2=["b","c"];
		alert(complement(arr,arr2));
	*/
	complement:function(arr, arr2){
		return HashsetH.minus(arr, arr2).concat(HashsetH.minus(arr2, arr));		
	}
};

QW.HashSetH=HashsetH;

})();

//document.write('<script type="text/javascript" src="'+srcPath+'core/date.h.js"><\/script>');
/*
	Copyright (c) 2009, Baidu Inc. All rights reserved.
	http://www.youa.com
	version: $version$ $release$ released
	author: yingjiakuan@baidu.com
*/

/**
 * @class DateH 核心对象Date的扩展
 * @singleton 
 * @namespace QW
 * @helper
 */

(function(){

var DateH = {
	/** 
	* 格式化日期
	* @method format
	* @static
	* @param {Date} d 日期对象
	* @param {string} pattern 日期格式(y年M月d天h时m分s秒)，默认为"yyyy-MM-dd"
	* @return {string}  返回format后的字符串
	* @example
		var d=new Date();
		alert(format(d," yyyy年M月d日\n yyyy-MM-dd\n MM-dd-yy\n yyyy-MM-dd hh:mm:ss"));
	*/
	format:function(d,pattern)
	{
		pattern=pattern||"yyyy-MM-dd";
		var y=d.getFullYear();
		var o = {
			"M" : d.getMonth()+1, //month
			"d" : d.getDate(),    //day
			"h" : d.getHours(),   //hour
			"m" : d.getMinutes(), //minute
			"s" : d.getSeconds() //second
		}
		pattern=pattern.replace(/(y+)/ig,function(a,b){var len=Math.min(4,b.length);return (y+"").substr(4-len);});
		for(var i in o){
			pattern=pattern.replace(new RegExp("("+i+"+)","g"),function(a,b){return (o[i]<10 && b.length>1 )? "0"+o[i] : o[i]});
		}
		return pattern;
	}
};

QW.DateH = DateH;

})();

//document.write('<script type="text/javascript" src="'+srcPath+'core/function.h.js"><\/script>');
/*
	Copyright (c) 2009, Baidu Inc. All rights reserved.
	http://www.youa.com
	version: $version$ $release$ released
	author: wuliang@baidu.com
*/

/**
 * @class FunctionH 核心对象Function的扩展
 * @singleton 
 * @namespace QW
 * @helper
 */
(function(){

var FunctionH = {
	/**
	 * 函数包装器 methodize，对函数进行methodize化，使其的第一个参数为this，或this[attr]。
	 * @method methodize
	 * @static
	 * @param {function} func要方法化的函数
	 * @optional {string} attr 属性
	 * @return {function} 已方法化的函数
	 */
	methodize: function(func,attr){
		if(attr) return function(){
			var ret = func.apply(null,[this[attr]].concat([].slice.call(arguments)));
			return ret;
		};
		return function(){
			var ret = func.apply(null,[this].concat([].slice.call(arguments)));
			return ret;
		};
	},
   /** 对函数进行集化，使其第一个参数可以是数组
	* @method mul
	* @static
	* @param {function} func
	* @param {bite} opt 操作配置项，缺省表示默认，
					1 表示getFirst将只操作第一个元素，
					2 表示joinLists，如果第一个参数是数组，将操作的结果扁平化返回
	* @return {Object} 已集化的函数
	*/
	mul: function(func, opt){
		
		var getFirst = opt == 1, joinLists = opt == 2;

		if(getFirst){
			return function(){
				var list = arguments[0];
				if(!(list instanceof Array)) return func.apply(this,arguments);
				if(list.length) {
					var args=[].slice.call(arguments,0);
					args[0]=list[0];
					return func.apply(this,args);
				}
			}
		}

		return function(){
			var list = arguments[0];
			if(list instanceof Array){
				var ret = [];
				var moreArgs = [].slice.call(arguments,0);
				for(var i = 0, len = list.length; i < len; i++){
					moreArgs[0]=list[i];
					var r = func.apply(this, moreArgs);
					if(joinLists) r && (ret = ret.concat(r));
					else ret.push(r); 	
				}
				return ret;
			}else{
				return func.apply(this, arguments);
			}
		}
	},
	/**
	 * 函数包装变换
	 * @method rwrap
	 * @static
	 * @param {func} 
	 * @return {Function}
	 */
	rwrap: function(func,wrapper,idx){
		idx=idx|0;
		return function(){
			var ret = func.apply(this, arguments);
			if(idx>=0) ret=arguments[idx];
			return wrapper ? new wrapper(ret) : ret;
		}
	},
	/**
	 * 绑定
	 * @method bind
	 * @via https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
	 * @compatibile ECMA-262, 5th (JavaScript 1.8.5)
	 * @static
	 * @param {func} 要绑定的函数
	 * @obj {object} this_obj
	 * @optional [, arg1 [, arg2 [...] ] ] 预先确定的参数
	 * @return {Function}
	 */
	bind: function(func, obj/*,[, arg1 [, arg2 [...] ] ]*/){
		var slice = [].slice,
			args = slice.call(arguments, 2),
			nop = function(){},
			bound = function(){
				return func.apply(this instanceof nop?this:(obj||{}),
								args.concat(slice.call(arguments)));
			};

		nop.prototype = func.prototype;

		bound.prototype = new nop();

		return bound;
	}
};


QW.FunctionH=FunctionH;

})();

//document.write('<script type="text/javascript" src="'+srcPath+'core/class.h.js"><\/script>');
/*
	Copyright (c) 2009, Baidu Inc. All rights reserved.
	http://www.youa.com
	version: $version$ $release$ released
	author: wuliang@baidu.com
*/

/**
 * @class ClassH 为function提供强化的原型继承能力
 * @singleton 
 * @namespace QW
 * @helper
 */
(function(){
var mix = QW.ObjectH.mix,
	create = QW.ObjectH.create;

var ClassH = {
	/**
	 * <p>为类型动态创建一个实例，它和直接new的区别在于instanceof的值</p>
	 * <p><strong>第二范式：new T <=> T.apply(T.getPrototypeObject())</strong></p>
	 * @method createInstance
	 * @static
	 * @prarm {function} cls 要构造对象的类型（构造器）
	 * @return {object} 这个类型的一个实例
	 */
	createInstance : function(cls){
		var p = create(cls.prototype);
		cls.apply(p,[].slice.call(arguments,1));
		return p;
	},

	/**
	 * 函数包装器 extend
	 * <p>改进的对象原型继承，延迟执行参数构造，并在子类的实例中添加了$super和$class引用</p>
	 * @method extend
	 * @static
	 * @param {function} cls 产生子类的原始类型
	 * @param {function} p 父类型
	 * @return {function} 返回以自身为构造器继承了p的类型
	 * @throw {Error} 不能对继承返回的类型再使用extend
	 */
	extend : function(cls,p){
		
		var T = function(){};			//构造prototype-chain
		T.prototype = p.prototype;
		
		var cp = cls.prototype;
		
		cls.prototype = new T();
		cls.$super = p; //在构造器内可以通过arguments.callee.$super执行父类构造

		//如果原始类型的prototype上有方法，先copy
		mix(cls.prototype, cp, true);

		return cls;
	}
};

QW.ClassH = ClassH;

})();


//document.write('<script type="text/javascript" src="'+srcPath+'core/helper.h.js"><\/script>');
/*
	Copyright (c) 2009, Baidu Inc. All rights reserved.
	http://www.youa.com
	version: $version$ $release$ released
	author: yingjiakuan@baidu.com
*/

/**
 * Helper管理器，核心模块中用来管理Helper的子模块
 * @module core
 * @beta
 * @submodule core_HelperH
 */

/**
 * @class HelperH
 * <p>一个Helper是指同时满足如下条件的一个对象：</p>
 * <ol><li>Helper是一个不带有可枚举proto属性的简单对象（这意味着你可以用for...in...枚举一个Helper中的所有属性和方法）</li>
 * <li>Helper可以拥有属性和方法，但Helper对方法的定义必须满足如下条件：</li>
 * <div> 1). Helper的方法必须是静态方法，即内部不能使用this。</div>
 * <div> 2). 同一个Helper中的方法的第一个参数必须是相同类型或相同泛型。</div>
 * <li> Helper类型的名字必须以Helper或大写字母H结尾。 </li>
 * <li> 对于只满足第一条的JSON，也算是泛Helper，通常以“U”（util）结尾。 </li>
 * <li> 本来Util和Helper应该是继承关系，但是JavaScript里我们把继承关系简化了。</li>
 * </ol>
 * @singleton
 * @namespace QW
 * @helper
 */

(function(){

var FunctionH = QW.FunctionH,
	create = QW.ObjectH.create,
	Methodized = function(){};

var HelperH = {
	/**
	* 对于需要返回wrap对象的helper方法，进行结果包装
	* @method rwrap
	* @static
	* @param {Helper} helper Helper对象
	* @param {Class} wrapper 将返回值进行包装时的包装器(WrapClass)
	* @param {Object} wrapConfig 需要返回Wrap对象的方法的配置
	* @return {Object} 方法已rwrap化的<strong>新的</strong>Helper
	*/
	rwrap: function(helper, wrapper, wrapConfig){
		var ret = create(helper);
		wrapConfig = wrapConfig || {};

		for(var i in helper){
			var wrapType=wrapConfig, fn = helper[i];
			if (typeof wrapType != 'string') {
				wrapType=wrapConfig[i] || '';
			}
			if('queryer' == wrapType){ //如果方法返回查询结果，对返回值进行包装
				ret[i] = FunctionH.rwrap(fn, wrapper, -1);
			}
			else if('operator' == wrapType){ //如果方法只是执行一个操作
				if(helper instanceof Methodized){ //如果是methodized后的,对this直接返回
					ret[i] = function(fn){
						return function(){
							fn.apply(this, arguments);
							return this;
						}
					}(fn);
				}
				else{ 
					ret[i] = FunctionH.rwrap(fn, wrapper, 0);//否则对第一个参数进行包装
				}
			}
		}
		return ret;
	},
	/**
	* 根据配置，产生gsetter新方法，它根椐参数的长短来决定调用getter还是setter
	* @method gsetter
	* @static
	* @param {Helper} helper Helper对象
	* @param {Object} gsetterConfig 需要返回Wrap对象的方法的配置
	* @return {Object} 方法已gsetter化的<strong>新的</strong>helper
	*/
	gsetter: function(helper,gsetterConfig){
		var ret = create(helper);
		gsetterConfig=gsetterConfig||{};

		for(var i in gsetterConfig){
			if(helper instanceof Methodized){
				ret[i]=function(config){
					return function(){
						return ret[config[Math.min(arguments.length,config.length-1)]].apply(this,arguments);
					}
				}(gsetterConfig[i]);
			}else{
				ret[i]=function(config){
					return function(){
						return ret[config[Math.min(arguments.length,config.length)-1]].apply(null,arguments);
					}
				}(gsetterConfig[i]);
			}
		}
		return ret;
	},
	
	/**
	* 对helper的方法，进行mul化，使其在第一个参数为array时，结果也返回一个数组
	* @method mul
	* @static
	* @param {Helper} helper Helper对象
	* @param {json|string} mulConfig 如果某个方法的mulConfig类型和含义如下：
			getter 或getter_first_all //同时生成get--(返回fist)、getAll--(返回all)
			getter_first	//生成get--(返回first)
			getter_all	//生成get--(返回all)
			queryer		//生成get--(返回concat all结果)
	* @return {Object} 方法已mul化的<strong>新的</strong>Helper
	*/
	mul: function (helper, mulConfig){ 		
		var ret = create(helper);
		mulConfig =mulConfig ||{};

		for(var i in helper){
			if(typeof helper[i] == "function"){
				var mulType=mulConfig;
				if (typeof mulType != 'string') {
					mulType=mulConfig[i] || '';
				}

				if("getter" == mulType ||
				   "getter_first" == mulType || 
				   "getter_first_all" == mulType){ 
					//如果是配置成gettter||getter_first||getter_first_all，那么需要用第一个参数
					ret[i] = FunctionH.mul(helper[i], 1);
				}
				else if("getter_all" == mulType){
					ret[i] = FunctionH.mul(helper[i], 0);
				}else{
					ret[i] = FunctionH.mul(helper[i], 2); //operator、queryer的话需要join返回值，把返回值join起来的说
				}
				if("getter" == mulType ||
				   "getter_first_all" == mulType){ 
					//如果配置成getter||getter_first_all，那么还会生成一个带All后缀的方法
					ret[i+"All"] = FunctionH.mul(helper[i], 0);
				}
			}
		}
		return ret;
	},

	/**
	* 对helper的方法，进行methodize化，使其的第一个参数为this，或this[attr]。
	* <strong>methodize方法会抛弃掉helper上的非function类成员以及命名以下划线开头的成员（私有成员）</strong>
	* @method methodize
	* @static
	* @param {Helper} helper Helper对象，如DateH
	* @param {optional} attr (Optional)属性
	* @return {Object} 方法已methodize化的对象
	*/
	methodize: function(helper, attr){
		var ret = new Methodized(); //因为 methodize 之后gsetter和rwrap的行为不一样  
		
		for(var i in helper){
			if(typeof helper[i] == "function" && !/^_/.test(i)){
				ret[i] = FunctionH.methodize(helper[i], attr); 
			}
		}
		return ret;
	}

};

QW.HelperH = HelperH;
})();

//document.write('<script type="text/javascript" src="'+srcPath+'core/custevent.h.js"><\/script>');
/*
	Copyright (c) 2009, Baidu Inc. All rights reserved.
	http://www.youa.com
	version: $version$ $release$ released
	author: yingjiakuan@baidu.com
*/


(function(){
var mix=QW.ObjectH.mix,
	indexOf=QW.ArrayH.indexOf;

//----------QW.CustEvent----------

/**
* @class CustEvent 自定义事件
* @namespace QW
* @param {object} target 事件所属对象，即：是哪个对象的事件。
* @param {string} type 事件类型。备用。
* @optional {object} eventArgs 自定义事件参数
* @returns {CustEvent} 自定义事件
*/
var CustEvent=QW.CustEvent=function(target,type,eventArgs){
	this.target=target;
	this.type=type;
	mix(this, eventArgs||{});
};

mix(CustEvent.prototype,{
	/**
	* @property {Object} target CustEvent的target
	*/
	target: null,
	/**
	* @property {Object} currentTarget CustEvent的currentTarget，即事件派发者
	*/
	currentTarget: null,
	/**
	* @property {String} type CustEvent的类型
	*/
	type: null,
	/**
	* @property {boolean} returnValue fire方法执行后的遗留产物。(建议规则:对于onbeforexxxx事件，如果returnValue===false，则不执行该事件)。
	*/
	returnValue: undefined,
	/**
	* 设置event的返回值为false。
	* @method preventDefault
	* @returns {void} 无返回值
	*/
	preventDefault: function(){
		this.returnValue=false;
	}
});
	/**
	* 为一个对象添加一系列事件，并添加on/un/fire三个方法，参见：QW.CustEventTarget.createEvents
	* @static
	* @method createEvents
	* @param {Object} obj 事件所属对象，即：是哪个对象的事件。
	* @param {String|Array} types 事件名称。
	* @returns {void} 无返回值
	*/



/**
 * @class CustEventTargetH  自定义事件Target
 * @namespace QW
 */

QW.CustEventTargetH = {
	/**
	* 添加监控
	* @method on 
	* @param {string} sEvent 事件名称。
	* @param {Function} fn 监控函数，在CustEvent fire时，this将会指向oScope，而第一个参数，将会是一个CustEvent对象。
	* @return {boolean} 是否成功添加监控。例如：重复添加监控，会导致返回false.
	* @throw {Error} 如果没有对事件进行初始化，则会抛错
	*/
	on: function(target, sEvent, fn) {
		var cbs = target.__custListeners && target.__custListeners[sEvent]  || QW.error("unknown event type",TypeError);
		if(indexOf(cbs,fn)>-1) return false;
		cbs.push(fn);
		return true;
	},
	/**
	* 取消监控
	* @method un
	* @param {string} sEvent 事件名称。
	* @param {Function} fn 监控函数
	* @return {boolean} 是否有效执行un.
	* @throw {Error} 如果没有对事件进行初始化，则会抛错
	*/
	un: function(target, sEvent, fn){
		var cbs = target.__custListeners && target.__custListeners[sEvent]  || QW.error("unknown event type",TypeError);
		if(fn) {
			var idx=indexOf(cbs,fn);
			if(idx<0) return false;
			cbs.splice(idx,1);
		}
		else cbs.length=0;
		return true;

	},
	/**
	* 事件触发。触发事件时，在监控函数里，this将会指向oScope，而第一个参数，将会是一个CustEvent对象，与Dom3的listener的参数类似。<br/>
	  如果this.target['on'+this.type],则也会执行该方法,与HTMLElement的独占模式的事件(如el.onclick=function(){alert(1)})类似.<br/>
	  如果createEvents的事件类型中包含"*"，则所有事件最终也会落到on("*").
	* @method fire 
	* @param {string | sEvent} sEvent 自定义事件，或事件名称。 如果是事件名称，相当于传new CustEvent(this,sEvent,eventArgs).
	* @optional {object} eventArgs 自定义事件参数
	* @return {boolean} 以下两种情况返回false，其它情况下返回true.
			1. 所有callback(包括独占模式的onxxx)执行完后，custEvent.returnValue===false
			2. 所有callback(包括独占模式的onxxx)执行完后，custEvent.returnValue===undefined，并且独占模式的onxxx()的返回值为false.
	*/
	fire: function(target, sEvent, eventArgs)
	{
		if(sEvent instanceof CustEvent){
			var custEvent = mix(sEvent, eventArgs);
			sEvent = sEvent.type;
		}
		else
			custEvent = new CustEvent(target,sEvent,eventArgs);

		var cbs = target.__custListeners && target.__custListeners[sEvent]  || QW.error("unknown event type",TypeError);
		if(sEvent != "*")
			cbs = cbs.concat(target.__custListeners["*"]||[]) ;

		custEvent.returnValue=undefined; //去掉本句，会导致静态CustEvent的returnValue向后污染
		custEvent.currentTarget=target;
		var obj=custEvent.currentTarget;
		if(obj && obj['on'+custEvent.type]) {
			var retDef=obj['on'+custEvent.type].call(obj,custEvent);//对于独占模式的返回值，会弱影响event.returnValue
		}
		
		for(var i=0;i<cbs.length;i++){
			cbs[i].call(obj,custEvent);
		}
		return (custEvent.returnValue!==false || retDef===false && custEvent.returnValue===undefined);
	},
	createEvents:function(target,types){
		/**
		* 为一个对象添加一系列事件，并添加on/un/fire三个方法<br/>
		* 添加的事件中自动包含一个特殊的事件类型"*"，这个事件类型没有独占模式，所有事件均会落到on("*")事件对应的处理函数中
		* @static
		* @method createEvents
		* @param {Object} obj 事件所属对象，即：是哪个对象的事件。
		* @param {String|Array} types 事件名称。
		* @returns {any} target
		*/
		types = types || [];
		if(typeof types =="string") types=types.split(",");
		var listeners=target.__custListeners;
		if(!listeners) listeners=target.__custListeners={};
		for(var i=0;i<types.length;i++){
			listeners[types[i]]=listeners[types[i]] || [];//可以重复create，而不影响之前的listerners.
		}
		listeners['*']=listeners["*"] || [];
		return target;
	}
}

})();


//document.write('<script type="text/javascript" src="'+srcPath+'core/custevent_retouch.js"><\/script>');
(function(){
var mix=QW.ObjectH.mix;

var CustEventTarget=QW.CustEventTarget=function(){
	this.__custListeners={};
};

var methodized = QW.HelperH.methodize(QW.CustEventTargetH,null, {on:'operator',un:'operator'}); //将Helper方法变成prototype方法，同时修改on/un的返回值
mix(CustEventTarget.prototype, methodized);

QW.CustEvent.createEvents = CustEventTarget.createEvents = function(target,types){
	QW.CustEventTargetH.createEvents(target, types);
	return mix(target,CustEventTarget.prototype);//尊重对象本身的on。
};
})();

//document.write('<script type="text/javascript" src="'+srcPath+'core/core_retouch.js"><\/script>');
(function(){
	var methodize=QW.HelperH.methodize,
		mix=QW.ObjectH.mix;
	/**
	 * @class Object 扩展Object，用ObjectH来修饰Object，特别说明，未对Object.prototype作渲染，以保证Object.prototype的纯洁性
	 * @usehelper QW.ObjectH
	 */
	mix(Object,QW.ObjectH);

	/**
	 * @class Array 扩展Array，用ArrayH/HashsetH来修饰Array
	 * @usehelper QW.ArrayH,QW.HashsetH
	 */
	mix(QW.ArrayH,QW.HashSetH)
	mix(Array, QW.ArrayH);
	mix(Array.prototype, methodize(QW.ArrayH));

	/**
	 * @class Function 扩展Function，用FunctionH/ClassH来修饰Function
	 * @usehelper QW.FunctionH
	 */
	mix(QW.FunctionH,QW.ClassH)
	mix(Function, QW.FunctionH);
	//mix(Function.prototype, methodize(QW.FunctionH));

	/**
	 * @class Date 扩展Date，用DateH来修饰Date
	 * @usehelper QW.DateH
	 */
	mix(Date, QW.DateH);
	mix(Date.prototype, methodize(QW.DateH));


	/**
	 * @class String 扩展String，用StringH来修饰String
	 * @usehelper QW.StringH
	 */
	mix(String, QW.StringH);
	mix(String.prototype, methodize(QW.StringH));
})();

//document.write('<script type="text/javascript" src="'+srcPath+'dom/selector.js"><\/script>');
/*
	Copyright (c) 2009, Baidu Inc. All rights reserved.
	version: $version$ $release$ released
	author: yingjiakuan@baidu.com
*/


/**
 * @class Selector Css Selector相关的几个方法
 * @singleton
 * @namespace QW
 */
(function(){
var trim=QW.StringH.trim,
	encode4Js=QW.StringH.encode4Js;

var Selector={
	/**
	 * @property {int} queryStamp 最后一次查询的时间戳，扩展伪类时可能会用到，以提速
	 */
	queryStamp:0,
	/**
	 * @property {Json} _operators selector属性运算符
	 */
	_operators:{	//以下表达式，aa表示attr值，vv表示比较的值
		'': 'aa',//isTrue|hasValue
		'=': 'aa=="vv"',//equal
		'!=': 'aa!="vv"', //unequal
		'~=': 'aa&&(" "+aa+" ").indexOf(" vv ")>-1',//onePart
		'|=': 'aa&&(aa+"-").indexOf("vv-")==0', //firstPart
		'^=': 'aa&&aa.indexOf("vv")==0', // beginWith
		'$=': 'aa&&aa.lastIndexOf("vv")==aa.length-"vv".length', // endWith
		'*=': 'aa&&aa.indexOf("vv")>-1' //contains
	},
	/**
	 * @property {Json} _shorthands 缩略写法
	 */
    _shorthands: [
		[/\#([\w\-]+)/g,'[id="$1"]'],//id缩略写法
		[/^([\w\-]+)/g, function(a,b){return '[tagName="'+b.toUpperCase()+'"]';}],//tagName缩略写法
		[/\.([\w\-]+)/g, '[className~="$1"]'],//className缩略写法
		[/^\*/g, '[tagName]']//任意tagName缩略写法
	],
	/**
	 * @property {Json} _pseudos 伪类逻辑
	 */
	_pseudos:{
		"first-child":function(a){return a.parentNode.getElementsByTagName("*")[0]==a;},
		"last-child":function(a){return !(a=a.nextSibling) || !a.tagName && !a.nextSibling;},
		"only-child":function(a){return getChildren(a.parentNode).length==1;},
		"nth-child":function(a,nth){return checkNth(a,nth); },
		"nth-last-child":function(a,nth){return checkNth(a,nth,true); },
		"first-of-type":function(a){ var tag=a.tagName; var el=a; while(el=el.previousSlibling){if(el.tagName==tag) return false;} return true;},
		"last-of-type":function(a){ var tag=a.tagName; var el=a; while(el=el.nextSibling){if(el.tagName==tag) return false;} return true; },
		"only-of-type":function(a){var els=a.parentNode.childNodes; for(var i=els.length-1;i>-1;i--){if(els[i].tagName==a.tagName && els[i]!=a) return false;} return true;},
		"nth-of-type":function(a,nth){var idx=1;var el=a;while(el=el.previousSibling) {if(el.tagName==a.tagName) idx++;} return checkNth(idx,nth); },//JK：懒得为这两个伪类作性能优化
		"nth-last-of-type":function(a,nth){var idx=1;var el=a;while(el=el.nextSibling) {if(el.tagName==a.tagName) idx++;} return checkNth(idx,nth); },//JK：懒得为这两个伪类作性能优化
		"empty":function(a){ return !a.firstChild; },
		"parent":function(a){ return !!a.firstChild; },
		"not":function(a,sSelector){ return !s2f(sSelector)(a); },
		"enabled":function(a){ return !a.disabled; },
		"disabled":function(a){ return a.disabled; },
		"checked":function(a){ return a.checked; },
		"contains":function(a,s){return (a.textContent || a.innerText || "").indexOf(s) >= 0;}
	},
	/**
	 * @property {Json} _attrGetters 常用的Element属性
	 */
	_attrGetters:function(){ 
		var o={'class': 'el.className',
			'for': 'el.htmlFor',
			'href':'el.getAttribute("href",2)'};
		var attrs='name,id,className,value,selected,checked,disabled,type,tagName,readOnly,offsetWidth,offsetHeight'.split(',');
		for(var i=0,a;a=attrs[i];i++) o[a]="el."+a;
		return o;
	}(),
	/**
	 * @property {Json} _relations selector关系运算符
	 */
	_relations:{
		//寻祖
		"":function(el,filter,topEl){
			while((el=el.parentNode) && el!=topEl){
				if(filter(el)) return el;
			}
			return null;
		},
		//寻父
		">":function(el,filter,topEl){
			el=el.parentNode;
			return el!=topEl&&filter(el) ? el:null;
		},
		//寻最小的哥哥
		"+":function(el,filter,topEl){
			while(el=el.previousSibling){
				if(el.tagName){
					return filter(el) && el;
				}
			}
			return null;
		},
		//寻所有的哥哥
		"~":function(el,filter,topEl){
			while(el=el.previousSibling){
				if(el.tagName && filter(el)){
					return el;
				}
			}
			return null;
		}
	},
	/** 
	 * 把一个selector字符串转化成一个过滤函数.
	 * @method selector2Filter
	 * @static
	 * @param {string} sSelector 过滤selector，这个selector里没有关系运算符（", >+~"）
	 * @returns {function} : 返回过滤函数。
	 * @example: 
		var fun=selector2Filter("input.aaa");alert(fun);
	 */
	selector2Filter:function(sSelector){
		return s2f(sSelector);
	},
	/** 
	 * 判断一个元素是否符合某selector.
	 * @method test 
	 * @static
	 * @param {HTMLElement} el: 被考察参数
	 * @param {string} sSelector: 过滤selector，这个selector里没有关系运算符（", >+~"）
	 * @returns {function} : 返回过滤函数。
	 */
	test:function(el,sSelector){
		return s2f(sSelector)(el);
	},
	/** 
	 * 用一个css selector来过滤一个数组.
	 * @method filter 
	 * @static
	 * @param {Array|Collection} els: 元素数组
	 * @param {string} sSelector: 过滤selector，这个selector里没有关系运算符（", >+~"）
	 * @param {Element} pEl: 父节点。默认是document.documentElement
	 * @returns {Array} : 返回满足过滤条件的元素组成的数组。
	 */
	filter:function(els,sSelector,pEl){
		var sltors=splitSelector(sSelector);
		return filterByRelation(pEl||document.documentElement,els,sltors);
	},
	/** 
	 * 以refEl为参考，得到符合过滤条件的HTML Elements. refEl可以是element或者是document
	 * @method query
	 * @static
	 * @param {HTMLElement} refEl: 参考对象
	 * @param {string} sSelector: 过滤selector,
	 * @returns {array} : 返回elements数组。
	 * @example: 
		var els=query(document,"li input.aaa");
		for(var i=0;i<els.length;i++ )els[i].style.backgroundColor='red';
	 */
	query:function(refEl,sSelector){
		Selector.queryStamp = queryStamp++;
		refEl=refEl||document.documentElement;
		var els=nativeQuery(refEl,sSelector);
		if(els) return els;//优先使用原生的
		var groups=trim(sSelector).split(",");
		els=querySimple(refEl,groups[0]);
		for(var i=1,gI;gI=groups[i];i++){
			var els2=querySimple(refEl,gI);
			els=els.concat(els2);
			//els=union(els,els2);//除重会太慢，放弃此功能
		}
		return els;
	},
	/** 
	 * 以refEl为参考，得到符合过滤条件的一个元素. refEl可以是element或者是document
	 * @method one
	 * @static
	 * @param {HTMLElement} refEl: 参考对象
	 * @param {string} sSelector: 过滤selector,
	 * @returns {HTMLElement} : 返回element，如果获取不到，则反回null。
	 * @example: 
		var els=query(document,"li input.aaa");
		for(var i=0;i<els.length;i++ )els[i].style.backgroundColor='red';
	 */
	one:function(refEl,sSelector){
		var els=Selector.query(refEl,sSelector);
		return els[0];
	}


};

window.__SltPsds=Selector._pseudos;//JK 2010-11-11：为提高效率
/*
	retTrue 一个返回为true的函数
*/
function retTrue(){
	return true;
}

/*
	arrFilter(arr,callback) : 对arr里的元素进行过滤
*/
function arrFilter(arr,callback){
	var rlt=[],i=0;
	if(callback==retTrue){
		if(arr instanceof Array) return arr.slice(0);
		else{
			for(var len=arr.length;i<len;i++) {
				rlt[i]=arr[i];
			}
		}
	}
	else{
		for(var oI;oI=arr[i++];) {
			callback(oI) && rlt.push(oI);
		}
	}
	return rlt;
};

var elContains,//部分浏览器不支持contains()，例如FF
	getChildren,//部分浏览器不支持children，例如FF3.5-
	hasNativeQuery,//部分浏览器不支持原生querySelectorAll()，例如IE8-
	findId=function(id) {return document.getElementById(id);};

(function(){
	var div=document.createElement('div');
	div.innerHTML='<div class="aaa"></div>';
	hasNativeQuery=(div.querySelectorAll && div.querySelectorAll('.aaa').length==1);
	elContains=div.contains?
		function(pEl,el){ return pEl!=el && pEl.contains(el);}:
		function(pEl,el){ return (pEl.compareDocumentPosition(el) & 16);};
	getChildren=div.children?
		function(pEl){ return pEl.children;}:
		function(pEl){ 
			return arrFilter(pEl.childNodes,function(el){return el.tagName;});
		};
})();


function checkNth(el,nth,reverse){
	if(nth=='n') return true;
	if(typeof el =='number') var idx=el;
	else{
		var pEl=el.parentNode;
		if(pEl.__queryStamp!=queryStamp){
			var els=getChildren(pEl);
			for(var i=0,elI;elI=els[i++];){
				elI.__siblingIdx=i;
			};
			pEl.__queryStamp=queryStamp;
			pEl.__childrenNum=i-1;
		}
		if(reverse) idx=pEl.__childrenNum-el.__siblingIdx+1;
		else idx=el.__siblingIdx;
	}
	switch (nth)
	{
		case 'even':
		case '2n':
			return idx%2==0;
		case 'odd':
		case '2n+1':
			return idx%2==1;
		default:
			if(!(/n/.test(nth))) return idx==nth;
			var arr=nth.replace(/(^|\D+)n/g,"$11n").split("n"),
				k=arr[0]|0,
				kn=idx-arr[1]|0;
			return k*kn>=0 && kn%k==0;
	}
}
/*
 * s2f(sSelector): 由一个selector得到一个过滤函数filter，这个selector里没有关系运算符（", >+~"）
 */
var filterCache={};
function s2f(sSelector,isForArray){
	if(!isForArray && filterCache[sSelector]) return filterCache[sSelector];
	var pseudos=[],//伪类数组,每一个元素都是数组，依次为：伪类名／伪类值
		attrs=[],//属性数组，每一个元素都是数组，依次为：属性名／属性比较符／比较值
		s=trim(sSelector);
	s=s.replace(/\:([\w\-]+)(\(([^)]+)\))?/g,function(a,b,c,d,e){pseudos.push([b,d]);return "";});//伪类
	for(var i=0,shorthands=Selector._shorthands,sh;sh=shorthands[i];i++)
		s=s.replace(sh[0],sh[1]);
	//var reg=/\[\s*([\w\-]+)\s*([!~|^$*]?\=)?\s*(?:(["']?)([^\]'"]*)\3)?\s*\]/g; //属性选择表达式解析
	var reg=/\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/g; //属性选择表达式解析,thanks JQuery
	s=s.replace(reg,function(a,b,c,d,e){attrs.push([b,c||"",e||""]);return "";});//普通写法[foo][foo=""][foo~=""]等
	if(!(/^\s*$/).test(s)) {
		throw "Unsupported Selector:\n"+sSelector+"\n-"+s; 
	}

	var sFun=[];
	for(var i=0,attr;attr=attrs[i];i++){//属性过滤
		var attrGetter=Selector._attrGetters[attr[0]] || 'el.getAttribute("'+attr[0]+'")';
		sFun.push(Selector._operators[attr[1]].replace(/aa/g,attrGetter).replace(/vv/g,attr[2]));
	}
	for(var i=0,pI;pI=pseudos[i];i++) {//伪类过滤
		if(!Selector._pseudos[pI[0]]) throw "Unsupported Selector:\n"+pI[0]+"\n"+s;
		if(/^(nth-|not|contains)/.test(pI[0])){
			sFun.push('__SltPsds["'+pI[0]+'"](el,"'+encode4Js(pI[1])+'")');
		}
		else{
			sFun.push('__SltPsds["'+pI[0]+'"](el)');
		}
	}
	if (sFun.length)
	{
		if(isForArray){
			return new Function('els','var els2=[];for(var i=0,el;el=els[i++];){if('+sFun.join('&&')+') els2.push(el);} return els2;');
		}
		else{
			return filterCache[sSelector]=new Function('el','return '+sFun.join('&&')+';');
		}
	}
	else {
		if(isForArray){
			return function(els){return arrFilter(els,retTrue);}
		}
		else{
			return filterCache[sSelector]=retTrue;
		}
		
	}
};

/* 
	* {int} xxxStamp: 全局变量查询标记
 */
var queryStamp=0,
	relationStamp=0,
	querySimpleStamp=0;

/*
* nativeQuery(refEl,sSelector): 如果有原生的querySelectorAll，并且只是简单查询，则调用原生的query，否则返回null. 
* @param {Element} refEl 参考元素
* @param {string} sSelector selector字符串
* @returns 
*/
function nativeQuery(refEl,sSelector){
		if(hasNativeQuery && /^((^|,)\s*[.\w-][.\w\s\->+~]*)+$/.test(sSelector)) {
			//如果浏览器自带有querySelectorAll，并且本次query的是简单selector，则直接调用selector以加速
			//部分浏览器不支持以">~+"开始的关系运算符
			var arr=[],els=refEl.querySelectorAll(sSelector);
			for(var i=0,elI;elI=els[i++];) arr.push(elI);
			return arr;
		}
		return null;
};

/* 
* querySimple(pEl,sSelector): 得到pEl下的符合过滤条件的HTML Elements. 
* sSelector里没有","运算符
* pEl是默认是document.body 
* @see: query。
*/
function querySimple(pEl,sSelector){
	querySimpleStamp++;
	/*
		为了提高查询速度，有以下优先原则：
		最优先：原生查询
		次优先：在' '、'>'关系符出现前，优先正向（从祖到孙）查询
		次优先：id查询
		次优先：只有一个关系符，则直接查询
		最原始策略，采用关系判断，即：从最底层向最上层连线，能连得成功，则满足条件
	*/

	//最优先：原生查询
	var els=nativeQuery(pEl,sSelector);
	if(els) return els;//优先使用原生的


	var sltors=splitSelector(sSelector),
		pEls=[pEl],
		i,
		elI,
		pElI;

	var sltor0;
	//次优先：在' '、'>'关系符出现前，优先正向（从上到下）查询
	while(sltor0=sltors[0]){
		if(!pEls.length) return [];
		var relation=sltor0[0];
		els=[];
		if(relation=='+'){//第一个弟弟
			filter=s2f(sltor0[1]);
			for(i=0;elI=pEls[i++];){
				while(elI=elI.nextSibling){
					if(elI.tagName){
						if(filter(elI)) els.push(elI);
						break;
					}
				}
			}
			pEls=els;
			sltors.splice(0,1);
		}
		else if(relation=='~'){//所有的弟弟
			filter=s2f(sltor0[1]);
			for(i=0;elI=pEls[i++];){
				if(i>1 && elI.parentNode==pEls[i-2].parentNode) continue;//除重：如果已经query过兄长，则不必query弟弟
				while(elI=elI.nextSibling){
					if(elI.tagName){
						if(filter(elI)) els.push(elI);
					}
				}
			}
			pEls=els;
			sltors.splice(0,1);
		}
		else{
			break;
		}
	}
	var sltorsLen=sltors.length;
	if(!sltorsLen || !pEls.length) return pEls;
	
	//次优先：idIdx查询
	for(var idIdx=0,id;sltor=sltors[idIdx];idIdx++){
		if((/^[.\w-]*#([\w-]+)/i).test(sltor[1])){
			id=RegExp.$1;
			sltor[1]=sltor[1].replace('#'+id,'');
			break;
		}
	}
	if(idIdx<sltorsLen){//存在id
		var idEl=findId(id);
		if(!idEl) return [];
		for(i=0,pElI;pElI=pEls[i++];){
			if(elContains(pElI,idEl)) {
				els=filterByRelation(pEl,[idEl],sltors.slice(0,idIdx+1));
				if(!els.length || idIdx==sltorsLen-1) return els;
				return querySimple(idEl,sltors.slice(idIdx+1).join(',').replace(/,/g,' '));
			}
		}
		return [];
	}

	//---------------
	var getChildrenFun=function(pEl){return pEl.getElementsByTagName(tagName);},
		tagName='*',
		className='';
	sSelector=sltors[sltorsLen-1][1];
	sSelector=sSelector.replace(/^[\w\-]+/,function(a){tagName=a;return ""});
	if(hasNativeQuery){
		sSelector=sSelector.replace(/^[\w\*]*\.([\w\-]+)/,function(a,b){className=b;return ""});
	}
	if(className){
		getChildrenFun=function(pEl){return pEl.querySelectorAll(tagName+'.'+className);};
	}

	//次优先：只剩一个'>'或' '关系符(结合前面的代码，这时不可能出现还只剩'+'或'~'关系符)
	if(sltorsLen==1){
		if(sltors[0][0]=='>') {
			getChildrenFun=getChildren;
			var filter=s2f(sltors[0][1],true);
		}
		else{
			filter=s2f(sSelector,true);
		}
		els=[];
		for(i=0;pElI=pEls[i++];){
			els=els.concat(filter(getChildrenFun(pElI)));
		}
		return els;
	}


	//走第一个关系符是'>'或' '的万能方案
	sltors[sltors.length-1][1] = sSelector;
	els=[];
	for(i=0;pElI=pEls[i++];){
		els=els.concat(filterByRelation(pElI,getChildrenFun(pElI),sltors));
	}
	return els;
};


function splitSelector(sSelector){
	var sltors=[];
	var reg=/(^|\s*[>+~ ]\s*)(([\w\-\:.#*]+|\([^\)]*\)|\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\6|)\s*\])+)(?=($|\s*[>+~ ]\s*))/g;
	var s=trim(sSelector).replace(reg,function(a,b,c,d){sltors.push([trim(b),c]);return "";});
	if(!(/^\s*$/).test(s)) {
		throw "Unsupported Selector:\n"+sSelector+"\n--"+s; 
	}
	return sltors;
}

/*
判断一个长辈与子孙节点是否满足关系要求。----特别说明：这里的第一个关系只能是父子关系，或祖孙关系;
*/

function filterByRelation(pEl,els,sltors){
	relationStamp++;
	var sltor=sltors[0],
		len=sltors.length,
		needNotTopJudge=!sltor[0],
		filters=[],
		relations=[],
		needNext=[],
		relationsStr='';
		
	for(var i=0;i<len;i++){
		sltor=sltors[i];
		filters[i]=s2f(sltor[1],i==len-1);//过滤
		relations[i]=Selector._relations[sltor[0]];//寻亲函数
		if(sltor[0]=='' || sltor[0]=='~') needNext[i]=true;//是否递归寻亲
		relationsStr+=sltor[0]||' ';
	}
	els=filters[len-1](els);//自身过滤
	if(relationsStr==' ') return els;
	if(/[+>~] |[+]~/.test(relationsStr)){//需要回溯
		//alert('JK'); //用到这个分支的可能性很小。放弃效率的追求。
		function chkRelation(el){//关系人过滤
			var parties=[],//中间关系人
				j=len-1,
				party=parties[j]=el;
			for(;j>-1;j--){
				if(j>0){//非最后一步的情况
					party=relations[j](party,filters[j-1],pEl);
				}
				else if(needNotTopJudge || party.parentNode==pEl){//最后一步通过判断
					return true;
				}
				else {//最后一步未通过判断
					party=null;
				}
				while(!party){//回溯
					if(++j==len) { //cache不通过
						return false;
					}
					if(needNext[j]) {
						party=parties[j-1];
						j++;
					}
				}
				parties[j-1]=party;
			}
		};
		return arrFilter(els,chkRelation);
	}
	else{//不需回溯
		var els2=[];
		for(var i=0,el,elI; el=elI=els[i++] ; ) {
			for(var j=len-1;j>0;j--){
				if(!(el=relations[j](el,filters[j-1],pEl))) {
					break;
				}
			}
			if(el && (needNotTopJudge || el.parentNode==pEl)) els2.push(elI);
		}
		return els2;
	}

}

QW.Selector=Selector;
})();

//document.write('<script type="text/javascript" src="'+srcPath+'dom/dom.u.js"><\/script>');
/** 
* Dom Utils，是Dom模块核心类
* @class DomU 
* @singleton
* @namespace QW
*/
QW.DomU = function () {
	var Selector=QW.Selector;
	var Browser = QW.Browser;
	var DomU = {

		/** 
		* 按cssselector获取元素集 
		* @method	query
		* @param {String} sSelector cssselector字符串
		* @param {Element} refEl (Optional) 参考元素，默认为document.documentElement
		* @return {Array}
		*/
		query: function (sSelector,refEl) {
			return Selector.query(refEl || document.documentElement,sSelector);
		},
		/** 
		* 获取doc的一些坐标信息 
		* 参考与YUI3.1.1
		* @refer  https://github.com/yui/yui3/blob/master/build/dom/dom.js
		* @method	getDocRect
		* @param	{object} doc (Optional) document对象/默认为当前宿主的document
		* @return	{object} 包含doc的scrollX,scrollY,width,height,scrollHeight,scrollWidth值的json
		*/
		getDocRect : function (doc) {
			doc = doc || document;

			var win = doc.defaultView || doc.parentWindow,
				mode = doc.compatMode,
				root = doc.documentElement,
				h = win.innerHeight || 0,
				w = win.innerWidth || 0,
				scrollX = win.pageXOffset || 0,
				scrollY = win.pageYOffset || 0,
				scrollW = root.scrollWidth,
				scrollH = root.scrollHeight;

			if (mode != 'CSS1Compat') { // Quirks
				root = doc.body;
				scrollW = root.scrollWidth;
				scrollH = root.scrollHeight;
			}

			if (mode && !Browser.opera) { // IE, Gecko
				w = root.clientWidth;
				h = root.clientHeight;
			}

			scrollW = Math.max(scrollW, w);
			scrollH = Math.max(scrollH, h);

			scrollX = Math.max(scrollX, doc.documentElement.scrollLeft, doc.body.scrollLeft);
			scrollY = Math.max(scrollY, doc.documentElement.scrollTop, doc.body.scrollTop);

			return {
				width : w,
				height : h,
				scrollWidth : scrollW,
				scrollHeight : scrollH,
				scrollX : scrollX,
				scrollY : scrollY
			};
		},

		/** 
		* 通过html字符串创建Dom对象 
		* @method	create
		* @param	{string}	html html字符串
		* @param	{boolean}	rfrag (Optional) 是否返回documentFragment对象
		* @param	{object}	doc	(Optional)	document 默认为 当前document
		* @return	{element}	返回html字符的element对象或documentFragment对象
		*/
		create : function () {
			var temp = document.createElement('div');

			return function (html, rfrag, doc) {
				var dtemp = doc && doc.createElement('div') || temp;
				dtemp.innerHTML = html;
				var el = dtemp.firstChild;
				
				if (!el || !rfrag) {
					return el;
				} else {
					doc = doc || document;
					var frag = doc.createDocumentFragment();
					while (el = dtemp.firstChild) frag.appendChild(el);
					return frag;
				}
			};
		}(),

		/** 
		* 把NodeCollection转为ElementCollection
		* @method	pluckWhiteNode
		* @param	{NodeCollection|array} list Node的集合
		* @return	{array}						Element的集合
		*/
		pluckWhiteNode : function (list) {
			var result = [], i = 0, l = list.length;
			for (; i < l ; i ++)
				if (DomU.isElement(list[i])) result.push(list[i]);
			return result;
		},

		/** 
		* 判断Node实例是否继承了Element接口
		* @method	isElement
		* @param	{object} element Node的实例
		* @return	{boolean}		 判断结果
		*/
		isElement : function (el) {
			return !!(el && el.nodeType == 1);
		},

		/** 
		* 监听Dom树结构初始化完毕事件
		* @method	ready
		* @param	{function} handler 事件处理程序
		* @param	{object}	doc	(Optional)	document 默认为 当前document
		* @return	{void}
		*/
		ready : function (handler, doc) {
			doc = doc || document;

			if (/complete/.test(doc.readyState)) {
				handler();
			} else {				
				if (doc.addEventListener) {
					if ('interactive' == doc.readyState) {
						handler();
					} else {
						doc.addEventListener("DOMContentLoaded", handler, false);
					}
				} else {
					var fireDOMReadyEvent = function () {
						fireDOMReadyEvent = new Function;
						handler();
					};
					void function () {
						try {
							doc.body.doScroll('left');
						} catch (exp) {
							return setTimeout(arguments.callee, 1);
						}
						fireDOMReadyEvent();
					}();
					doc.attachEvent('onreadystatechange', function () {
						('complete' == doc.readyState) && fireDOMReadyEvent();
					});
				}
			}
		},
	

		/** 
		* 判断一个矩形是否包含另一个矩形
		* @method	rectContains
		* @param	{object} rect1	矩形
		* @param	{object} rect2	矩形
		* @return	{boolean}		比较结果
		*/
		rectContains : function (rect1, rect2) {
			return rect1.left	 <= rect2.left
				&& rect1.right   >= rect2.right
				&& rect1.top     <= rect2.top
				&& rect1.bottom  >= rect2.bottom;
		},

		/** 
		* 判断一个矩形是否和另一个矩形有交集
		* @method	rectIntersect
		* @param	{object} rect1	矩形
		* @param	{object} rect2	矩形
		* @return	{rect}			交集矩形或null
		*/
		rectIntersect : function (rect1, rect2) {
			//修正变量名
			var t = Math.max( rect1.top,	  rect2.top    )
				, r = Math.min( rect1.right,  rect2.right  )
				, b = Math.min( rect1.bottom, rect2.bottom )
				, l = Math.max( rect1.left,   rect2.left   );
			
			if (b >= t && r >= l) {
				return { top : t, right : r, bottom: b, left : l };
			} else {
				return null;
			}
		},

		/** 
		* 创建一个element
		* @method	createElement
		* @param	{string}	tagName		元素类型
		* @param	{json}		property	属性
		* @param	{document}	doc	(Optional)		document
		* @return	{element}	创建的元素
		*/
		createElement : function (tagName, property, doc) {
			doc = doc || document;
			var el = doc.createElement(tagName);
			
			if (property) {
				for (var i in property) el[i] = property[i];
			}
			return el;
		}

	};
	
	return DomU;
}();

//document.write('<script type="text/javascript" src="'+srcPath+'dom/node.h.js"><\/script>');
/** 
* @class NodeH Node Helper，针对element兼容处理和功能扩展
* @singleton
* @namespace QW
*/
QW.NodeH = function () {

	var ObjectH = QW.ObjectH;
	var StringH = QW.StringH;
	var DomU = QW.DomU;
	var Browser = QW.Browser;
	var Selector = QW.Selector;

	/** 
	* 获得element对象
	* @method	g
	* @param	{element|string|wrap}	el	id,Element实例或wrap
	* @param	{object}				doc		(Optional)document 默认为 当前document
	* @return	{element}				得到的对象或null
	*/
	var g = function (el, doc) {
		if ('string' == typeof el) {
			if(el.indexOf('<')==0) return DomU.create(el,false,doc);
			return (doc||document).getElementById(el);
		} else {
			return (ObjectH.isWrap(el)) ? arguments.callee(el.core) : el;
		}
	};

	var regEscape = function (str) {
		return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
	};

	var getPixel = function (el, value) {
		if (/px$/.test(value) || !value) return parseInt(value, 10) || 0;
		var right = el.style.right, runtimeRight = el.runtimeStyle.right;
		var result;

		el.runtimeStyle.right = el.currentStyle.right;
		el.style.right = value;
		result = el.style.pixelRight || 0;

		el.style.right = right;
		el.runtimeStyle.right = runtimeRight;
		return result;
	};

	var NodeH = {
		
		/** 
		* 获得element对象的outerHTML属性
		* @method	outerHTML
		* @param	{element|string|wrap}	el	id,Element实例或wrap
		* @param	{object}				doc		(Optional)document 默认为 当前document
		* @return	{string}				outerHTML属性值
		*/
		outerHTML : function () {
			var temp = document.createElement('div');
			
			return function (el, doc) {
				el = g(el);
				if ('outerHTML' in el) {
					return el.outerHTML;
				} else {
					temp.innerHTML='';
					var dtemp = doc && doc.createElement('div') || temp;
					dtemp.appendChild(el.cloneNode(true));
					return dtemp.innerHTML;
				}
			};
		}(),

		/** 
		* 判断element是否包含某个className
		* @method	hasClass
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				className	样式名
		* @return	{void}
		*/
		hasClass : function (el, className) {
			el = g(el);
			return new RegExp('(?:^|\\s)' + regEscape(className) + '(?:\\s|$)').test(el.className);
		},

		/** 
		* 给element添加className
		* @method	addClass
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				className	样式名
		* @return	{void}
		*/
		addClass : function (el, className) {
			el = g(el);
			if (!NodeH.hasClass(el, className))
				el.className = el.className ? el.className + ' ' + className : className;
		},

		/** 
		* 移除element某个className
		* @method	removeClass
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				className	样式名
		* @return	{void}
		*/
		removeClass : function (el, className) {
			el = g(el);
			if (NodeH.hasClass(el, className))
				el.className = el.className.replace(new RegExp('(?:^|\\s)' + regEscape(className) + '(?=\\s|$)', 'ig'), '');
		},

		/** 
		* 替换element的className
		* @method	replaceClass
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				oldClassName	目标样式名
		* @param	{string}				newClassName	新样式名
		* @return	{void}
		*/
		replaceClass : function (el, oldClassName, newClassName) {
			el = g(el);
			if (NodeH.hasClass(el, oldClassName)) {
				el.className = el.className.replace(new RegExp('(^|\\s)' + regEscape(oldClassName) + '(?=\\s|$)', 'ig'), '$1' + newClassName);
			} else {
				NodeH.addClass(el, newClassName);
			}
		},

		/** 
		* element的className1和className2切换
		* @method	toggleClass
		* @param	{element|string|wrap}	el			id,Element实例或wrap
		* @param	{string}				className1		样式名1
		* @param	{string}				className2		(Optional)样式名2
		* @return	{void}
		*/
		toggleClass : function (el, className1, className2) {
			className2 = className2 || '';
			if (NodeH.hasClass(el, className1)) {
				NodeH.replaceClass(el, className1, className2);
			} else {
				NodeH.replaceClass(el, className2, className1);
			}
		},

		/** 
		* 显示element对象
		* @method	show
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				value		(Optional)display的值 默认为空
		* @return	{void}
		*/
		show : function (el, value) {
			el = g(el);
			el.style.display = value || '';
		},

		/** 
		* 隐藏element对象
		* @method	hide
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @return	{void}
		*/
		hide : function (el) {
			el = g(el);
			el.style.display = 'none';
		},

		/** 
		* 隐藏/显示element对象
		* @method	toggle
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				value		(Optional)显示时display的值 默认为空
		* @return	{void}
		*/
		toggle : function (el, value) {
			if (NodeH.isVisible(el)) {
				NodeH.hide(el);
			} else {
				NodeH.show(el, value);
			}
		},

		/** 
		* 判断element对象是否可见
		* @method	isVisible
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @return	{boolean}				判断结果
		*/
		isVisible : function (el) {
			el = g(el);
			//return this.getStyle(el, 'visibility') != 'hidden' && this.getStyle(el, 'display') != 'none';
			//return !!(el.offsetHeight || el.offestWidth);
			return !!((el.offsetHeight + el.offsetWidth) && NodeH.getStyle(el, 'display') != 'none');
		},


		/** 
		* 获取element对象距离doc的xy坐标
		* 参考与YUI3.1.1
		* @refer  https://github.com/yui/yui3/blob/master/build/dom/dom.js
		* @method	getXY
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @return	{array}					x, y
		*/
		getXY : function () {

			var calcBorders = function (node, xy) {
				var t = parseInt(NodeH.getCurrentStyle(node, 'borderTopWidth'), 10) || 0,
					l = parseInt(NodeH.getCurrentStyle(node, 'borderLeftWidth'), 10) || 0;

				if (Browser.gecko) {
					if (/^t(?:able|d|h)$/i.test(node.tagName)) {
						t = l = 0;
					}
				}
				xy[0] += l;
				xy[1] += t;
				return xy;
			};

			return document.documentElement.getBoundingClientRect ? function (node) {
				var doc = node.ownerDocument,
					docRect = DomU.getDocRect(doc),
					scrollLeft = docRect.scrollX,
					scrollTop = docRect.scrollY,
					box = node.getBoundingClientRect(),
					xy = [box.left, box.top],
					off1, off2,
					mode,
					bLeft, bTop;


				if (Browser.ie) {
					off1 = 2;
					off2 = 2;
					mode = doc.compatMode;
					bLeft = NodeH.getCurrentStyle(doc.documentElement, 'borderTopWidth');
					bTop = NodeH.getCurrentStyle(doc.documentElement, 'borderLeftWidth');
					
					if (mode == 'BackCompat') {
						if (bLeft !== 'medium') {
							off1 = parseInt(bLeft, 10);
						}
						if (bTop !== 'medium') {
							off2 = parseInt(bTop, 10);
						}
					} else if (Browser.ie6) {
						off1 = 0;
						off2 = 0;
					}
					
					xy[0] -= off1;
					xy[1] -= off2;

				}

				if (scrollTop || scrollLeft) {
					xy[0] += scrollLeft;
					xy[1] += scrollTop;
				}

				return xy;

			} : function (node, doc) {
				doc = doc || document;

				var xy = [node.offsetLeft, node.offsetTop],
					parentNode = node.parentNode,
					doc = node.ownerDocument,
					docRect = DomU.getDocRect(doc),
					bCheck = !!(Browser.gecko || parseFloat(Browser.webkit) > 519),
					scrollTop = 0,
					scrollLeft = 0;
				
				while ((parentNode = parentNode.offsetParent)) {
					xy[0] += parentNode.offsetLeft;
					xy[1] += parentNode.offsetTop;
					if (bCheck) {
						xy = calcBorders(parentNode, xy);
					}
				}

				if (NodeH.getCurrentStyle(node, 'position') != 'fixed') {
					parentNode = node;

					while ((parentNode = parentNode.parentNode)) {
						scrollTop = parentNode.scrollTop;
						scrollLeft = parentNode.scrollLeft;


						if (Browser.gecko && (NodeH.getCurrentStyle(parentNode, 'overflow') !== 'visible')) {
							xy = calcBorders(parentNode, xy);
						}
						
						if (scrollTop || scrollLeft) {
							xy[0] -= scrollLeft;
							xy[1] -= scrollTop;
						}
					}
					
				}

				xy[0] += docRect.scrollX;
				xy[1] += docRect.scrollY;

				return xy;

			};

		}(),

		/** 
		* 设置element对象的xy坐标
		* @method	setXY
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{int}					x			(Optional)x坐标 默认不设置
		* @param	{int}					y			(Optional)y坐标 默认不设置
		* @return	{void}
		*/
		setXY : function (el, x, y) {
			el = g(el);
			x = parseInt(x, 10);
			y = parseInt(y, 10);
			if ( !isNaN(x) ) NodeH.setStyle(el, 'left', x + 'px');
			if ( !isNaN(y) ) NodeH.setStyle(el, 'top', y + 'px');
		},

		/** 
		* 设置element对象的offset宽高
		* @method	setSize
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{int}					w			(Optional)宽 默认不设置
		* @param	{int}					h			(Optional)高 默认不设置
		* @return	{void}
		*/
		setSize : function (el, w, h) {
			el = g(el);
			w = parseFloat (w, 10);
			h = parseFloat (h, 10);

			if (isNaN(w) && isNaN(h)) return;

			var borders = NodeH.borderWidth(el);
			var paddings = NodeH.paddingWidth(el);

			if ( !isNaN(w) ) NodeH.setStyle(el, 'width', Math.max(+w - borders[1] - borders[3] - paddings[1] - paddings[3], 0) + 'px');
			if ( !isNaN(h) ) NodeH.setStyle(el, 'height', Math.max(+h - borders[0] - borders[2] - paddings[1] - paddings[2], 0) + 'px');
		},

		/** 
		* 设置element对象的宽高
		* @method	setInnerSize
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{int}					w			(Optional)宽 默认不设置
		* @param	{int}					h			(Optional)高 默认不设置
		* @return	{void}
		*/
		setInnerSize : function (el, w, h) {
			el = g(el);
			w = parseFloat (w, 10);
			h = parseFloat (h, 10);

			if ( !isNaN(w) ) NodeH.setStyle(el, 'width', w + 'px');
			if ( !isNaN(h) ) NodeH.setStyle(el, 'height', h + 'px');
		},

		/** 
		* 设置element对象的offset宽高和xy坐标
		* @method	setRect
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{int}					x			(Optional)x坐标 默认不设置
		* @param	{int}					y			(Optional)y坐标 默认不设置
		* @param	{int}					w			(Optional)宽 默认不设置
		* @param	{int}					h			(Optional)高 默认不设置
		* @return	{void}
		*/
		setRect : function (el, x, y, w, h) {
			NodeH.setXY(el, x, y);
			NodeH.setSize(el, w, h);
		},

		/** 
		* 设置element对象的宽高和xy坐标
		* @method	setRect
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{int}					x			(Optional)x坐标 默认不设置
		* @param	{int}					y			(Optional)y坐标 默认不设置
		* @param	{int}					w			(Optional)宽 默认不设置
		* @param	{int}					h			(Optional)高 默认不设置
		* @return	{void}
		*/
		setInnerRect : function (el, x, y, w, h) {
			NodeH.setXY(el, x, y);
			NodeH.setInnerSize(el, w, h);
		},

		/** 
		* 获取element对象的宽高
		* @method	getSize
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @return	{object}				width,height
		*/
		getSize : function (el) {
			el = g(el);
			return { width : el.offsetWidth, height : el.offsetHeight };
		},

		/** 
		* 获取element对象的宽高和xy坐标
		* @method	setRect
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @return	{object}				width,height,left,top,bottom,right
		*/
		getRect : function (el) {
			el = g(el);
			var p = NodeH.getXY(el);
			var x = p[0];
			var y = p[1];
			var w = el.offsetWidth; 
			var h = el.offsetHeight;
			return {
				'width'  : w,    'height' : h,
				'left'   : x,    'top'    : y,
				'bottom' : y+h,  'right'  : x+w
			};
		},

		/** 
		* 向后获取element对象复合条件的兄弟节点
		* @method	nextSibling
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				selector	(Optional)简单选择器 默认为空即最近的兄弟节点
		* @return	{node}					找到的node或null
		*/
		nextSibling : function (el, selector) {
			var fcheck = Selector.selector2Filter(selector || '');
			el = g(el);
			do {
				el = el.nextSibling;
			} while (el && !fcheck(el));
			return el;
		},

		/** 
		* 向前获取element对象复合条件的兄弟节点
		* @method	previousSibling
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				selector	(Optional)简单选择器 默认为空即最近的兄弟节点
		* @return	{node}					找到的node或null
		*/
		previousSibling : function (el, selector) {
			var fcheck = Selector.selector2Filter(selector || '');
			el = g(el);
			do {
				el = el.previousSibling;
			} while (el && !fcheck(el)); 
			return el;
		},

		/** 
		* 向上获取element对象复合条件的兄弟节点
		* @method	previousSibling
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				selector	(Optional)简单选择器 默认为空即最近的兄弟节点
		* @return	{element}					找到的node或null
		*/
		ancestorNode : function (el, selector) {
			var fcheck = Selector.selector2Filter(selector || '');
			el = g(el);
			do {
				el = el.parentNode;
			} while (el && !fcheck(el));
			return el;
		},

		/** 
		* 向上获取element对象复合条件的兄弟节点
		* @method	parentNode
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				selector	(Optional)简单选择器 默认为空即最近的兄弟节点
		* @return	{element}					找到的node或null
		*/
		parentNode : function (el, selector) {
			return NodeH.ancestorNode(el, selector);
		},

		/** 
		* 从element对象内起始位置获取复合条件的节点
		* @method	firstChild
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				selector	(Optional)简单选择器 默认为空即最近的兄弟节点
		* @return	{node}					找到的node或null
		*/
		firstChild : function (el, selector) {
			var fcheck = Selector.selector2Filter(selector || '');
			el = g(el).firstChild;
			while (el && !fcheck(el)) el = el.nextSibling;
			return el;
		},

		/** 
		* 从element对象内结束位置获取复合条件的节点
		* @method	lastChild
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				selector	(Optional)简单选择器 默认为空即最近的兄弟节点
		* @return	{node}					找到的node或null
		*/
		lastChild : function (el, selector) {
			var fcheck = Selector.selector2Filter(selector || '');
			el = g(el).lastChild;
			while (el && !fcheck(el)) el = el.previousSibling;
			return el;
		},

		/** 
		* 判断目标对象是否是element对象的子孙节点
		* @method	contains
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{element|string|wrap}	target		Element对象
		* @return	{boolean}				判断结果
		*/
		contains : function (el, target) {
			el = g(el), target = g(target);
			return el.contains
				? el != target && el.contains(target)
				: !!(el.compareDocumentPosition(target) & 16);
		},

		/** 
		* 向element对象前/后，内起始，内结尾插入html
		* @method	insertAdjacentHTML
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				sWhere		位置类型，可能值有：beforebegin、afterbegin、beforeend、afterend
		* @param	{element|string|wrap}	html		插入的html
		* @return	{void}
		*/
		insertAdjacentHTML : function (el, sWhere, html) {
			el = g(el);
			if (el.insertAdjacentHTML) {
				el.insertAdjacentHTML(sWhere, html);
			} else {
				var df;
				var r = el.ownerDocument.createRange();
				switch (String(sWhere).toLowerCase()) {
					case "beforebegin":
						r.setStartBefore(el);
						df = r.createContextualFragment(html);
						break;
					case "afterbegin":
						r.selectNodeContents(el);
						r.collapse(true);
						df = r.createContextualFragment(html);
						break;
					case "beforeend":
						r.selectNodeContents(el);
						r.collapse(false);
						df = r.createContextualFragment(html);
						break;
					case "afterend":
						r.setStartAfter(el);
						df = r.createContextualFragment(html);
						break;
				}
				NodeH.insertAdjacentElement(el, sWhere, df);
			}
		},

		/** 
		* 向element对象前/后，内起始，内结尾插入element对象
		* @method	insertAdjacentElement
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				sWhere		位置类型，可能值有：beforebegin、afterbegin、beforeend、afterend
		* @param	{element|string|html|wrap}	newEl		新对象。
		* @return	{element}				newEl，新对象
		*/
		insertAdjacentElement : function (el, sWhere, newEl) {
			el = g(el), newEl = g(newEl);
			if (el.insertAdjacentElement) {
				el.insertAdjacentElement(sWhere, newEl);
			} else {
				switch (String(sWhere).toLowerCase()) {
					case "beforebegin":
						el.parentNode.insertBefore(newEl, el);
						break;
					case "afterbegin":
						el.insertBefore(newEl, el.firstChild);
						break;
					case "beforeend":
						el.appendChild(newEl);
						break;
					case "afterend":
						el.parentNode.insertBefore(newEl, el.nextSibling || null);
						break;
				}
			}
			return newEl;
		},

		/** 
		* 向element对象前/后，内起始，内结尾插入element对象
		* @method	insert
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				sWhere		位置类型，可能值有：beforebegin、afterbegin、beforeend、afterend
		* @param	{element|string|wrap}	newEl		新对象
		* @return	{void}	
		*/
		insert : function (el, sWhere, newEl) {
			NodeH.insertAdjacentElement(el,sWhere,newEl);
		},

		/** 
		* 把一个对象插到另一个对象邻近。
		* @method	insertTo
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				sWhere		位置类型，可能值有：beforebegin、afterbegin、beforeend、afterend
		* @param	{element|string|wrap}	refEl		位置参考对象
		* @return	{void}				
		*/
		insertTo : function (el, sWhere, refEl) {
			NodeH.insertAdjacentElement(refEl,sWhere,el);
		},

		/** 
		* 向element对象内追加element对象
		* @method	appendChild
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{element|string|wrap}	newEl		新对象
		* @return	{element}				新对象newEl
		*/
		appendChild : function (el, newEl) {
			return g(el).appendChild(g(newEl));
		},

		/** 
		* 向element对象前插入element对象
		* @method	insertSiblingBefore
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{element|string|html|wrap}	newEl	新对象
		* @return	{element}				新对象newEl
		*/
		insertSiblingBefore : function (el, newEl) {
			el = g(el);
			return el.parentNode.insertBefore(g(newEl), el);
		},

		/** 
		* 向element对象后插入element对象
		* @method	insertSiblingAfter
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{element|string|wrap}	newEl	新对象id,Element实例或wrap
		* @return	{element}				新对象newEl
		*/
		insertSiblingAfter : function (el, newEl) {
			el = g(el);
			el.parentNode.insertBefore(g(newEl), el.nextSibling || null);
		},

		/** 
		* 向element对象内部的某元素前插入element对象
		* @method	insertBefore
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{element|string|wrap}	newEl	新对象id,Element实例或wrap
		* @param	{element|string|wrap}	refEl	位置参考对象
		* @return	{element}				新对象newEl
		*/
		insertBefore : function (el, newEl, refEl) {
			return g(el).insertBefore(g(newEl), refEl && g(refEl) || null);
		},

		/** 
		* 向element对象内部的某元素后插入element对象
		* @method	insertAfter
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{element|string|wrap}	newEl	新对象
		* @param	{element|string|wrap}	refEl	位置参考对象
		* @return	{element}				新对象newEl
		*/
		insertAfter : function (el, newEl, refEl) {
			return g(el).insertBefore(g(newEl), refEl && g(refEl).nextSibling || null);
		},

		/** 
		* 用一个元素替换自己
		* @method	replaceNode
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{element|string|wrap}	newEl		新节点id,Element实例或wrap
		* @return	{element}				如替换成功，此方法可返回被替换的节点，如替换失败，则返回 NULL
		*/
		replaceNode : function (el, newEl) {
			el = g(el);
			return el.parentNode.replaceChild(g(newEl), el);
		},

		/** 
		* 从element里把relement替换成nelement
		* @method	replaceChild
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{element|string|wrap}	newEl	新节点id,Element实例或wrap
		* @param	{element|string|wrap}	childEl	被替换的id,Element实例或wrap后
		* @return	{element}				如替换成功，此方法可返回被替换的节点，如替换失败，则返回 NULL
		*/
		replaceChild : function (el, newEl, childEl) {
			return g(el).replaceChild(g(newEl), g(childEl));
		},

		/** 
		* 把element移除掉
		* @method	removeNode
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @return	{element}				如删除成功，此方法可返回被删除的节点，如失败，则返回 NULL。
		*/
		removeNode : function (el) {
			el = g(el);
			return el.parentNode.removeChild(el);
		},

		/** 
		* 从element里把childEl移除掉
		* @method	removeChild
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{element|string|wrap}	childEl		需要移除的子对象
		* @return	{element}				如删除成功，此方法可返回被删除的节点，如失败，则返回 NULL。
		*/
		removeChild : function (el, childEl) {
			return g(el).removeChild(g(childEl));
		},
		
		/** 
		* 对元素调用ObjectH.setEx
		* @method	get
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				prop	成员名称
		* @return	{object}				成员引用
		* @see ObjectH.getEx
		*/
		get : function (el, prop) {
			//var args = [g(el)].concat([].slice.call(arguments, 1));
			el = g(el);
			return ObjectH.getEx.apply(null, arguments);
		},

		/** 
		* 对元素调用ObjectH.setEx
		* @method	set
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				prop	成员名称
		* @param	{object}				value		成员引用/内容
		* @return	{void}
		* @see ObjectH.setEx
		*/
		set : function (el, prop, value) {
			el = g(el);
			ObjectH.setEx.apply(null, arguments);
		},

		/** 
		* 获取element对象的属性
		* @method	getAttr
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				attribute	属性名称
		* @param	{int}					iFlags		(Optional)ieonly 获取属性值的返回类型 可设值0,1,2,4 
		* @return	{string}				属性值 ie里有可能不是object
		*/
		getAttr : function (el, attribute, iFlags) {
			el = g(el);
			return el.getAttribute(attribute, iFlags || (el.nodeName == 'A' && attribute.toLowerCase() == 'href') && 2 || null);
		},

		/** 
		* 设置element对象的属性
		* @method	setAttr
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				attribute	属性名称
		* @param	{string}				value		属性的值
		* @param	{int}					iCaseSensitive	(Optional)
		* @return	{void}
		*/
		setAttr : function (el, attribute, value, iCaseSensitive) {
			el = g(el);
			el.setAttribute(attribute, value, iCaseSensitive || null);
		},

		/** 
		* 删除element对象的属性
		* @method	removeAttr
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				attribute	属性名称
		* @param	{int}					iCaseSensitive	(Optional)
		* @return	{void}
		*/
		removeAttr : function (el, attribute, iCaseSensitive) {
			el = g(el);
			return el.removeAttribute(attribute, iCaseSensitive || 0);
		},

		/** 
		* 根据条件查找element内元素组
		* @method	query
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				selector	条件
		* @return	{array}					element元素数组
		*/
		query : function (el, selector) {
			el = g(el);
			return Selector.query(el, selector || '');
		},

		/** 
		* 根据条件查找element内元素
		* @method	one
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				selector	条件
		* @return	{HTMLElement}			element元素
		*/
		one : function (el, selector) {
			el = g(el);
			return Selector.one(el, selector || '');
		},

		/** 
		* 查找element内所有包含className的集合
		* @method	getElementsByClass
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				className	样式名
		* @return	{array}					element元素数组
		*/
		getElementsByClass : function (el, className) {
			el = g(el);
			return Selector.query(el, '.' + className);
		},

		/** 
		* 获取element的value
		* @method	getValue
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @return	{string}				元素value
		*/
		getValue : function (el) {
			el = g(el);
			//if(el.value==el.getAttribute('data-placeholder')) return '';
			return el.value;
		},

		/** 
		* 设置element的value
		* @method	setValue
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				value		内容
		* @return	{void}					
		*/
		setValue : function (el, value) {
			g(el).value=value;
		},

		/** 
		* 获取element的innerHTML
		* @method	getHTML
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @return	{string}					
		*/
		getHtml : function (el) {
			el = g(el);
			return el.innerHTML;
		},

		/** 
		* 设置element的innerHTML
		* @method	setHtml
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				value		内容
		* @return	{void}					
		*/
		setHtml : function (el,value) {
			g(el).innerHTML=value;
		},

		/** 
		* 获得form的所有elements并把value转换成由'&'连接的键值字符串
		* @method	encodeURIForm
		* @param	{element}	el			form对象
		* @param	{string}	filter	(Optional)	过滤函数,会被循环调用传递给item作参数要求返回布尔值判断是否过滤
		* @return	{string}					由'&'连接的键值字符串
		*/
		encodeURIForm : function (el, filter) {

			el = g(el);

			filter = filter || function (el) { return false; };

			var result = []
				, els = el.elements
				, l = els.length
				, i = 0
				, push = function (name, value) {
					result.push(encodeURIComponent(name) + '=' + encodeURIComponent(value));
				};
			
			for (; i < l ; ++ i) {
				var el = els[i], name = el.name;

				if (el.disabled || !name) continue;
				
				switch (el.type) {
					case "text":
					case "hidden":
					case "password":
					case "textarea":
						if (filter(el)) break;
						push(name, el.value);
						break;
					case "radio":
					case "checkbox":
						if (filter(el)) break;
						if (el.checked) push(name, el.value);
						break;
					case "select-one":
						if (filter(el)) break;
						if (el.selectedIndex > -1) push(name, el.value);
						break;
					case "select-multiple":
						if (filter(el)) break;
						var opts = el.options;
						for (var j = 0 ; j < opts.length ; ++ j) {
							if (opts[j].selected) push(name, opts[j].value);
						}
						break;
				}
			}
			return result.join("&");
		},

		/** 
		* 判断form的内容是否有改变
		* @method	isFormChanged
		* @param	{element}	el			form对象
		* @param	{string}	filter	(Optional)	过滤函数,会被循环调用传递给item作参数要求返回布尔值判断是否过滤
		* @return	{bool}					是否改变
		*/
		isFormChanged : function (el, filter) {

			el = g(el);

			filter = filter || function (el) { return false; };

			var els = el.elements, l = els.length, i = 0, j = 0, el, opts;
			
			for (; i < l ; ++ i, j = 0) {
				el = els[i];
				
				switch (el.type) {
					case "text":
					case "hidden":
					case "password":
					case "textarea":
						if (filter(el)) break;
						if (el.defaultValue != el.value) return true;
						break;
					case "radio":
					case "checkbox":
						if (filter(el)) break;
						if (el.defaultChecked != el.checked) return true;
						break;
					case "select-one":
						j = 1;
					case "select-multiple":
						if (filter(el)) break;
						opts = el.options;
						for (; j < opts.length ; ++ j) {
							if (opts[j].defaultSelected != opts[j].selected) return true;
						}
						break;
				}
			}

			return false;
		},

		/** 
		* 克隆元素
		* @method	cloneNode
		* @param	{element}	el			form对象
		* @param	{bool}		bCloneChildren	(Optional) 是否深度克隆 默认值false
		* @return	{element}					克隆后的元素
		*/
		cloneNode : function (el, bCloneChildren) {
			return g(el).cloneNode(bCloneChildren || false);
		},

		/** 
		* 获得element对象的样式
		* @method	getStyle
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				attribute	样式名
		* @return	{string}				
		*/
		getStyle : function (el, attribute) {
			el = g(el);

			attribute = StringH.camelize(attribute);

			var hook = NodeH.cssHooks[attribute], result;

			if (hook) {
				result = hook.get(el);
			} else {
				result = el.style[attribute];
			}
			
			return (!result || result == 'auto') ? null : result;
		},

		/** 
		* 获得element对象当前的样式
		* @method	getCurrentStyle
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				attribute	样式名
		* @return	{string}				
		*/
		getCurrentStyle : function (el, attribute, pseudo) {
			el = g(el);

			var displayAttribute = StringH.camelize(attribute);

			var hook = NodeH.cssHooks[displayAttribute], result;

			if (hook) {
				result = hook.get(el, true, pseudo);
			} else if (Browser.ie) {
				result = el.currentStyle[displayAttribute];
			} else {
				var style = el.ownerDocument.defaultView.getComputedStyle(el, pseudo || null);
				result = style ? style.getPropertyValue(attribute) : null;
			}
			
			return (!result || result == 'auto') ? null : result;
		},

		/** 
		* 设置element对象的样式
		* @method	setStyle
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @param	{string}				attribute	样式名
		* @param	{string}				value		值
		* @return	{void}
		*/
		setStyle : function (el, attribute, value) {
			el = g(el);

			if ('string' == typeof attribute) {
				var temp = {};
				temp[attribute] = value;
				attribute = temp;
			}

			//if (el.currentStyle && !el.currentStyle['hasLayout']) el.style.zoom = 1;
			
			for (var prop in attribute) {

				var displayProp = StringH.camelize(prop);

				var hook = NodeH.cssHooks[displayProp];

				if (hook) {
					hook.set(el, attribute[prop]);
				} else {
					el.style[displayProp] = attribute[prop];
				}
			}
		},

		/** 
		* 获取element对象的border宽度
		* @method	borderWidth
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @return	{array}					topWidth, rightWidth, bottomWidth, leftWidth
		*/
		borderWidth : function (el) {
			el = g(el);

			if (el.currentStyle && !el.currentStyle.hasLayout) {
				el.style.zoom = 1;
			}

			return [
				el.clientTop
				, el.offsetWidth - el.clientWidth - el.clientLeft
				, el.offsetHeight - el.clientHeight - el.clientTop
				, el.clientLeft
			];
		},

		/** 
		* 获取element对象的padding宽度
		* @method	paddingWidth
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @return	{array}					topWidth, rightWidth, bottomWidth, leftWidth
		*/
		paddingWidth : function (el) {
			el = g(el);
			return [
				getPixel(el, NodeH.getCurrentStyle(el, 'padding-top'))
				, getPixel(el, NodeH.getCurrentStyle(el, 'padding-right'))
				, getPixel(el, NodeH.getCurrentStyle(el, 'padding-bottom'))
				, getPixel(el, NodeH.getCurrentStyle(el, 'padding-left'))
			];
		},

		/** 
		* 获取element对象的margin宽度
		* @method	marginWidth
		* @param	{element|string|wrap}	el		id,Element实例或wrap
		* @return	{array}					topWidth, rightWidth, bottomWidth, leftWidth
		*/
		marginWidth : function (el) {
			el = g(el);
			return [
				getPixel(el, NodeH.getCurrentStyle(el, 'margin-top'))
				, getPixel(el, NodeH.getCurrentStyle(el, 'margin-right'))
				, getPixel(el, NodeH.getCurrentStyle(el, 'margin-bottom'))
				, getPixel(el, NodeH.getCurrentStyle(el, 'margin-left'))
			];
		},

		cssHooks : {
			'float' : {
				get : function (el, current, pseudo) {
					if (current) {
						var style = el.ownerDocument.defaultView.getComputedStyle(el, pseudo || null);
						return style ? style.getPropertyValue('cssFloat') : null;
					} else {
						return el.style['cssFloat'];
					}
				},
				set : function (el, value) {
					el.style['cssFloat'] = value;
				}
			}
		}

	};

	if (Browser.ie) {
		NodeH.cssHooks['float'] = {
			get : function (el, current) {
				return el[current ? 'currentStyle' : 'style'].styleFloat;
			},
			set : function (el, value) {
				el.style.styleFloat = value;
			}
		};
		
		NodeH.cssHooks.opacity = {
			get : function (el, current) {
				var match = el.currentStyle.filter.match(/alpha\(opacity=(.*)\)/);
				return match && match[1] ? parseInt(match[1], 10) / 100 : 1.0;
			},

			set : function (el, value) {
				el.style.filter = 'alpha(opacity=' + parseInt(value * 100) + ')';
			}
		};
	}

	NodeH.g = g;
	
	return NodeH;
}();

//document.write('<script type="text/javascript" src="'+srcPath+'dom/event.h.js"><\/script>');
/** 
* @class EventH Event Helper，处理一些Event对象兼容问题
* @singleton
* @helper
* @namespace QW
*/
QW.EventH = function () {
	var getDoc = function (e) {
		var target = EventH.getTarget(e), doc = document;

		/*
		ie unload target is null
		*/

		if (target) {
			doc = target.ownerDocument || target.document || (target.defaultView || target.window) && target || document;
		}
		return doc;
	};

	var EventH = {

		/** 
		* 获取鼠标位于完整页面的X坐标
		* @method	getPageX
		* @param	{event}		event	(Optional)event对象 默认为调用位置所在宿主的event
		* @param	{element}	element (Optional)任意element对象 element对象所在宿主的event
		* @return	{int}		X坐标
		*/
		getPageX : function () {
			var e = EventH.getEvent.apply(EventH, arguments)
				, doc = getDoc(e);
			return ('pageX' in e) ? e.pageX : (e.clientX + (doc.documentElement.scrollLeft || doc.body.scrollLeft) - 2);
		}

		/** 
		* 获取鼠标位于完整页面的Y坐标
		* @method	getPageY
		* @param	{event}		event	(Optional)event对象 默认为调用位置所在宿主的event
		* @param	{element}	element (Optional)任意element对象 element对象所在宿主的event
		* @return	{int}		Y坐标
		*/
		, getPageY : function () {
			var e = EventH.getEvent.apply(EventH, arguments)
				, doc = getDoc(e);
			return ('pageY' in e) ? e.pageY : (e.clientY + (doc.documentElement.scrollTop || doc.body.scrollTop) - 2);
		}
		
		/** 
		* 获取鼠标距离触发事件对象顶端X坐标
		* @method	getLayerX
		* @param	{event}		event	(Optional)event对象 默认为调用位置所在宿主的event
		* @param	{element}	element (Optional)任意element对象 element对象所在宿主的event
		* @return	{int}		X坐标
		, getLayerX : function () {
			var e = EventH.getEvent.apply(EventH, arguments);
			return ('layerX' in e) ? e.layerX : e.offsetX;
		}
		*/
		
		
		/** 
		* 获取鼠标距离触发事件对象顶端Y坐标
		* @method	getLayerY
		* @param	{event}		event	(Optional)event对象 默认为调用位置所在宿主的event
		* @param	{element}	element (Optional)任意element对象 element对象所在宿主的event
		* @return	{int}		Y坐标
		, getLayerY : function () {
			var e = EventH.getEvent.apply(EventH, arguments);
			return ('layerY' in e) ? e.layerY : e.offsetY;
		}
		*/
		
		
		/** 
		* 获取鼠标滚轮方向
		* @method	getDetail
		* @param	{event}		event	(Optional)event对象 默认为调用位置所在宿主的event
		* @param	{element}	element (Optional)任意element对象 element对象所在宿主的event
		* @return	{int}		大于0向下,小于0向上.
		*/
		, getDetail : function () {
			var e = EventH.getEvent.apply(EventH, arguments);
			return e.detail || -(e.wheelDelta || 0);
		}
		
		/** 
		* 获取触发事件的按键对应的ascii码
		* @method	getKeyCode
		* @param	{event}		event	(Optional)event对象 默认为调用位置所在宿主的event
		* @param	{element}	element (Optional)任意element对象 element对象所在宿主的event
		* @return	{int}		键盘ascii
		*/
		, getKeyCode : function () {
			var e = EventH.getEvent.apply(EventH, arguments);
			return ('keyCode' in e) ? e.keyCode : (e.charCode || e.which || 0);
		}
		
		/** 
		* 阻止事件冒泡
		* @method	stopPropagation
		* @param	{event}		event	(Optional)event对象 默认为调用位置所在宿主的event
		* @param	{element}	element (Optional)任意element对象 element对象所在宿主的event
		* @return	{void}
		*/
		, stopPropagation : function () {
			var e = EventH.getEvent.apply(EventH, arguments);
			if (e.stopPropagation) e.stopPropagation();
			else e.cancelBubble = true;
		}
		
		/** 
		* 阻止事件默认行为
		* @method	preventDefault
		* @param	{event}		event	(Optional)event对象 默认为调用位置所在宿主的event
		* @param	{element}	element (Optional)任意element对象 element对象所在宿主的event
		* @return	{void}
		*/
		, preventDefault : function () {
			var e = EventH.getEvent.apply(EventH, arguments);
			if (e.preventDefault) e.preventDefault();
			else e.returnValue = false;
		}
		
		/** 
		* 获取事件触发时是否持续按住ctrl键
		* @method	getCtrlKey
		* @param	{event}		event	(Optional)event对象 默认为调用位置所在宿主的event
		* @param	{element}	element (Optional)任意element对象 element对象所在宿主的event
		* @return	{boolean}	判断结果
		*/
		, getCtrlKey : function () {
			var e = EventH.getEvent.apply(EventH, arguments);
			return e.ctrlKey;
		}
		
		/** 
		* 事件触发时是否持续按住shift键
		* @method	getShiftKey
		* @param	{event}		event	(Optional)event对象 默认为调用位置所在宿主的event
		* @param	{element}	element (Optional)任意element对象 element对象所在宿主的event
		* @return	{boolean}	判断结果
		*/
		, getShiftKey : function () {
			var e = EventH.getEvent.apply(EventH, arguments);
			return e.shiftKey;
		}
		
		/** 
		* 事件触发时是否持续按住alt键
		* @method	getAltKey
		* @param	{event}		event	(Optional)event对象 默认为调用位置所在宿主的event
		* @param	{element}	element (Optional)任意element对象 element对象所在宿主的event
		* @return	{boolean}	判断结果
		*/
		, getAltKey : function () {
			var e = EventH.getEvent.apply(EventH, arguments);
			return e.altKey;
		}
		
		/** 
		* 触发事件的元素
		* @method	getTarget
		* @param	{event}		event	(Optional)event对象 默认为调用位置所在宿主的event
		* @param	{element}	element (Optional)任意element对象 element对象所在宿主的event
		* @return	{element}	node 对象
		*/
		, getTarget : function () {
			var e = EventH.getEvent.apply(EventH, arguments), node = e.srcElement || e.target;

			if (!node) return null;
			if (node.nodeType == 3) node = node.parentNode;
			return node;
		}
		
		/** 
		* 获取元素
		* @method	getRelatedTarget
		* @param	{event}		event	(Optional)event对象 默认为调用位置所在宿主的event
		* @param	{element}	element (Optional)任意element对象 element对象所在宿主的event
		* @return	{element}	mouseover/mouseout 事件时有效 over时为来源元素,out时为移动到的元素.
		*/
		, getRelatedTarget : function () {
			var e = EventH.getEvent.apply(EventH, arguments);
			if ('relatedTarget' in e) return e.relatedTarget;
			if (e.type == 'mouseover') return e.fromElement || null;
			if (e.type == 'mouseout') return e.toElement || null;
			return null;
		}

		/** 
		* 获得event对象
		* @method	target
		* @param	{event}		event	(Optional)event对象 默认为调用位置所在宿主的event
		* @param	{element}	element (Optional)任意element对象 element对象所在宿主的event
		* @return	{event}		event对象
		*/
		, getEvent : function (event, element) {
			if (event) {
				return event;
			} else if (element) {
				if (element.document) return element.document.parentWindow.event;
				if (element.parentWindow) return element.parentWindow.event;
			}

			if ('undefined' != typeof Event && arguments.callee.caller) {
				var f = arguments.callee;
				do {
					if (/Event/.test(f.arguments[0])) return f.arguments[0];
				} while (f = f.caller);
				return null;
			} else {
				return window.event || null;
			}
		}
	};

	return EventH;
}();


//document.write('<script type="text/javascript" src="'+srcPath+'dom/eventtarget.h.js"><\/script>');
/** 
* @class EventTargetH EventTarget Helper，处理和事件触发目标有关的兼容问题
* @singleton
* @helper
* @namespace QW
*/
QW.EventTargetH = function () {

	var E = {};
	var g=QW.NodeH.g;


	var cache = {};
	var delegateCache = {};
	var PROPERTY_NAME = '__EventTargetH_ID';
	var index = 0;


	/** 
	* 获取key
	* @method	getKey
	* @private
	* @param	{element}	element		被观察的目标
	* @param	{string}	type		(Optional)事件名称
	* @param	{function}	handler		(Optional)事件处理程序
	* @return	{string}	key
	*/
	var getKey = function (element, type, handler) {
		var result = '';

		if (!element[PROPERTY_NAME]) element[PROPERTY_NAME] = ++ index;

		result += element[PROPERTY_NAME];

		if (type) {
			result += '_' + type;

			if (handler) {
				if (!handler[PROPERTY_NAME]) handler[PROPERTY_NAME] = ++ index;
				result += '_' + handler[PROPERTY_NAME];
			}
		}

		return result;
	};

	/** 
	* 获取key
	* @method	getDelegateKey
	* @private
	* @param	{element}	element		被委托的目标
	* @param	{string}	selector	(Optional)委托的目标
	* @param	{string}	type		(Optional)事件名称
	* @param	{function}	handler		(Optional)事件处理程序
	* @return	{string}	key
	*/
	var getDelegateKey = function (element, selector, type, handler) {
		var result = '';

		if (!element[PROPERTY_NAME]) element[PROPERTY_NAME] = ++ index;

		result += element[PROPERTY_NAME];

		if (selector) {
			result += '_' + selector.replace(/_/g, '\x01');

			if (type) {
				result += '_' + type;

				if (handler) {
					if (!handler[PROPERTY_NAME]) handler[PROPERTY_NAME] = ++ index;
					result += '_' + handler[PROPERTY_NAME];
				}
			}
		}

		return result;
	};

	/** 
	* 通过key获取事件名
	* @method	keyToName
	* @private
	* @param	{string}	key		键值
	* @return	{string}	事件名称
	*/
	var keyToName = function (key) {
		return key.split('_')[1];
	};

	/** 
	* 通过key获取事件名
	* @method	delegateKeyToName
	* @private
	* @param	{string}	key		键值
	* @return	{string}	事件名称
	*/
	var delegateKeyToName = function (key) {
		return key.split('_')[2];
	};

	/** 
	* 监听方法
	* @method	listener
	* @private
	* @param	{element}	element	监听目标
	* @param	{string}	name	事件名称
	* @param	{function}	handler	事件处理程序
	* @return	{object}	委托方法执行结果
	*/
	var listener = function (element, name, handler) {
		return function (e) {
			return fireHandler(element, e, handler, name);
		};
	};

	/** 
	* 监听方法
	* @method	delegateListener
	* @private
	* @param	{element}	element 	监听目标
	* @param	{string}	selector	选择器
	* @param	{string}	name		事件名称
	* @param	{function}	handler		事件处理程序
	* @return	{object}	委托方法执行结果
	*/
	var delegateListener = function (element, selector, name, handler) {
		return function (e) {
			var elements = [], node = e.srcElement || e.target;
			
			if (!node) return;

			if (node.nodeType == 3) node = node.parentNode;

			while (node && node != element) {
				elements.push(node);
				node = node.parentNode;
			}

			elements = QW.Selector.filter(elements, selector, element);

			for (var i = 0, l = elements.length ; i < l ; ++ i) {
				fireHandler(elements[i], e, handler, name);

				/*fix remove element[i] bubble bug*/
				if (elements[i].parentNode && elements[i].parentNode.nodeType == 11) {
					if (e.stopPropagation) {
						e.stopPropagation();
					} else {
						e.cancelBubble = true;
					}
					break;
				}
			}
		};
	};

	/**
	 * 添加事件监听
	 * @method	addEventListener
	 * @param	{element}	element	监听目标
	 * @param	{string}	name	事件名称
	 * @param	{function}	handler	事件处理程序
	 * @param	{bool}		capture	(Optional)是否捕获非ie才有效
	 * @return	{void}
	 */
	E.addEventListener = function () {
		if (document.addEventListener) {
			return function (element, name, handler, capture) {
				element.addEventListener(name, handler, capture || false);
			};
		} else if (document.attachEvent) {
			return function (element, name, handler) {
				element.attachEvent('on' + name, handler);
			};
		} else {
			return function () {};
		}
	}();

	/**
	 * 移除事件监听
	 * @method	removeEventListener
	 * @private
	 * @param	{element}	element	监听目标
	 * @param	{string}	name	事件名称
	 * @param	{function}	handler	事件处理程序
	 * @param	{bool}		capture	(Optional)是否捕获非ie才有效
	 * @return	{void}
	 */
	E.removeEventListener = function () {
		if (document.removeEventListener) {
			return function (element, name, handler, capture) {
				element.removeEventListener(name, handler, capture || false);
			};
		} else if (document.detachEvent) {
			return function (element, name, handler) {
				element.detachEvent('on' + name, handler);
			};
		} else {
			return function () {};
		}
	}();


	/**
	 * 定义新事件
	 * @method	typedef
	 * @param	{string}	name	被定义的类型
	 * @param	{string}	newname	新定义的类型
	 * @param	{function}	handler	(Optional)事件处理程序 处理程序接受两个参数e和handler. 其中e为event对象,handler为使用者多投的委托.
	 * @return	{void}
	 */
	var Types = {};
	E.typedef = function (name, newname, handler) {
		Types[newname] = { name : name, handler : handler };
	};

	/** 
	* 标准化事件名称
	* @method	getName
	* @private
	* @param	{string}	name	事件名称
	* @return	{string}	转换后的事件名称
	*/
	
	var getName = function (name) {
		return Types[name] ? Types[name].name : name;
	};

	/** 
	* 事件执行入口
	* @method	fireHandler
	* @private
	* @param	{element}	element		触发事件对象
	* @param	{event}		event		事件对象
	* @param	{function}	handler		事件委托
	* @param	{string}	name		处理前事件名称
	* @return	{object}	事件委托执行结果
	*/
	var fireHandler = function (element, e, handler, name) {
		if (Types[name] && Types[name].handler) {
			return E.fireHandler(element, e, function (e) { return Types[name].handler.call(this, e, handler); }, name);
		} else {
			return E.fireHandler(element, e, handler, name);
		}
	};

	/** 
	* 事件执行入口
	* @method	fireHandler
	* @param	{element}	element		触发事件对象
	* @param	{event}		event		事件对象
	* @param	{function}	handler		事件委托
	* @param	{string}	name		处理前事件名称
	* @return	{object}	事件委托执行结果
	*/
	E.fireHandler = function (element, e, handler, name) {
		return handler.call(element, e);
	};

	/** 
	* 添加对指定事件的监听
	* @method	on
	* @param	{element}	element	监听目标
	* @param	{string}	sEvent	事件名称
	* @param	{function}	handler	事件处理程序
	* @return	{boolean}	事件是否监听成功
	*/
	E.on = function (element, sEvent, handler) {
		element = g(element);

		var name = getName(sEvent);
		
		var key = getKey(element, sEvent, handler);

		if (cache[key]) {
			return false;
		} else {
			var _listener = listener(element, sEvent, handler);

			E.addEventListener(element, name, _listener);

			cache[key] = _listener;

			return true;
		}
	};

	/** 
	* 移除对指定事件的监听
	* @method	un
	* @param	{element}	element	移除目标
	* @param	{string}	sEvent	(Optional)事件名称
	* @param	{function}	handler	(Optional)事件处理程序
	* @return	{boolean}	事件监听是否移除成功
	*/
	E.un = function (element, sEvent, handler) {
		
		element = g(element);
		
		if (handler) {

			var name = getName(sEvent);

			var key = getKey(element, sEvent, handler);

			var _listener = cache[key];

			if (_listener) {
				E.removeEventListener(element, name, _listener);
				
				delete cache[key];

				return true;
			} else {
				return false;
			}
		} else {			

			var leftKey = '^' + getKey(element, sEvent, handler), i, name;
			
			for (i in cache) {
				if (new RegExp(leftKey, 'i').test(i)) {
					name = keyToName(i);
					E.removeEventListener(element, getName(name), cache[i]);
					delete cache[i];
				}
			}

			return true;
		}
	};

	/** 
	* 添加事件委托
	* @method	delegate
	* @param	{element}	element		被委托的目标
	* @param	{string}	selector	委托的目标
	* @param	{string}	sEvent		事件名称
	* @param	{function}	handler		事件处理程序
	* @return	{boolean}	事件监听是否移除成功
	*/
	E.delegate = function (element, selector, sEvent, handler) {
		element = g(element);

		var name = getName(sEvent);
		
		var key = getDelegateKey(element, selector, sEvent, handler);

		if (delegateCache[key]) {
			return false;
		} else {
			var _listener = delegateListener(element, selector, sEvent, handler);

			E.addEventListener(element, name, _listener);

			delegateCache[key] = _listener;

			return true;
		}
	};

	/** 
	* 移除事件委托
	* @method	undelegate
	* @param	{element}	element		被委托的目标
	* @param	{string}	selector	(Optional)委托的目标
	* @param	{string}	sEvent		(Optional)事件名称
	* @param	{function}	handler		(Optional)事件处理程序
	* @return	{boolean}	事件监听是否移除成功
	*/
	E.undelegate = function (element, selector, sEvent, handler) {
		element = g(element);
		
		if (handler) {

			var name = getName(sEvent);

			var key = getDelegateKey(element, selector, sEvent, handler);

			var _listener = delegateCache[key];

			if (_listener) {
				E.removeEventListener(element, name, _listener);
				
				delete delegateCache[key];

				return true;
			} else {
				return false;
			}
		} else {			

			var leftKey = '^' + getDelegateKey(element, selector, sEvent, handler).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1'), i, name;
			
			for (i in delegateCache) {
				if (new RegExp(leftKey, 'i').test(i)) {
					name = delegateKeyToName(i);
					E.removeEventListener(element, getName(name), delegateCache[i]);
					delete delegateCache[i];
				}
			}

			return true;
		}
	};

	/** 
	* 触发对象的指定事件
	* @method	fire
	* @param	{element}	element	要触发事件的对象
	* @param	{string}	sEvent	事件名称
	* @return	{void}
	*/
	E.fire = function (element, sEvent) {
		element = g(element);
		var name = getName(sEvent);

		if (element.fireEvent) {
			element.fireEvent('on' + name);
		} else {
			var evt = null, doc = element.ownerDocument || element;
			
			if (/mouse|click/i.test(sEvent)) {
				evt = doc.createEvent('MouseEvents');
				evt.initMouseEvent(name, true, true, doc.defaultView, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
			} else {
				var evt = doc.createEvent('Events');
				evt.initEvent(name, true, true, doc.defaultView);
			}
			element.dispatchEvent(evt);
		}
	};

	var extend = function (types) {
		for (var i = 0, l = types.length ; i < l ; ++ i) {
			void function (type) {
				E[type] = function (element, handler) {
					if (handler) {
						E.on(element, type, handler)
					} else {
						element[type] && element[type]() || E.fire(element,type);
					}
				};
			}(types[i]);
		}
	};

	/** 
	* 绑定对象的click事件或者执行click方法
	* @method	click
	* @param	{element}	element	要触发事件的对象
	* @param	{function}	handler	(Optional)事件委托
	* @return	{void}
	*/


	/** 
	* 绑定对象的submit事件或者执行submit方法
	* @method	submit
	* @param	{element}	element	要触发事件的对象
	* @param	{function}	handler	(Optional)事件委托
	* @return	{void}
	*/

	/** 
	* 绑定对象的focus事件或者执行focus方法
	* @method	focus
	* @param	{element}	element	要触发事件的对象
	* @param	{function}	handler	(Optional)事件委托
	* @return	{void}
	*/

	/** 
	* 绑定对象的blur事件或者执行blur方法
	* @method	blur
	* @param	{element}	element	要触发事件的对象
	* @param	{function}	handler	(Optional)事件委托
	* @return	{void}
	*/

	extend('submit,click,focus,blur'.split(','));

	E.typedef('mouseover', 'mouseenter', function (e, handler) {
		var element = this, target = e.relatedTarget || e.fromElement || null;
		if (!target || target == element || (element.contains ? element.contains(target) : !!(element.compareDocumentPosition(target) & 16))) {
			return;
		}
		handler.call(element, e);
	});

	E.typedef('mouseout', 'mouseleave', function (e, handler) {
		var element = this, target = e.relatedTarget || e.toElement || null;
		if (!target || target == element || (element.contains ? element.contains(target) : !!(element.compareDocumentPosition(target) & 16))) {
			return;
		}
		handler.call(element, e);
	});

	void function () {
		var UA = navigator.userAgent;
		
		if (/firefox/i.test(UA)) {
			E.typedef('DOMMouseScroll', 'mousewheel');
		}

	}();

	return E;

}();
//document.write('<script type="text/javascript" src="'+srcPath+'dom/node.c.js"><\/script>');

(function(){
var queryer = 'queryer',
	operator = 'operator',
	getter_all = 'getter_all',
	getter_first = 'getter_first',
	getter_first_all = 'getter_first_all'	

QW.NodeC = {
	getterType : getter_first,
	arrayMethods : 'map,forEach,filter,toArray'.split(','),//部分Array的方法也会集成到NodeW里
	wrapMethods : { 
		//queryer “返回值”的包装结果
		//operator 如果是静态方法，返回第一个参数的包装，如果是原型方法，返回本身
		//getter_all 如果是array，则每一个执行，并返回
		//getter_first 如果是array，则返回第一个执行的返回值
		//getter_first_all 同getter，产出两个方法，一个是getterFirst，一个是getterAll

		//NodeH系列
		g : queryer ,
		one : queryer ,
		query : queryer ,
		getElementsByClass : queryer ,
		outerHTML : getter_first ,
		hasClass : getter_first ,
		addClass : operator ,
		removeClass : operator ,
		replaceClass : operator ,
		toggleClass : operator ,
		show : operator ,
		hide : operator ,
		toggle : operator ,
		isVisible : getter_first ,
		getXY : getter_first_all ,
		setXY : operator ,
		setSize : operator ,
		setInnerSize : operator ,
		setRect : operator ,
		setInnerRect : operator ,
		getSize : getter_first_all ,
		getRect : getter_first_all ,
		nextSibling : queryer ,
		previousSibling : queryer ,
		ancestorNode : queryer ,
		parentNode : queryer ,
		firstChild : queryer ,
		lastChild : queryer ,
		contains : getter_first ,
		insertAdjacentHTML : operator ,
		insertAdjacentElement : operator ,
		insert : operator ,
		insertTo : operator ,
		appendChild : operator ,
		insertSiblingBefore : operator ,
		insertSiblingAfter : operator ,
		insertBefore : operator ,
		insertAfter : operator ,
		replaceNode : operator ,
		replaceChild : operator ,
		removeNode : operator ,
		removeChild : operator ,
		get : getter_first_all ,
		set : operator ,
		getAttr : getter_first_all ,
		setAttr : operator ,
		removeAttr : operator ,
		getValue : getter_first_all ,
		setValue : operator ,
		getHtml : getter_first_all ,
		setHtml : operator ,
		encodeURIForm : getter_first ,
		isFormChanged : getter_first ,
		cloneNode : queryer ,
		getStyle : getter_first_all ,
		getCurrentStyle : getter_first_all ,
		setStyle : operator ,
		borderWidth : getter_first ,
		paddingWidth : getter_first ,
		marginWidth : getter_first,

		//TargetH系列
		//……

		//JssTargetH系列
		getOwnJss : getter_first_all,
		getJss : getter_first_all,
		setJss : operator,
		removeJss : operator,

		//ArrayH系列
		forEach : operator,
		filter : queryer
	},
	gsetterMethods : { //在此json里的方法，会是一个getter与setter的混合体
		val : ['getValue','setValue'],
		html : ['getHtml','setHtml'],
		attr : ['','getAttr','setAttr'],
		css : ['','getCurrentStyle','setStyle'],
		size : ['getSize', 'setInnerSize'],
		xy : ['getXY', 'setXY']
	}
};

})();

//document.write('<script type="text/javascript" src="'+srcPath+'dom/event.w.js"><\/script>');
/** 
* @class EventW Event Wrap，event对象包装器
* @namespace QW
*/
(function(){
	var mix = QW.ObjectH.mix,
		methodize = QW.HelperH.methodize;

	QW.EventW = function () {
		this.chromeHack; //chrome bug hack

		/** 
		* @property core 原生Event实例
		* @type {Event}
		*/
		this.core = QW.EventH.getEvent.apply(null, arguments);

		/** 
		* @property target 事件触发的元素
		* @type {HTMLElement}
		*/
		this.target = this.getTarget();

		/** 
		* @property relatedTarget mouseover/mouseout 事件时有效 over时为来源元素,out时为移动到的元素.
		* @type {HTMLElement}
		*/
		this.relatedTarget = this.getRelatedTarget();

		/** 
		* @property pageX 鼠标位于完整页面的X坐标
		* @type {int}
		*/
		this.pageX = this.getPageX();

		/** 
		* @property pageX 鼠标位于完整页面的Y坐标
		* @type {int}
		*/
		this.pageY = this.getPageY();
		//this.layerX = this.layerX();
		//this.layerY = this.layerY();

		/** 
		* @property detail 鼠标滚轮方向 大于0向下,小于0向上.
		* @type {int}
		*/
		this.detail = this.getDetail();

		/** 
		* @property keyCode 事件触发的按键对应的ascii码
		* @type {int}
		*/
		this.keyCode = this.getKeyCode();

		/** 
		* @property ctrlKey 事件触发时是否持续按住ctrl键
		* @type {boolean}
		*/
		this.ctrlKey = this.getCtrlKey();

		/** 
		* @property shiftKey 事件触发时是否持续按住shift键
		* @type {boolean}
		*/
		this.shiftKey = this.getShiftKey();

		/** 
		* @property altKey 事件触发时是否持续按住alt键
		* @type {boolean}
		*/
		this.altKey = this.getAltKey();

		/** 
		* @property button 事件触发的鼠标键位(左中右) 由于ie和其它浏览器策略很不相同，所以没有作兼容处理。这里返回的是原生结果
		* @type {boolean}
		*/
		this.button = this.core.button;

		this.clientX = this.core.clientX;
		this.clientY = this.core.clientY;
		this.type = this.core.type;
	};

	mix(QW.EventW.prototype, methodize(QW.EventH, 'core'));
})();


//document.write('<script type="text/javascript" src="'+srcPath+'dom/node.w.js"><\/script>');
/*
	Copyright (c) 2010, Baidu Inc.  http://www.youa.com; http://www.QWrap.com
	author: JK
	author: wangchen
*/
/** 
* @class NodeW HTMLElement对象包装器
* @namespace QW
*/
(function () {
	var ObjectH = QW.ObjectH,
		mix = ObjectH.mix,
		isString = ObjectH.isString,
		isArray = ObjectH.isArray,
		push = Array.prototype.push,
		NodeH = QW.NodeH,
		g = NodeH.g,
		query = NodeH.query,
		one = NodeH.one,
		create=QW.DomU.create;


	var NodeW=function(core) {
		if(!core) return null;//用法：var w=NodeW(null);	返回null
		var arg1=arguments[1];
		if(isString(core)){
			if(/^</.test(core)){//用法：var w=NodeW(html); 
				var list=create(core,true,arg1).childNodes,
					els=[];
				for(var i=0,elI;elI=list[i];i++) {
					els[i]=elI;
				}
				return new NodeW(els);
			}
			else{//用法：var w=NodeW(sSelector);
				return new NodeW(query(arg1,core));
			}
		}
		else {
			core=g(core,arg1);
			if(this instanceof NodeW){
				this.core=core;
				if(isArray(core)){//用法：var w=NodeW(elementsArray); 
					this.length=0;
					push.apply( this, core );
				}
				else{//用法：var w=new NodeW(element)//不推荐; 
					this.length=1;
					this[0]=core;
				}
			}
			else return new NodeW(core);//用法：var w=NodeW(element); var w2=NodeW(elementsArray); 
		}
	};

	NodeW.one=function(core){
		if(!core) return null;//用法：var w=NodeW.one(null);	返回null
		var arg1=arguments[1];
		if(isString(core)){//用法：var w=NodeW.one(sSelector); 
			if(/^</.test(core)){//用法：var w=NodeW.one(html); 
				return new NodeW(create(core,false,arg1));
			}
			else{//用法：var w=NodeW(sSelector);
				return new NodeW(one(arg1,core));
			}
		}
		else {
			core=g(core,arg1);
			if(isArray(core)){//用法：var w=NodeW.one(array); 
				return new NodeW(core[0]);
			}
			else{
				return new NodeW(core);//用法：var w=NodeW.one(element); 
			}
		}
	}

	/** 
	* 在NodeW中植入一个针对Node的Helper
	* @method	pluginHelper
	* @static
	* @param	{helper} helper 必须是一个针对Node（元素）的Helper	
	* @param	{string|json} wrapConfig	wrap参数
	* @param	{json} gsetterConfig	(Optional) gsetter 参数
	* @return	{NodeW}	
	*/

	NodeW.pluginHelper =function (helper, wrapConfig, gsetterConfig) {
		var HelperH=QW.HelperH;

		helper=HelperH.mul(helper,wrapConfig);	//支持第一个参数为array
		
		var st=HelperH.rwrap(helper,NodeW,wrapConfig);	//对返回值进行包装处理
		if(gsetterConfig) st = HelperH.gsetter(st,gsetterConfig); //如果有gsetter，需要对表态方法gsetter化

		mix(NodeW, st);	//应用于NodeW的静态方法

		var pro=HelperH.methodize(helper,'core');
		pro = HelperH.rwrap(pro,NodeW,wrapConfig);
		if(gsetterConfig) pro = HelperH.gsetter(pro,gsetterConfig);

		mix(NodeW.prototype,pro);
	};

	mix(NodeW.prototype,{
		/** 
		* 返回NodeW的第0个元素的包装
		* @method	first
		* @return	{NodeW}	
		*/
		first:function(){
			return NodeW(this[0]);
		},
		/** 
		* 返回NodeW的最后一个元素的包装
		* @method	last
		* @return	{NodeW}	
		*/
		last:function(){
			return NodeW(this[this.length-1]);
		},
		/** 
		* 返回NodeW的第i个元素的包装
		* @method	last
		* @param {int}	i 第i个元素
		* @return	{NodeW}	
		*/
		item:function(i){
			return NodeW(this[i]);
		}
	});

	QW.NodeW=NodeW;
})();



//document.write('<script type="text/javascript" src="'+srcPath+'dom/jss.js"><\/script>');
(function () {
	var mix=QW.ObjectH.mix,
		evalExp=QW.StringH.evalExp;
/** 
* @class Jss Jss-Data相关
* @singleton
* @namespace QW
*/

	var Jss={};

	mix(Jss,{
		/** 
		* @property	rules Jss的当前所有rule，相当于css的内容
		*/
		rules : {},
		/** 
		* 添加jss rule
		* @method	addRule
		* @param	{string}	sSelector	selector字符串，目前只支持#id、@name、.className、tagName
		* @param	{json}	ruleData json对象，键为arrtibuteName，值为attributeValue，其中attributeValue可以是任何对象
		* @return	{void}	
		*/
		addRule : function(sSelector, ruleData) {
			var data= Jss.rules[sSelector] || (Jss.rules[sSelector]={});
			mix(data,ruleData,true);
		},

		/** 
		* 添加一系列jss rule
		* @method	addRules
		* @param	{json}	rules json对象，键为selector，值为ruleData（Json对象）
		* @return	{json}	
		*/
		addRules : function(rules) {
			for(var i in rules){
				Jss.addRule(i,rules[i]);
			}
		},

		/** 
		* 移除jss rule
		* @method	removeRule
		* @param	{string}	sSelector	selector字符串，目前只支持#id、@name、.className、tagName
		* @return	{boolean}	是否发生移除操作
		*/
		removeRule : function(sSelector) {
			var data = Jss.rules[sSelector];
			if(data) {
				delete Jss.rules[sSelector];
				return true;
			}
			return false;
		},
		/** 
		* 获取jss rule
		* @method	getRuleData
		* @param	{string}	sSelector	selector字符串，目前只支持#id、@name、.className、tagName
		* @return	{json}	获取rule的数据内容
		*/
		getRuleData : function(sSelector) {
			return Jss.rules[sSelector];
		},

		/** 
		* 设置rule中某属性
		* @method	setRuleAttribute
		* @param	{string}	sSelector	selector字符串，目前只支持#id、@name、.className、tagName
		* @param	{string}	arrtibuteName (Optional) attributeName
		* @param	{any}	value attributeValue
		* @return	{json}	是否发回移除操作
		*/
		setRuleAttribute : function(sSelector, arrtibuteName, value) {
			var data = {};
			data[arrtibuteName]=value;
			Jss.addRule(sSelector,data);
		},

		/** 
		* 移除rule中某属性
		* @method	removeRuleAttribute
		* @param	{string}	sSelector	selector字符串，目前只支持#id、@name、.className、tagName
		* @param	{string}	arrtibuteName (Optional) attributeName
		* @return	{json}	是否发回移除操作
		*/
		removeRuleAttribute : function(sSelector, arrtibuteName) {
			var data = Jss.rules[sSelector];
			if(data && (attributeName in data)) {
				delete data[attributeName];
				return true;
			}
			return false;
		},

		/** 
		* 按selector获取jss 属性
		* @method	getRuleAttribute
		* @param	{string}	sSelector	selector字符串，目前只支持#id、@name、.className、tagName
		* @param	{string}	arrtibuteName	属性名
		* @return	{json}	获取rule的内容
		*/
		getRuleAttribute : function(sSelector,arrtibuteName) {
			var data = Jss.rules[sSelector]||{};
			return data[arrtibuteName];
		}
	});
/** 
* @class JssTargetH JssTargetH相关
* @singleton
* @namespace QW
*/

/*
* 获取元素的inline的jssData
* @method	getOwnJssData
* @param	{element}	el	元素
* @return	{json}	获取到的JssData
*/
function getOwnJssData(el,needInit){
	var data=el.__jssData;
	if(!data){
		var s=el.getAttribute('data-jss');
		if(s){
			data=el.__jssData=evalExp('{'+s+'}');
		}
	}
	else if(needInit){
		data=el.__jssData={};
	}
	return data;
};

	var JssTargetH={

		/** 
		* 获取元素的inline的jss
		* @method	getOwnJss
		* @param	{element}	el	元素
		* @return	{any}	获取到的jss attribute
		*/
		getOwnJss : function(el, attributeName) {
			var data=getOwnJssData(el);
			if (data && (attributeName in data)){
				return data[attributeName];
			}
			return undefined;
		},

		/** 
		* 获取元素的jss属性，优先度为：el.getAttribute('data-'+attributeName) > inlineJssAttribute > #id > @name > .className > tagName
		* @method	getJss
		* @param	{element}	el	元素
		* @return	{any}	获取到的jss attribute
		*/
		getJss : function(el, attributeName) {//为提高性能，本方法代码有点长。
			var val=el.getAttribute('data-'+attributeName);
			if(val) return val;
			var data=getOwnJssData(el);
			if (data && (attributeName in data)){
				return data[attributeName];
			}
			var getRuleData=Jss.getRuleData,
				id=el.id;
			if(id && (data=getRuleData('#'+id)) && (attributeName in data)){
				return data[attributeName];
			}
			var name=el.name;
			if(name && (data=getRuleData('@'+name)) && (attributeName in data)){
				return data[attributeName];
			}
			var className=el.className;
			if(className){
				var classNames=className.split(' ');
				for(var i=0;i<classNames.length;i++){
					if((data=getRuleData('.'+classNames[i])) && (attributeName in data)){
						return data[attributeName];
					}
				}
			}
			var tagName=el.tagName;
			if(name && (data=getRuleData(tagName)) && (attributeName in data)){
				return data[attributeName];
			}
			return undefined;	
		},
		/** 
		* 设置元素的jss属性
		* @method	setJss
		* @param	{element}	el	元素
		* @param	{string}	attributeName	attributeName
		* @param	{any}	attributeValue	attributeValue
		* @return	{void}	
		*/
		setJss : function(el, attributeName , attributeValue) {
			var data=getOwnJssData(el,true);
			data[attributeName]=attributeValue;
		},

		/** 
		* 移除元素的inline的jss
		* @method	removeJss
		* @param	{element}	el	元素
		* @param	{string}	attributeName	attributeName
		* @return	{boolean}	是否进行remove操作
		*/
		removeJss : function(el, attributeName) {
			var data=getOwnJssData(el);
			if(data && (attributeName in data)){
				delete data[attributeName];
				return true;
			}
			return false;
		}
	};

	QW.Jss=Jss;
	QW.JssTargetH=JssTargetH;
})();

//document.write('<script type="text/javascript" src="'+srcPath+'dom/dom_retouch.js"><\/script>');
//test
void function () {
	var mix=QW.ObjectH.mix,
		methodize = QW.HelperH.methodize,
		rwrap=QW.HelperH.rwrap,
		NodeC = QW.NodeC,
		NodeH = QW.NodeH,
		EventTargetH = QW.EventTargetH,
		JssTargetH = QW.JssTargetH,
		DomU = QW.DomU,
		NodeW = QW.NodeW,
		EventW = QW.EventW;
	/*
	 * EventTarget Helper onfire 方法扩展
	 * @class EventTargetH
	 * usehelper QW.EventTargetH
	*/

	EventTargetH.fireHandler = function (element, e, handler, name) {
		var we = new EventW(e);
		return handler.call(element, we);
	};


	NodeW.pluginHelper(NodeH,NodeC.wrapMethods,NodeC.gsetterMethods);
	NodeW.pluginHelper(EventTargetH,'operator');
	NodeW.pluginHelper(JssTargetH,NodeC.wrapMethods,{jss : ['','getJss', 'setJss']});
	
	var ah=QW.ObjectH.dump(QW.ArrayH,NodeC.arrayMethods);
	
	ah = methodize(ah);
	ah = rwrap(ah, NodeW, NodeC.wrapMethods); 
	mix(NodeW.prototype, ah);	//ArrayH的某些方法

	/**
	* @class Dom 将QW.DomU与QW.NodeH合并到QW.Dom里，以跟旧的代码保持一致
	* @singleton 
	* @namespace QW
	*/
	var Dom = QW.Dom = {};
	mix(Dom, [DomU, NodeH, EventTargetH, JssTargetH]);


QW.g=Dom.g;
QW.W=NodeW;
}();


//document.write('<script type="text/javascript" src="'+srcPath+'apps/youa_retouch.js"><\/script>');
/*
* 将直属于QW的方法与命名空间上提一层到window
*/
void function () {
	var F = function (e, handler) {
		var element = this, ban = element.nodeType != 9 ? element.getAttribute('data--ban') : null;

		if (ban && !isNaN(ban)) {
			if (element.__BAN_TIMER) {
				QW.EventH.preventDefault(e);
				return;
			}

			element.__BAN_TIMER = setTimeout(function () { element.__BAN_TIMER = 0; }, ban);
		}

		handler.call(element, e);
	};
	QW.EventTargetH.typedef('click', 'click', F);
	QW.EventTargetH.typedef('dblclick', 'dblclick', F);
	QW.EventTargetH.typedef('submit', 'submit', F);
}();

QW.W=QW.NodeW;
QW.ObjectH.mix(QW,QW.ModuleH);
QW.ObjectH.mix(window,QW);
QW.provideDomains=[QW,window];