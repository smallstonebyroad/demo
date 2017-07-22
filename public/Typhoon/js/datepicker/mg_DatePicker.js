/**
 * 日历选择插件.
 *  + 支持日期选择
 *  + 支持时间选择（不支持时间中的秒选择）
 *
 *  依赖库:
 *   + Jquery 1.17+
 *   + mlib.js
 *
 *  创建对象时的参数：
 *   @param value {Date} 时间初始值 Date() 类型，不提供时默认为当前机器时间
 *   @param showTime {bool} 是否显示时间选择器，默认不添加时间选择器
 *   @param format {string} 输出字符串格式,默认为"yyyy-mm-dd HH:MM"
 *   @param hourList {Array} 限制小时选择的范围，默认可以选择任意24小时，数组时表示小时只能只数组成员值
 *   @param minuteList {Array} 限制分钟选择的范围，默认可以选择任意60分钟，数组时表示分钟只能只数组成员值
 *   @param onChange {function} 选择日时间日期值发生变动时的响应函数
 *
 * Author:
 * 2017-04-21 xjc@metgs.com
 * 2015-08-21 ZhouLeAn@metgs.com
 *
 * Copyright MetGS Co. Ltd.
 */
(function ($) {
    $.fn.mg_DatePicker = function (options) {
        var defaultOptions = {
            value: null,                        // 时间初始值 Date() 类型
            showTime : false,                    // 是否显示时间
            format : null,                      // 在绑定控件上显示的格式，参见mlib中Date.format()函数规定
            hourList : null,// [8,20],                  // null 或者数组，数组时表示小时只能只数组成员值
            minuteList : null,//[0,10,20,30,40,50],    // null 或者数组，数组时表示分钟只能只数组成员值
            onChange : null, // On change event handler
            quietMode : false,
            triggerChangeEventOnInitial : true
        };

        //-- Selector is invalid
        if ( this.length < 0 )
            return;

        var options = $.extend(defaultOptions, options, {picker:null, container:null});

        //-- Use default output format
        if ( options.format == null )
            options.format = "yyyy-mm-dd" + (options.showTime ? " HH:MM" : "");

        options.container = this;

        //-- Create controls's DOM
        initialize(options);

        //-- Note: picker is a sibling of container.
        options.picker = this.next('.mg-date-picker');

        //-- Binding event to show this control when container clicked
        if( !options.quietMode )
            this.on('click', {'options': options}, showPicker);

        //-- When in date only mode, auto hide picker
        if ( ! options.showTime )
            autoHide(options.picker)

        //-- Binding event to close this control
        options.picker.find('.mg-date-picker-close').on('click', function () {
            $(this).parent().hide();
        });

        //-- Binding event to select day
        options.picker.find('.mg-date-picker-day li').on('click', {'options': options}, selectDay);

        //-- Binding event to select year
        options.picker.find('.mg-date-picker-head-year span').on('click', {'options': options}, selectYear);

        //-- Binding event to select month
        options.picker.find('.mg-date-picker-head-month span').on('click', {'options': options}, selectMonth);

        //-- Binding event to navigate year and month
        options.picker.find('.mg-date-picker-head-navi').on('click', {'options': options}, navigateYearMonth);

        //-- Binding event to today or ok button
        if ( options.showTime == false ) {
            options.picker.find('.mg-date-picker-today').on('click', {'options': options}, selectToday);
        }else{
            options.picker.find('.mg-date-picker-hour').on('click', {'options': options}, selectHour);
            options.picker.find('.mg-date-picker-minute').on('click', {'options': options}, selectMinute);
            options.picker.find('.mg-date-picker-ok').on('click', {'options': options}, onOk);
            autoHide(options.picker.find('.mg-date-picker-hour-detail'));
            autoHide(options.picker.find('.mg-date-picker-minute-detail'));
        }

        //-- Use input or default date to initialize control value
        var dt = (options.value == null ? new Date() : options.value);
        setDate(dt, options.picker);

        if ( options.triggerChangeEventOnInitial )
            doneSelection(dt,options);

        return;

        //-------------------------------------------------------
        //-- functions user internally
        //-------------------------------------------------------
        /**
         * Creator this picker control by append DOM elements
         */
        function initialize(options) {
            pos = options.container.offset();
            var dom =
                "  <span class='mg-date-picker-close'>×</span>" +
                "  <div class='mg-date-picker-head'>" +
                "     <ul>" +
                "        <li class='mg-date-picker-head-navi' direction='-1' style='font-family: fantasy;'><div class='mg-date-pick-left'></div></li>" +
                "        <li class='mg-date-picker-head-year'><span >yyyy</span>" +
                "          <div class='mg-date-picker-year-detial' style='display: none; ' ><ul></ul></div>" +
                "        </li>" +
                "       <li class='mg-date-picker-head-month'><span >mm</span>" +
                "          <div  class='mg-date-picker-month-detial' style='display: none; '><ul></ul></div>" +
                "       </li>" +
                "       <li class='mg-date-picker-head-navi' direction='1' > <div class='mg-date-pick-right'></div> </li>" +
                "    </ul>" +
                "</div>" +
                "<span class='mg-date-picker-seprator-line'></span>" +
                "<div class='mg-date-picker-body'>" +
                "    <ul class='mg-date-picker-week'>" +
                "        <li>一</li><li>二</li><li>三</li><li>四</li><li>五</li><li>六</li><li>日</li>" +
                "    </ul>" +
                "    <ul class='mg-date-picker-day'>" +
                "        <li>1</li><li>2</li><li>3</li><li>4</li><li>5</li><li>6</li><li>7</li>" +
                "        <li>1</li><li>2</li><li>3</li><li>4</li><li>5</li><li>6</li><li>7</li>" +
                "        <li>1</li><li>2</li><li>3</li><li>4</li><li>5</li><li>6</li><li>7</li>" +
                "        <li>1</li><li>2</li><li>3</li><li>4</li><li>5</li><li>6</li><li>7</li>" +
                "        <li>1</li><li>2</li><li>3</li><li>4</li><li>5</li><li>6</li><li>7</li>" +
                "        <li>1</li><li>2</li><li>3</li><li>4</li><li>5</li><li>6</li><li>7</li>" +
                "    </ul>" +
                "</div>";

            if ( options.showTime == false ) {
                dom += "<div class='mg-date-picker-today'>今天</div>";
            }else{
                dom += "<span class='mg-date-picker-seprator-line'></span>" +
                    "<div class='mg-date-picker-time-or-today'>" +
                    "  <div>" +
                    "    <span class='mg-date-picker-time'><span class='mg-date-picker-hour'>02</span>:<span class='mg-date-picker-minute'>10</span></span>" +
                    "    <span class='mg-date-picker-ok'>确定</span>" +
                    "  </div>" +
                    "  <div class='mg-date-picker-hour-detail'></div><div class='mg-date-picker-minute-detail'></div>";
                    "</div>";
            }

            if ( options.container.next('.mg-date-picker').length < 1 ){
                options.container.after("<div class='mg-date-picker'>" + dom + "</div>");
            }else{
                options.container.next('.mg-date-picker').html(dom);
            }
        }

        /**
         * Popup picker
         */
        function showPicker(event){
            var container = event.data.options.container;
            var picker = event.data.options.picker;
            var pos = container.offset();
            picker.css({'left':pos.left, 'top':(pos.top + container.outerHeight())});
            picker.show();
        }

        /**
         * Event to select day
         */
        function selectDay(event) {
            picker = event.data.options.picker;
            container = event.data.options.container;

            var dt = getDate(picker);

            if ($(this).attr('class') == 'mg-date-picker-date-last-month') {
                dt.setDate(1);
                dt = dt.addHour(-24);
            }
            else if ($(this).attr('class') == 'mg-date-picker-date-next-month') {
                dt.setDate(daysInMonth(dt.getFullYear(), dt.getMonth() + 1));
                dt = dt.addHour(24);
            }
            dt.setDate(parseInt($(this).html()));

            if ( event.data.options.showTime == false ) {
                doneSelection(dt, event.data.options);
            }else{
                setDate(dt, picker);
            }
        }

        /**
         * Save selected data and trigger on change event when done selection.
         */
        function doneSelection(dt, options){
            var container = options.container;
            var picker = options.picker;

            if( !options.quietMode ) {
                if (container.attr('value') == undefined ||
                    container.attr('value') == null ||
                    container.attr('value') == false) {
                    container.html(dt.format(options.format));
                } else {
                    container.attr('value', dt.format(options.format));
                }
            }

            setDate(dt, picker);
            picker.hide();

            if ( options.onChange != null )
                options.onChange(dt);
        }

        /**
         * Event to select year
         */
        function selectYear(event) {
            picker = event.data.options.picker;
            var tmpYear = parseInt(event.data.options.value.format('yyyy'));

            var html = "";
            for (var i = (tmpYear - 5); i < (tmpYear + 5); i++) {
                html += "<li>" + i + "</li>";
            }

            picker.find('.mg-date-picker-year-detial ul').html(html);

            picker.find('.mg-date-picker-year-detial ul li ').on('click', {'options': options}, function (event) {
                var dt = getDate(options.picker);
                dt.setFullYear($(this).html());
                dt.setDate(1);
                setDate(dt, options.picker);
                $(this).parent().parent().hide();
            });

            autoHide(picker.find('.mg-date-picker-year-detial'));

            picker.find('.mg-date-picker-year-detial').show();
        }

        /**
         * Event to select month
         */
        function selectMonth(event) {
            picker = event.data.options.picker;

            var html = "";
            for (var i = 1; i <= 12; i++) {
                html += "<li m='" + (i - 1) + "'>" + i + "月</li>";
            }

            picker.find('.mg-date-picker-month-detial ul').html(html);

            autoHide(picker.find('.mg-date-picker-month-detial'));

            picker.find('.mg-date-picker-month-detial ul li ').on('click', {'picker': picker}, function (event) {
                var picker = event.data.picker;
                var dt = getDate(picker);
                dt.setMonth($(this).attr('m'));
                dt.setDate(1);
                setDate(dt, picker);
                $(this).parent().parent().hide();
            });

            picker.find('.mg-date-picker-month-detial').show();
        }

        /**
         * Event to select hour
         */
        function selectHour(event) {
            var picker = event.data.options.picker;

            var hourList =  event.data.options.hourList == null ?
                [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23] : event.data.options.hourList;

            var html = "";

            for (var i = 0; i < hourList.length; i++) {
                html += "<li h='" + hourList[i] + "'>" + ( hourList[i] < 10 ? '0' : '') + ( hourList[i] ) + "</li>";
            }

            picker.find('.mg-date-picker-hour-detail').html("<ul>" + html + "</ul>");

            picker.find('.mg-date-picker-hour-detail li ').on('click', {'picker': picker}, function (event) {
                var picker = event.data.picker;
                var dt = getDate(picker);
                dt.setHours($(this).attr('h'));
                setDate(dt,picker);
                picker.find('.mg-date-picker-hour').html($(this).html());
                $(this).parent().parent().hide();
            });

            var hour = picker.find('.mg-date-picker-hour');
            var detail = picker.find('.mg-date-picker-hour-detail');
            detail.css({'width': Math.min(hourList.length,4)*30});
            detail.css({
                'left':hour.offset().left-picker.offset().left,
                'top':hour.offset().top - picker.offset().top-detail.outerHeight()
            });
            detail.show();
        }

        /**
         * Event to select minute
         */
        function selectMinute(event) {
            var picker = event.data.options.picker;

            var minuteList =  event.data.options.minuteList;
            if ( minuteList == null ){
                minuteList = new Array(60);
                for( var i=0; i<60; i++ ){
                    minuteList[i] = i;
                }
            }

            var html = "";

            for (var i = 0; i < minuteList.length; i++) {
                html += "<li m='" + minuteList[i] + "'>" + ( minuteList[i] < 10 ? '0' : '') + ( minuteList[i] ) + "</li>";
            }

            picker.find('.mg-date-picker-minute-detail').html("<ul>" + html + "</ul>");

            picker.find('.mg-date-picker-minute-detail li ').on('click', {'picker': picker}, function (event) {
                var picker = event.data.picker;
                var dt = getDate(picker);
                dt.setMinutes($(this).attr('m'));
                setDate(dt,picker);
                picker.find('.mg-date-picker-minute').html($(this).html());
                $(this).parent().parent().hide();
                //alert($(this).html());
            });

            var minute = picker.find('.mg-date-picker-minute');
            var detail = picker.find('.mg-date-picker-minute-detail');
            detail.css({'width': Math.min(minuteList.length,10)*30});
            detail.css({
                'left':minute.offset().left-picker.offset().left,
                'top':minute.offset().top - picker.offset().top-detail.outerHeight()
            });
            detail.show();
        }

        /**
         * Navigate year and month,
         * shift to last month by click left arrow, and shift to next month by click right arrow
         */
        function navigateYearMonth(event) {
            picker = event.data.options.picker;

            var direction = parseInt($(this).attr('direction'));
            var dt = getDate(picker);
            dt.setDate(1);
            var m = dt.getMonth() + direction;
            dt.setFullYear( dt.getFullYear() + ( m < 0 ? -1 : ( m >= 12 ? 1 : 0)) );
            dt.setMonth(  m < 0 ? 11 : ( m > 11 ? 0 : m) );

            setDate(dt, picker);
        }

        /**
         * Event to select today's date
         */
        function selectToday(event) {
            picker = event.data.options.picker;
            container = event.data.options.container;

            doneSelection(new Date(), event.data.options);
        }

        /**
         * Update control's date value
         */
        function setDate(nowDate, picker) {
            var useDate = null;
            var year = nowDate.getFullYear(), month = nowDate.getMonth() + 1, date = nowDate.getDate();//获取年月日
            picker.find(".mg-date-picker-head-year span").html(year + "年");
            picker.find(".mg-date-picker-head-month span").html(month + "月");

            var dateEnd = daysInMonth(year, month);//获取本月最后一天
            var dayOfBegin = new Date((useDate = new Date(nowDate), useDate.setDate(1))).getDay();//获取本月第一天的周几数
            dayOfBegin = dayOfBegin == 0 ? 7 : (dayOfBegin == 1 ? 8 : dayOfBegin);//修改周几数，因为js中周日为0，所以改为7。如果第一天刚好是周一就设置为8（空一个星期）
            var lastDayOfFastM = new Date((useDate = new Date(nowDate), useDate.setDate(0))).getDate();//获取上一个月的最后一天
            var dateArry = [];
            for (var i = 0; i < 42; i++) {
                if (i < dayOfBegin - 1) {
                    dateArry[i] = lastDayOfFastM - dayOfBegin + i + 2;
                }
                else if (i < dateEnd + dayOfBegin - 1) {
                    dateArry[i] = i + 2 - dayOfBegin;
                }
                else {
                    dateArry[i] = i + 2 - dayOfBegin - dateEnd;
                }
            }

            $.each(picker.find(".mg-date-picker-day li"), function (key, e) {  //设置日期
                $(e).html(dateArry[key]);
                //e.innerHTML = dateArry[key];
                if (key < dayOfBegin - 1) {
                    e.className = "mg-date-picker-date-last-month";
                }
                else if (key < dateEnd + dayOfBegin - 1) {
                    parseInt(e.innerHTML) == date ? e.className = "mg-date-picker-date-selected" : e.className = "";
                }
                else {
                    e.className = "mg-date-picker-date-next-month";
                }
            });

            picker.find('.mg-date-picker-hour').html(nowDate.format('HH'));
            picker.find('.mg-date-picker-minute').html(nowDate.format('MM'));

            picker.attr('value', nowDate.format('yyyymmddHHMMSS'));
        }

        /**
         * Get current picker's date value
         * @param picker Object of picker
         * @returns {Date}
         */
         function getDate(picker) {
            return DateFromString(picker.attr('value'), 'yyyymmddHHMMSS');
        }

        /**
         * OK button is clicked
         */
        function onOk(event) {
            var dt = getDate(event.data.options.picker);
            doneSelection(dt, event.data.options);
        }

        /**
         *  Calculate how many days there are in a month
         * @param y, m
         * @returns {int} Maximun days in a month
         */
        function daysInMonth(y, m) {
            if (m < 1 || m > 12 || y < 1 || y > 9999)
                return -1;

            var intLeapYear = (((y % 4 == 0) && (y % 100 != 0)) || (y % 400 == 0)) ? 1 : 0;
            var daysArray = new Array(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);

            return daysArray[m - 1] + ( m == 2 ? intLeapYear : 0 );
        }

        /**
         *  Binding event to auto hide a control
         * @param selector
         */
        function autoHide(selector){
            selector.on('mouseleave',function(){
                $(this).hide();
            });
        }
    }

})(jQuery);
