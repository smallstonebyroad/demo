/**
 * Build a date object by parsing a data string.
 *
 * @param dateString {string} Date string which to parsing.
 * @param fmt {string} String to format date object, rules please see examples.
 * @return {Date} A Date() object
 *
 * Rules in fmt string:
 *   yyyy - four digital year.
 *   yy   - two digital year.
 *   mm   - two digital month, with leading "0" if needed.
 *   m    - one or two digital month, no leading "0".
 *   dd   - two digital day, with leading "0" if needed.
 *   d    - one or two digital day, no leading "0".
 *   HH   - two digtial minute, with leading "0" if needed.
 *   H    - one or two digital minute, no leading "0"
 *   MM   - two digital minutes, with leading "0" if needed.
 *   M    - one digital minutes, no leading "0"
 *   SS   - two digital seconds, with leading "0" if needed.
 *   S    - one digital seconds, no leading "0"
 *
 * Example:
 *  var dt = DateFromString("2013-01-29 08:13:54", "yyyy-mm-dd HH:MM:SS")
 *  
 *  var dt = DateFromString("130129", "yymmdd") //-- 29Jan2013
 *  var dt = DateFromString("980129", "yymmdd") //-- 29Jan1998
 *
 * @author: hz@metgs.com 
 * 			hz@metgs.com Fix bugs in Chrome
 *
 * 2013-01-29
 */

DateFromString = function(dateString, fmt)   
{
	var o = {   
		"y+" : 0,
		"m+" : 1,
		"d+" : 0,
		"H+" : 0,
		"M+" : 0,
		"S+" : 0
	};

	for(var k in o){   
		var p = new RegExp("("+ k +")","g");
		if( p.test(fmt) ) {
			var v = dateString.substr( p.lastIndex-RegExp.$1.length, RegExp.$1.length );
			while( v.indexOf("0") == 0)
				v = v.substr(1);

			o[k] = parseInt( (v==""?"0":v) );
		}
	}

	//-- Padding year 
	if ( o["y+"] < 50 )
		o["y+"] = 2000 + o["y+"];
	else if ( o["y+"] <= 99 )
		o["y+"] = 1900 + o["y+"];

	var dt = new Date();
	dt.setFullYear( o["y+"], o["m+"]-1, o["d+"] );
	dt.setHours( o["H+"], o["M+"], o["S+"] );
		
	return dt;   
}  


/**
 * Extent Date object by adding a format() method.
 * Format a date object to string.
 *
 * @param fmt {string} String to format date object, rules please see examples.
 * @return {string} A formatted string.
 *
 * Rules in fmt string:
 *   yyyy - four digital year.
 *   yy   - two digital year.
 *   mm   - two digital month, with leading "0" if needed.
 *   m    - one or two digital month, no leading "0".
 *   dd   - two digital day, with leading "0" if needed.
 *   d    - one or two digital day, no leading "0".
 *   HH   - two digtial minute, with leading "0" if needed.
 *   H    - one or two digital minute, no leading "0"
 *   MM   - two digital minutes, with leading "0" if needed.
 *   M    - one digital minutes, no leading "0"
 *   SS   - two digital seconds, with leading "0" if needed.
 *   S    - one digital seconds, no leading "0"
 *
 * Example:
 *  var str;
 *	var dt = new Date();
 *
 *  //-- Set dt to 9Jan2006
 *  dt->setFullYear(2012,0,9);
 *
 *  //-- Set dt to 14:42:02
 *  dt->setHours(14,42,02);
 *
 *  str = dt.format("yyyy-mm-dd HH:MM:SS") //-- str="2012-01-09 14:42:02"
 *  str = dt.format("yyyy-m-d HH:MM:SS")   //-- str="2012-1-9 14:42:02"
 *  str = dt.format("yy.mm.dd")            //-- str="12-01-09"
 *  str = dt.format("HH:MM:SS")            //-- str="14:42:02"
 *
 * @author: meizz write this function and publish to web freely
 *          metgs.com rewrite rules, and add global substritution for rules.
 *
 * 2012-12-26
 */
Date.prototype.format = function(fmt)   
{
	var o = {   
		"m+" : this.getMonth()+1,
		"d+" : this.getDate(),
		"H+" : this.getHours(),
		"M+" : this.getMinutes(),
		"S+" : this.getSeconds()
	};   
	while(/(y+)/.test(fmt))
		fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));   

	for(var k in o)   
		while(new RegExp("("+ k +")").test(fmt))   
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));   
	return fmt;   
}  


/**
 * Extent Date object by adding a addHour() method.
 * Form a new date object by adding a delta hour to 
 * current date object. 
 *
 * NOTE: Value of current date object remains unchanged
 *
 * @param n {number} Delta hours add to current date object
 * @return {Date} A new date object with new values.
 *
 * metgs.com 
 * 2012-12-26
 */
