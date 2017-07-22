/**
 * Fruit数值预报
 * Revised by xjc 2017/6/24
 */
var FruitObj = (function(){
    var _baseUrl  = '';
    var _routeUrl = {citys:'/City/citys',tempsinglemodel:'/grid/single/tempsinglemodel',data:'/grid/single/data',singledata:'/grid/single/SingleData'};

    var _map, _view, _meteoLayer = null;

    var _params   = {
        area      : 'ZheJiang',
        source    : 'ECMWF',
        dtInit    : null,
        fh        : 24,
        level     : 500,
        varList : [],
        naviStep : 24,
        clip      :  1,
        isDirty   : true
    };

    /// 鼠标事件，用于双击放大和缩小
    var _mouseEvent = {
        button : 1,
        lastMouseUpTime : new Date(),
        lastButton : 0
    };

    //-- 每种数值预报的预报时效列表不相同，在此处预定义
    var _modelConfig = {
        'ECMWF' : { name:'欧洲中心', fh: ['0:3:96','96:6:120','120:12:240']},
        'JMA' : {name:'美国NCEP', fh: ['0:3:96']},
        'NCEP' : {name:'美国NCEP', fh: ['0:3:96','96:6:120','120:12:240']},
        'GRAPES' : {name:'美国NCEP', fh: ['0:3:96','96:6:120','120:12:240']},
        'SMB-WARMS' : {name:'美国NCEP', fh: ['0:3:96','96:6:120','120:12:240']},
        'NCEP' : {name:'美国NCEP', fh: ['0:3:96','96:6:120','120:12:240']},
    };


    /// 解析多个预报变量的定义
    // var1|var2|var2
    function parseFcstVar( paramString ){
        var arr = paramString.split('|');
        var varList = [];
        for( var i = 0; i < arr.length; i++ ){
            varList.push(parseFcstVarItem(arr[i]));
        }
        return varList;
    }

    /// 解析单个预报变量的定义
    // (ame:level:hourSpan:offSet)(action)(fuction)
    function parseFcstVarItem( itemString ){
        var arr = itemString.replace(/\)\(/g,'#').replace(/\(/g,'').replace(/\)/g,'').split("#");
        var varItem = arr[0].split(':');
        return {
            'name' : varItem[0],
            'level' : varItem[1] == '?' ? _params.level : parseInt(varItem[1]),
            'levelFixed' : varItem[1] == '?' ? false : true,
            'hourSpan' : parseInt(varItem[2]),
            'hourOffset' : parseInt(varItem[3]),
            'action' : arr[1],
            'function' : arr[2]
        };
    }

    //-- 解析预报时效字符串成数组
    function getFhArray( sourceName, filterStep ) {
        if ( !( sourceName in _modelConfig ) )
            return [];

        var fhArray = _modelConfig[sourceName].fh;

        if ( filterStep == null || filterStep == undefined )
            filterStep = _params.naviStep;

        var fhs = [0];

        for( var i=0; i< fhArray.length; i++ ){
            var arr = fhArray[i].split(":");
            var start = parseInt(arr[0]);
            var step = parseInt(arr[1]);
            var end = parseInt(arr[2]);
            if ( filterStep < step )
                continue;
            for( var k = start + step; k <= end; k += step ){
                if ( k % filterStep == 0 )
                    fhs.push( k );
            }
        }

        return fhs;
    }

    /// 参数变动后，刷新整个地图
    function ReLoad(){
        //-- If nothing changed, skip
        if ( !_params.isDirty)
            return;

        if ( _meteoLayer != null )
            _meteoLayer.getSource().changed();

    };

    function getInitialDateCtrl(){
        return $('#ctrl-initial-date');
    }

    function getForecastTimeCtrl(){
        return $('#ctrl-forecast-hour');
    }


    //-- 起报时间
    function InitializeInitialDate(){
        $('#ctrl-initial-date').mg_InitialDate({
            naviControlId : ['initial-date-navi-left', 'initial-date-navi-right'],
            stepHour : 12,
            initialDate: _params.dtInit,
            onChange : function(dt) {
                _params.dtInit = dt;;
                _params.isDirty = true;
                getForecastTimeCtrl().mg_ForecastTime('setInitialDate', dt);
            }
        });
    }

    //预报时效
    function InitializeForecastTime(){
        getForecastTimeCtrl().mg_ForecastTime({
            naviControlId : ['forecast-hour-navi-left', 'forecast-hour-navi-right'],
            initialDate: _params.dtInit,
            ftUnit : 'H',
            ftList : getFhArray( _params.source, _params.naviStep),
            onChange : function(ft){
                _params.fh = ft;
                _params.isDirty = true;
                ReLoad();
            }
        });
    }

    //-- 数据源选择
    function InitializeSource()
    {
        $('.source-bar').find('div').on('click', function(){
            $(this).siblings().removeClass("active");
            $(this).addClass('active');
            _params.source = $(this).attr('source');
            _params.sourceTitle = $(this).html();
            _params.isDirty = true;

            var ftList = getFhArray( _params.source );

            $('#ctrl-forecast-hour').mg_ForecastTime('setForecastTimeList', ftList);

            ReLoad();
        });
    }

    /// 预报要素初始化
    function InitializeVariable()
    {
        $('.fcst-var').find('.fcst-var-item').on('click',function(){
            _params.varList = parseFcstVar($(this).attr('param'));
            _params.isDirty = true;
            $(this).siblings().removeClass('active');
            $(this).addClass('active');
            ReLoad();
        });
    }


    // 预报时效导航的步长
    function InitializeNaviStep(){
        $(".ctrl-forcast-hour-step").mg_ForecastStep({
            unit : 'H',
            stepList : [ 3, 6, 12, 24],
            defaultStep : _params.naviStep,
            onChange : function( step ){
                _params.naviStep = step;
                var ftList = getFhArray( _params.source, step);
                getForecastTimeCtrl().mg_ForecastTime('setForecastTimeList', ftList);
            }
        });
    }

    // 高度层次
    function InitializeLevel(){
        $('.ctrl-pressure-level').mg_PressureLevel({
            naviControlId : ['pressure-level-navi-up','pressure-level-navi-down'],
            unit : 'hPa',
            levelList : [ 1000, 925, 850, 700, 500, 200, 100],
            defaultLevel : 500,
            onChange : function( level ){
                _params.level = level;
                for( var i = 0; i < _params.varList.length; i++ ){
                    if ( ! _params.varList[i].levelFixed  ){
                        _params.varList[i].level = level;
                        _params.isDirty = true;
                    }
                }

                ReLoad();
            }
        });
    }

    function ZoomMap(map, view, delta) {
        if (!view) {
            // the map does not have a view, so we can't act
            // upon it
            return;
        }
        var duration = 250;
        var currentResolution = view.getResolution();
        if (currentResolution) {
            var newResolution = view.constrainResolution(currentResolution, delta);
            if (duration > 0) {
                if (view.getAnimating()) {
                    view.cancelAnimations();
                }
                view.animate({
                    resolution: newResolution,
                    duration: duration,
                    easing: ol.easing.easeOut
                });
            } else {
                view.setResolution(newResolution);
            }
        }
    };

    /// 更新地图图层标题
    function updateMapTitle(jMap){
        var title = '';
        var n = jMap.Layers.length;
        for( var i = 0; i < n; i++ )        {
            if ( jMap.Layers[i].IsBaseMap == 0 ){
                title = '<div layerName="' + jMap.Layers[i].Name + '">' +
                    '<img src="Images/BoxChecked.png" />&nbsp;' +
                    jMap.Layers[i].Caption + '</div>' + title;
            }
        }
        $('.main-map-title').html(title);
    }

    /// 加载地图
    function loadMapFruit() {
        var zoom = 4, maxZoom = 11, minZoom = 3;

        _view = new ol.View({
            center: ol.proj.fromLonLat([110, 35]),
            zoom: zoom,
            maxZoom: maxZoom,
            minZoom: minZoom,
            zoomFactor: 2
        });

        _map = new ol.Map({
            renderer: 'canvas', // Force the renderer to be used
            logo: false,
            target: 'main-map',
            view: _view,
            interactions: ol.interaction.defaults({ doubleClickZoom: false }) //  disable double click zoom
        });

        _map.addControl(
            new ol.control.MousePosition({
                projection: 'EPSG:4326',
                target: document.getElementById('main-map-latlon'),
                coordinateFormat: ol.coordinate.createStringXY(2)
            })
        );

        var canvasFunction = function (extent, resolution, pixelRatio, size, projection) {
            var width = Math.round(size[0]), height = Math.round(size[1]);
            var fullLatLon = ol.proj.transformExtent(extent, projection, 'EPSG:4326');
            var fullMapExtent = [fullLatLon[0], fullLatLon[2], fullLatLon[1], fullLatLon[3]];

            var url = "/mfruit/public/index.php/fruit/json";

            if ( _params.varList.length > 0 ){
                var postParam = {     
                    'dtInit' : _params.dtInit.format('yyyymmddHH'),
                    'fh' : _params.fh,
                    'level' : _params.level,
                    'source' : _params.source,
                    'varList' : _params.varList,
                    'stamp' : (new Date()).getMilliseconds()
                };

                MMap.render(url, width, height, fullMapExtent, postParam);
                updateMapTitle(MMap.getJsonMap());                
            }

            return MMap.getCanvas();
        };

        var tileLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: "tiles/{z}/{x}/{y}.png",
                wrapX: true
            }),
        });
        
        _meteoLayer = new ol.layer.Image({
            source: new ol.source.ImageCanvas({
                canvasFunction: canvasFunction,
                projection: 'EPSG:3857',
                ratio: 1
            })
        });

        _map.addLayer(tileLayer);
        _map.addLayer(_meteoLayer);

        // -- 模拟Micaps左键双击放大，右键双击缩小
        $('#main-map').on('mouseup', function(e){
            if ( (new Date) - _mouseEvent.lastMouseUpTime <= 300){
                if ( _mouseEvent.lastButton == 0 && e.button == 0 ){
                    ZoomMap(_map, _view, 1);
                }
                if ( _mouseEvent.lastButton == 2 && e.button == 2 ){
                    ZoomMap(_map, _view, -1);
                }
            }

            _mouseEvent.lastButton = e.button;
            _mouseEvent.lastMouseUpTime = new Date();
        });

    }

    return{
        Init:function(baseUrl,lastTime){
            // _baseUrl = baseUrl;
            _params.dtInit = new Date('2017-06-22 20:00');
            loadMapFruit();

            InitializeNaviStep();
            InitializeInitialDate();
            InitializeForecastTime();
            InitializeLevel();
            InitializeSource();
            InitializeVariable();

        }
    }

})();