Date.prototype.addHour = function( n )   
{
	var dt = new Date();
	dt.setTime( this.getTime() + n*60*60*1000 );
	return dt;
}

/**
 * Extent Date object by adding a addMinute() method.
 * Form a new date object by adding a delta minutes to 
 * current date object. 
 *
 * NOTE: Value of current date object remains unchanged
 *
 * @param n {number} Delta minutes add to current date object
 * @return {Date} A new date object with new values.
 *
 * metgs.com 
 * 2012-12-26
 */
Date.prototype.addMinute = function( n )   
{
	var dt = new Date();
	dt.setTime( this.getTime() + n*60*1000 );
	return dt;
}

/**
 * Extent Date object by adding a addSecond() method.
 * Form a new date object by adding a delta second to 
 * current date object. 
 *
 * NOTE: Value of current date object remains unchanged
 *
 * @param n {number} Delta seconds add to current date object
 * @return {Date} A new date object with new values.
 *
 * metgs.com 
 * 2012-12-26
 */
Date.prototype.addSecond = function( n )   
{
	var dt = new Date();
	dt.setTime( this.getTime() + n*1000 );
	return dt;
}

/**
 * How many hours there are from input Date object.
 *
 * @param dtIn {Date} Date object from which hour span will be calculated
 * @return {number} Hour between two date object.
 *
 * metgs.com 
 * 2013-01-20
 */
Date.prototype.getSpanHourFrom = function( dateIn )   
{	
	var n = (this.getTime() - dateIn.getTime())/1000/60/60;
	return n;
}

/*
注意：传入obj样式必须定义position
 */
var WaitingObj = (function(){
	var imgUrl = '';
	function AddWaitingDiv(obj){
		var height = $(obj).height();
		return '<div class="_showWaiting" style="width:100%;height:'+height+'px;text-align:center;position:absolute;line-height:'+height+'px;background-color:#f5f5f5;z-index:1000;top:0px;left:0px;"> \
                <img src="'+imgUrl+'images/waiting.gif" alt=""> \
            </div>';
	}

	return {
		Init:function(url){
			imgUrl = url;
		},
		ShowWaiting:function(obj){
			$(obj).append(AddWaitingDiv(obj));
		},
		CloseWaiting:function(obj){
			$(obj).children('._showWaiting').remove();
		}
	}
})();

//消息提示(自动消失)
function showToast(msg, type, callback) {	
    $().toastmessage('showToast', {
        text: msg,
        sticky: false,
        position: 'middle-center',
        type: type,
        close: callback
    });
} 

(function ($) {
    $.getUrlParam = function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        
        if (r != null) return unescape(r[2]); return null;
    }
})(jQuery);

var matched, browser;

jQuery.uaMatch = function( ua ) {
    ua = ua.toLowerCase();

    var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
        /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
        /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
        /(msie) ([\w.]+)/.exec( ua ) ||
        ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
        [];

    return {
        browser: match[ 1 ] || "",
        version: match[ 2 ] || "0"
    };
};

matched = jQuery.uaMatch( navigator.userAgent );
browser = {};

if ( matched.browser ) {
    browser[ matched.browser ] = true;
    browser.version = matched.version;
}

// Chrome is Webkit, but Webkit is also Safari.
if ( browser.chrome ) {
    browser.webkit = true;
} else if ( browser.webkit ) {
    browser.safari = true;
}

jQuery.browser = browser;

/**
*移动div
*/
var rDrag = {
    o: null,
    init: function (o) {
        o.onmousedown = this.start;
    },
    start: function (e) {
        var o;
        e = rDrag.fixEvent(e);
        e.preventDefault && e.preventDefault();
        rDrag.o = o = this;
        o.x = e.clientX - rDrag.o.offsetLeft;
        o.y = e.clientY - rDrag.o.offsetTop;
        document.onmousemove = rDrag.move;
        document.onmouseup = rDrag.end;
    },
    move: function (e) {
        e = rDrag.fixEvent(e);
        var oLeft, oTop;
        oLeft = e.clientX - rDrag.o.x;
        oTop = e.clientY - rDrag.o.y;
        rDrag.o.style.left = oLeft + 'px';
        rDrag.o.style.top = oTop + 'px';
    },
    end: function (e) {
        e = rDrag.fixEvent(e);
        rDrag.o = document.onmousemove = document.onmouseup = null;
    },
    fixEvent: function (e) {
        if (!e) {
            e = window.event;
            e.target = e.srcElement;
            e.layerX = e.offsetX;
            e.layerY = e.offsetY;
        }
        return e;
    }
}
