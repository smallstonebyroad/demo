/*
 * author: lh
 * date: 2017-07-06
 */
var Typhoon = (function() {
    'use strict'
    var map, view, mapCenter = [120, 30];
    var zoom = 4, maxZoom = 9, minZoom = 4;

    // 本地存放台风路径选择的配置参数/我的台风数据
    var configStorage = window.localStorage,
        myTyphoonTracks = JSON.parse(window.localStorage.getItem('myTyphoonTracks')) || {};

    var lineWidth = 3, hoverLineWidth = 10, pointerRadius = 5;

    var hoverTyphoonID = null, hoverPointerFeature = null;
    var selectedTyphoonData = null, selectedTyphoonID = null;
    var typhoonTracks = {}, filteredTyphoonTrakcs = null;

    // 结果集的台风数据集合
    var typhoonSource, typhoonLayer;

    // 路径选择图层
    var draw, pathParams = {filter: '', lineFilter: [], polygonFilter: '', maxNumber: 0};
    var pathShapeSource = new ol.source.Vector({wrapX: false});
    var pathShapeLayer = new ol.layer.Vector({
        source: pathShapeSource
    });

    // 地图切换
    var baseMapSource = {
        mmap: new ol.source.XYZ({
            url: "/tiles/{z}/{x}/{y}.png",
            wrapX: true
        }),
        tdmap: new ol.source.XYZ({
            url: 'http://t3.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}',
            wrapX: true
        })
    }

    var baseMapLayer = new ol.layer.Tile({
        source: baseMapSource.tdmap,
    });

    view = new ol.View({
        center: ol.proj.fromLonLat(mapCenter),
        zoom: zoom,
        maxZoom: maxZoom,
        minZoom: minZoom,
        zoomFactor: 2
    });

    map = new ol.Map({
        layers: [baseMapLayer, pathShapeLayer],
        renderer: 'canvas', // Force the renderer to be used
        logo: false,
        target: 'map',
        view: view,
        interactions: ol.interaction.defaults({ doubleClickZoom: false }) //  disable double click zoom
    });

    map.on('pointermove', function(event) {
        var tyCoordinate  = event.coordinate;
        var showCoordinate = ol.coordinate.toStringXY(ol.proj.transform(tyCoordinate, 'EPSG:3857', 'EPSG:4326'), 2);
        var coordinateArr = showCoordinate.split(',');
        var x = coordinateArr[0], y = parseFloat(coordinateArr[1]);
        $('.current-coordinate').html('当前坐标：' + x + 'E, ' + (y < 0 ? Math.abs(y) + 'S' : y + 'N'));
        var hover = this.forEachFeatureAtPixel(event.pixel, function(feature) {
            var id = feature.get('id'),
                type = feature.get('type');

            cancelHoverTyphoonLineStringHighlight();
            cancelHoverTyphoonPointerHighlight();

            if (type === 'typhoonLineString') {
                hoverTyphoonID = id;
                setHoverTyphoonLineStringHighlight();
                return true;
            }

            if (type === 'pointer') {
                hoverPointerFeature = feature;
                setHoverTyphoonPointerHighlight();
                return true;
            }
        });
        if (!hover) {
            cancelHoverTyphoonLineStringHighlight();
            cancelHoverTyphoonPointerHighlight();
        }
    });

    map.on('singleclick', function(event) {
        var click = this.forEachFeatureAtPixel(event.pixel, function(feature) {
            if (!feature.get('type') || feature.get('type') === 'pointer') {
                return false;
            }
            selectedTyphoonID = feature.get('id');
            $('.selected-category:eq(1)').removeClass('not-allowed');
            return true;
        });
        
        if (click) {
            selectedTyphoonData = myTyphoonTracks[selectedTyphoonID] || typhoonTracks[selectedTyphoonID];
            renderSelectedTyphoonTrack(selectedTyphoonData);
            Charts.SeriesData(selectedTyphoonData);
            $('.selected-category').removeClass('active');
            $('.selected-category:eq(1)').addClass('active');
            $('.current-collection').siblings().hide();
            $('.current-collection').show();
        }
    });

    /* 台风的颜色、宽度等样式 */
    var setTrackLineStyle = function(color, width) {
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: color,
                width: width
            }),
        });
    }

    /* 台风点的颜色、宽度等样式 */
    var setPointerStyle = function(color, radius) {
        return new ol.style.Style({
            image: new ol.style.Circle({
                fill: new ol.style.Fill({
                   color: color
                }),
                stroke: new ol.style.Stroke({
                   color: radius ? '#fff' : color,
                   width: 3
                }),
                radius: radius ? radius : pointerRadius
            }),
        })
    }

    /**
     * 通过每个点的值，返回台风点集的颜色
     * @value [int] 台风风速
     */
    var setStyleLevelByValue = function(value) {
        if(value >= 10.8 && value < 17.1)
            return "#00D5CB";
        else if(value >= 17.1 && value < 24.4)
            return "#FCFA00";
        else if(value >= 24.4 && value < 32.6)
             return "#FDAE0D";
        else if(value >= 32.6 && value < 41.4)
            return "#FB3B00";
        else if(value >= 41.5 && value < 50.9)
            return "#FC4d80"; 
        else if(value >= 50.9)
            return "#C2218E"; 
        else
            return "#AAAAAA";
    }

    // 取消台风曲线的高亮
    var cancelHoverTyphoonLineStringHighlight = function() {
        if (hoverTyphoonID) {
            var hoverLineFeatures = typhoonSource.getFeatures().filter(function(v) {
                return v.get('id') === hoverTyphoonID && v.get('type') === 'typhoonLineString';
            });
            for (var i = 0; i < hoverLineFeatures.length; i ++) {
                var value = hoverLineFeatures[i].get('value');
                hoverLineFeatures[i].setStyle(setTrackLineStyle(setStyleLevelByValue(value), lineWidth));
            }
        }
    }

    // 设置台风曲线的高亮
    var setHoverTyphoonLineStringHighlight = function() {
        var hoverFeatures = typhoonSource.getFeatures().filter(function(v) {
            return v.get('id') === hoverTyphoonID;
        });
        for (var i = 0; i < hoverFeatures.length; i ++) {
            var value = hoverFeatures[i].get('value');
            hoverFeatures[i].setStyle(setTrackLineStyle(setStyleLevelByValue(value), hoverLineWidth));
        }

        $('#typhoon-' + hoverTyphoonID).parent().addClass('active');
        $('#typhoon-' + hoverTyphoonID).parent().siblings().removeClass('active');
    }

    // 设置台风点的高亮
    var setHoverTyphoonPointerHighlight = function() {
        var value = hoverPointerFeature.get('value'),
            index = hoverPointerFeature.get('index');

        hoverPointerFeature.setStyle(setPointerStyle(setStyleLevelByValue(value), 8));
        $('.typhoon-list-body tr').removeClass('active');
        $('.typhoon-list-body tr').eq(index).addClass('active');
    }

    // 取消台风点的高亮
    var cancelHoverTyphoonPointerHighlight = function() {
        if (hoverPointerFeature) {
            var value = hoverPointerFeature.get('value');
            hoverPointerFeature.setStyle(setPointerStyle(setStyleLevelByValue(value)));
        }
    }

    // 处理返回的数据并绘制台风列表
    var formatTyphoonData = function(data) {
        typhoonTracks = {};

        var typhoonLength = data.length;
        for (var i = 0; i < typhoonLength; i++) {
            if(typhoonTracks[data[i].id] === undefined) {
                typhoonTracks[data[i].id] = [];
            }
            for (var id in typhoonTracks) {
                if (data[i].id == id) {
                    typhoonTracks[id].push(data[i]);
                }
            }
        }
        showTyhpoonList();
    }

    // 获取结果集的列表的数据
    var getTyphoonList = function(year) {
        filteredTyphoonTrakcs = null;
        $('.loader').toggle();
        $.post('/typhoon/index/gettyphoonbyyear', {year: year}, function(data) {
            formatTyphoonData(data);
            var count = Object.keys(typhoonTracks).length;
            $('span.typhoon-collection-count').html(count);
        }, 'json');
    }

    // 创建路径选择的类型
    var createDrawValue = function(type) {
        if (type !== 'LineString') {
            if (type === 'Box') 
                var geometryFunction = new ol.interaction.Draw.createBox();
            else 
                var geometryFunction = new ol.interaction.Draw.createRegularPolygon(40);

            draw = new ol.interaction.Draw({
                source: pathShapeSource,
                type: 'Circle',
                geometryFunction: geometryFunction
            });
        } 

        if (type === 'LineString') {
            draw = new ol.interaction.Draw({
                source: pathShapeSource,
                type: type,
            });
        }
        return draw;
    }

    // 台风路径选择
    var addPathInteraction = function(type) {
        var drawValue = createDrawValue(type);
        map.addInteraction(drawValue);
        draw.on('drawstart', function() {
            if (type !== 'LineString') 
                pathShapeSource.clear();
        });
        draw.on('drawend', function(event) {
            var feature = event.feature;
            var coordinates = feature.getGeometry().getCoordinates();
            getTyphoonListByPathShape(type, coordinates);
        });
    }

    // 根据路径选择查询
    var getTyphoonListByPathShape = function(type, coordinates) {
        pathParams.filter = type;
        pathParams.maxNumber = configStorage.maxPathNumber;
        if (type !== 'LineString') {
            var coordinate = coordinates[0];
            pathParams.lineFilter = [];
            pathParams.polygonFilter = 'POLYGON((';
            for (var i = 0; i < coordinate.length; i ++) {
                var prePointer = ol.coordinate.toStringXY(ol.proj.transform(coordinate[i], 'EPSG:3857', 'EPSG:4326'), 2).split(',');
                pathParams.polygonFilter += parseFloat(prePointer[0]) + ' ' + parseFloat(prePointer[1]) + (i === coordinate.length - 1 ? ')' : ', ');
            }
            pathParams.polygonFilter += ')';
        } else {
            var coordinate = coordinates;
            var start = ol.coordinate.toStringXY(ol.proj.transform(coordinate[0], 'EPSG:3857', 'EPSG:4326'), 2);
            var end = ol.coordinate.toStringXY(ol.proj.transform(coordinate[1], 'EPSG:3857', 'EPSG:4326'), 2);
            pathParams.polygonFilter = '';
            pathParams.lineFilter.push([]);
            var arrLength = pathParams.lineFilter.length;
            pathParams.lineFilter[arrLength - 1].push(start.split(','));
            pathParams.lineFilter[arrLength - 1].push(end.split(','));
        }
        $('.loader').toggle();
        filteredTyphoonTrakcs = null;
        $.post('/typhoon/index/gettyphoonbypathshape', pathParams, function(data) {
            formatTyphoonData(data);
            var count = Object.keys(typhoonTracks).length;
            $('span.typhoon-collection-count').html(count);
            if (count == configStorage.maxPathNumber) {
                $().toastmessage('showSuccessToast', "当前选择区域内台风数据太多，只显示前" + count + "条的台风数据");
            }
        }, 'json');
    }

    // 绑定台风列表的hover&click事件
    var bindEventTyphoonLineString = function() {
        $('.last-td').parent().hover(function() {
            hoverTyphoonID = parseInt($(this).find('.last-td').attr('id').split('-')[1]);
            setHoverTyphoonLineStringHighlight();
        }, function() {
            cancelHoverTyphoonLineStringHighlight();
        });

        $('.last-td').click(function() {
            selectedTyphoonID = parseInt($(this).attr('id').split('-')[1]);
            $('.selected-category:eq(1)').removeClass('not-allowed');
            selectedTyphoonData = myTyphoonTracks[selectedTyphoonID] || typhoonTracks[selectedTyphoonID];
            renderSelectedTyphoonTrack(selectedTyphoonData);
			Charts.SeriesData(selectedTyphoonData);
            $('.selected-category').removeClass('active');
            $('.selected-category:eq(1)').addClass('active');
            $('.current-collection').siblings().hide();
            $('.current-collection').show();
        });
    }

    // 台风列表增加/删除功能
    var bindAddDeleteEventToFirstTD = function() {
        $('.first-td').click(function() {
            var className = $(this).attr('class').split(' ')[1], typhoonID = $(this).attr('data-id');
            
            $(this).removeClass(className);
            if (className === 'add') {
                $(this).attr('title', '点击从我的台风中删除');
                $(this).addClass('remove');
                if (!myTyphoonTracks[typhoonID])
                    myTyphoonTracks[typhoonID] = typhoonTracks[typhoonID];
            } else {
                $(this).attr('title', '点击添加到我的台风');
                $(this).addClass('add');
                delete myTyphoonTracks[typhoonID];
            }

            localStorage.setItem('myTyphoonTracks', JSON.stringify(myTyphoonTracks));
            var count = Object.keys(myTyphoonTracks).length;
            $('span.my-collection-count').html(count);
        });
    }

    // 展示台风列表
    var showTyhpoonList = function(data) {
        $('.selected-category:eq(0)').siblings().removeClass('active');
        $('.selected-category:eq(0)').addClass('active');
        $('.typhoon-collection').siblings().hide();
        $('.typhoon-collection').show();
        
        map.removeLayer(typhoonLayer);
        typhoonSource = new ol.source.Vector({wrapX: false});

        var tbodyStr = '';
        var renderTracks = data || typhoonTracks;
        for (var id in renderTracks) {
            var typhoonInfo = renderTracks[id][0];
            tbodyStr = '<tr> \
                            <td class="first-td ' + (myTyphoonTracks[id] ? 'remove' : 'add') + '" data-id="' + typhoonInfo.id + '" title="' + (myTyphoonTracks[id] ? '点击从我的台风中删除' : '点击添加到我的台风') + '"></td> \
                            <td class="last-td" id="typhoon-' + typhoonInfo.id + '"> \
                                <span class="fl">' + typhoonInfo.id + ' ' + typhoonInfo.name + '</span> \
                                <span class="fr">' + DateFromString(typhoonInfo.LifeStart, 'yyyy-mm-dd HH:MM:SS').format('yyyy/mm/dd') + ' - ' + DateFromString(typhoonInfo.LifeEnd, 'yyyy-mm-dd HH:MM:SS').format('yyyy/mm/dd') + '</span> \
                            </td> \
                        </tr>' + tbodyStr;
            renderTyphoonLineStringTrack(renderTracks[id]);
        }

        $('.typhoon-collection .table').html(tbodyStr);
        
        bindEventTyphoonLineString();
        bindAddDeleteEventToFirstTD();

        typhoonLayer = new ol.layer.Vector({
            source: typhoonSource
        });
        map.addLayer(typhoonLayer);
        $('.loader').hide();
    }

    // 显示我的台风列表
    var showMyTyphoonsList = function() {
        map.removeLayer(typhoonLayer);
        typhoonSource = new ol.source.Vector({wrapX: false});

        var tbodyStr = ''; 
        for (var id in myTyphoonTracks) {
            var typhoonInfo = myTyphoonTracks[id][0];
            tbodyStr = '<tr> \
                            <td class="first-td remove" data-id="' + typhoonInfo.id + '" title="点击从我的台风中删除"></td> \
                            <td class="last-td" id="typhoon-' + typhoonInfo.id + '"> \
                                <span class="fl">' + typhoonInfo.id + ' ' + typhoonInfo.name + '</span> \
                                <span class="fr">' + DateFromString(typhoonInfo.LifeStart, 'yyyy-mm-dd HH:MM:SS').format('yyyy/mm/dd') + ' - ' + DateFromString(typhoonInfo.LifeEnd, 'yyyy-mm-dd HH:MM:SS').format('yyyy/mm/dd') + '</span> \
                            </td> \
                        </tr>' + tbodyStr;
            renderTyphoonLineStringTrack(myTyphoonTracks[id]);
        }
        $('.my-collection .table').html(tbodyStr);

        bindEventTyphoonLineString();
        $('.my-collection .first-td').click(function() {
            var className = $(this).attr('class'), typhoonID = $(this).attr('data-id');
            delete myTyphoonTracks[typhoonID];
            localStorage.setItem('myTyphoonTracks', JSON.stringify(myTyphoonTracks));
            var count = Object.keys(myTyphoonTracks).length;
            $('span.my-collection-count').html(count);
            showMyTyphoonsList();
        });

        typhoonLayer = new ol.layer.Vector({
            source: typhoonSource
        });
        map.addLayer(typhoonLayer);
    }

    // 绘制结果集的所有台风路径
    var renderTyphoonLineStringTrack = function(data) {
        var features = createTyphoonFeature(data);
        typhoonSource.addFeatures(features);
    }

    // 生成台风feature
    var createTyphoonFeature = function(data) {
        var dataLength = data.length, features = [], id = data[0].id;
        for (var i = 0; i < dataLength; i ++) {
            if (i == dataLength - 1) {
                break;
            }
            var startPoint = [parseFloat(data[i].lon), parseFloat(data[i].lat)];
            var endPoint = [parseFloat(data[i + 1].lon), parseFloat(data[i + 1].lat)];
            var coordinates = [startPoint, endPoint];
            var line = new ol.geom.LineString(coordinates);
            line.transform(ol.proj.get('EPSG:4326'), ol.proj.get('EPSG:3857'));
            var lineStringFeature = new ol.Feature({
                type: 'typhoonLineString',
                id: parseInt(data[0].id),
                value: data[i].speed,
                geometry: line
            });
            lineStringFeature.setStyle(setTrackLineStyle(setStyleLevelByValue(data[i].speed), lineWidth));
            features.push(lineStringFeature);
        }
        return features;
    }

    // 绘制当前选中台风的路径
    var renderSelectedTyphoonTrack = function(data) {

        map.removeLayer(typhoonLayer);
        typhoonSource = new ol.source.Vector({wrapX: false});

        var dataLength = data.length, features = [], id = parseInt(data[0].id), htmlStr = '';
        for (var i = 0; i < dataLength; i ++) {
            var color = setStyleLevelByValue(parseFloat(data[i].speed));
            var startPointer = [parseFloat(data[i].lon), parseFloat(data[i].lat)];

            if (i < dataLength - 1) {
                var endPointer = [parseFloat(data[i + 1].lon), parseFloat(data[i + 1].lat)];
                var coordinates = [startPointer, endPointer];
                var line = new ol.geom.LineString(coordinates);
                line.transform(ol.proj.get('EPSG:4326'), ol.proj.get('EPSG:3857'));
                var lineStringFeature = new ol.Feature({
                    id: id,
                    value: data[i].speed,
                    geometry: line
                });
                lineStringFeature.setStyle(setTrackLineStyle(color, lineWidth));
                features.push(lineStringFeature);
            }

            var dataIndex = dataLength - i - 1;
            var pointer = new ol.geom.Point(startPointer);
            pointer.transform(ol.proj.get('EPSG:4326'), ol.proj.get('EPSG:3857'));
            var pointerFeature = new ol.Feature({
                type: 'pointer',
                id: id,
                index: dataIndex,
                geometry: pointer,
                value: data[i].speed
            });

            pointerFeature.setStyle(setPointerStyle(setStyleLevelByValue(data[i].speed)));
            features.push(pointerFeature);
    
            var strong = data[dataIndex].strong.split('(')[1], title = data[dataIndex].strong.split('(')[0];

            if (strong === undefined) 
                strong = '-';
            else 
                strong = strong.substr(0, strong.length - 1);

            htmlStr += "<tr data-index='" + dataIndex + "'> \
                            <td>" + DateFromString(data[dataIndex].time, "yyyy-mm-dd HH:MM:SS").format('yyyy/mm/dd HH:MM') + "</td> \
                            <td title='" + title + "'>" + strong + "</td> \
                            <td>" + (data[dataIndex].md == '' ? '-' : data[dataIndex].md) + "</td> \
                            <td>" + (parseInt(data[dataIndex].ms) == - 999 ? '-' : parseInt(data[dataIndex].ms)) + "</td> \
                            <td>" + data[dataIndex].speed + "</td> \
                            <td>" + data[dataIndex].pressure + "</td> \
                        </tr>";
        }

        $('.typhoon-list-body tbody').html(htmlStr);
        $('.active-typhoon-info').html(data[0].id + '&nbsp;&nbsp;' + data[0].name);
        addOrRemoveSelectedTyphoon();
        bindSelectedTyphoonListHoverEvent();

        typhoonSource.addFeatures(features);
        typhoonLayer = new ol.layer.Vector({
            source: typhoonSource
        });
        map.addLayer(typhoonLayer);
    }

    // 选中台风细节列表的hover事件
    var bindSelectedTyphoonListHoverEvent = function() {
        var length = $('.typhoon-list-body tbody tr').length;
        $('.typhoon-list-body tbody tr').hover(function() {
            var index = parseInt($(this).attr('data-index'));
            var pointerFeature = typhoonSource.getFeatures().filter(function(v) {
                return v.get('index') === (length - index - 1) && v.get('type') === 'pointer';
            });
            hoverPointerFeature = pointerFeature[0];
            setHoverTyphoonPointerHighlight();
        }, function() {
            cancelHoverTyphoonPointerHighlight();
        });

		$('.typhoon-list-body tbody tr').click(function(){
			var selectID = parseInt($(this).attr('data-index'));
			var selectedTyphoonDataList = selectedTyphoonData[selectID];
			var startlat = parseFloat(selectedTyphoonDataList.lat);
			var startlon = parseFloat(selectedTyphoonDataList.lon);

            var result = CityDistancen.getDistancen(startlat, startlon);
            CityDistancen.getTable(result);
		});
		$('.typhoon-list-body tbody tr').eq(0).click();
    }

    // 删除或者添加当前台风到我的台风
    var addOrRemoveSelectedTyphoon = function() {
        if (myTyphoonTracks[selectedTyphoonID]) {
           $('.addto-mine').hide();
           $('.removefrom-mine').show();
        } else {
            $('.removefrom-mine').hide();
            $('.addto-mine').show();
        }
    }

    /**
     * 台风黄色和蓝色的警戒线
     */
    var drawWarningLevelLineLayer = function() {

        var setWarningLineColor = function(color) {
            return new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: color,
                            width: 2
                        })
                    });
        }

        var yellowText = new ol.geom.Point([127.0459, 30.003]);
        var blueText = new ol.geom.Point([132.0035, 30.0003]);

        yellowText.transform(ol.proj.get('EPSG:4326'), ol.proj.get('EPSG:3857'));
        blueText.transform(ol.proj.get('EPSG:4326'), ol.proj.get('EPSG:3857'));

        var yellowTextFeature = new ol.Feature({
            name: 'hour24',
            geometry: yellowText,
        });
        var blueTextFeature = new ol.Feature({
            name: 'hour48',
            geometry: blueText,
        });

        var yelloLineCoordinates = [[105, 0], [113.0033, 4.4943], [119.0479, 10.8333], [119, 18], [127.0459, 21.9430], [127.0459, 33.9434]];
        var blueLineCoordinates = [[105, 0], [120.0586, -0.0659], [132.0117, 14.9713], [132.0035, 34.0003]];

        var yellowLine = new ol.geom.LineString(yelloLineCoordinates);
        var blueLine = new ol.geom.LineString(blueLineCoordinates);

        yellowLine.transform(ol.proj.get('EPSG:4326'), ol.proj.get('EPSG:3857'));
        blueLine.transform(ol.proj.get('EPSG:4326'), ol.proj.get('EPSG:3857'));

        var yellowLineFeature = new ol.Feature({
            name: 'yellow',
            geometry: yellowLine,
        });
        var blueLineFeature = new ol.Feature({
            name: 'blue',
            geometry: blueLine,
        });

        var warningLineSource = new ol.source.Vector({
            wrapX: false,
            features: [yellowLineFeature, blueLineFeature]
        });

        var warningLineVector = new ol.layer.Vector({
            source: warningLineSource,
            style: function(feature) {
                if (feature.get('name') !== undefined) {
                    return [setWarningLineColor(feature.get('name'))];
                }
            }
        });

        var textStyle = {
            hour24: {text: '24小时警戒线', color: 'yellow', offsetY: 0},
            hour48: {text: '48小时警戒线', color: 'blue', offsetY: 24}
        }

        var warningTextVector = new ol.layer.Vector({
            source: new ol.source.Vector({
                wrapX: false,
                features: [yellowTextFeature, blueTextFeature]
            }),
            style: function(feature) {
                return [
                    new ol.style.Style({
                        text: new ol.style.Text({
                            font: '12px sans-serif',
                            text: textStyle[feature.get('name')].text,
                            fill: new ol.style.Fill({
                                color: textStyle[feature.get('name')].color
                            }),
                            offsetX: -10,
                            rotation: 20.41
                        })
                    })
                ]
            }
        });
        map.addOverlay(warningLineVector);
        map.addOverlay(warningTextVector);
    }

    // 设置默认localstorage
    var setDefaultLocalStorageValue = function() {
        configStorage.maxSimilarNumber  = configStorage.maxSimilarNumber || 5;
        configStorage.maxDistance  = configStorage.maxDistance || 5;
        configStorage.maxPathNumber  = configStorage.maxPathNumber || 30;
    }

    // 根据localstorage给路径参数配置、我的台风赋值
    var setPathConfigValue = function() {
        $('input[name=maxSimilarNumber]').val(configStorage.maxSimilarNumber);
        $('input[name=maxDistance]').val(configStorage.maxDistance);
        $('input[name=maxPathNumber]').val(configStorage.maxPathNumber);
        $('.my-collection-count').html(Object.keys(myTyphoonTracks).length);
    }

    var displayPathConfigValue = function() {
        setDefaultLocalStorageValue();
        setPathConfigValue();
    }

    var setLocalStorageValue = function() {
        configStorage.maxSimilarNumber = $('input[name=maxSimilarNumber]').val();
        configStorage.maxDistance = $('input[name=maxDistance]').val();
        configStorage.maxPathNumber = $('input[name=maxPathNumber]').val();
    }
    
    // 台风强度筛选
    var intensityFilter = function(min, max) {
        if (min != 0 && max != 999) {
            var renderTracks = {};
            for (var id in typhoonTracks) {
                var length = typhoonTracks[id].length, maxSpeed = 0;
                for (var i = 0; i < length; i ++) {
                    if (maxSpeed < typhoonTracks[id][i].speed) {
                        maxSpeed = typhoonTracks[id][i].speed;
                    }
                }
                if (maxSpeed >= min && maxSpeed < max) {
                    renderTracks[id] = typhoonTracks[id];
                }
            }
            return renderTracks;
        } else {
            return typhoonTracks;
        }
    }   
    // 气压过滤
    var pressureFilter = function(min, max, tracks) {
        if (min != -1 && max != -1) {
            var renderTracks = {};
            for (var id in tracks) {
                var length = tracks[id].length, minPressure = 9999;
                for (var i = 0; i < length; i ++) {
                    if (minPressure > tracks[id][i].pressure) {
                        minPressure = tracks[id][i].pressure;
                    }
                }
                if (minPressure >= min && minPressure < max) {
                    renderTracks[id] = tracks[id];
                }
            }
            return renderTracks;
        } else {
            return tracks;
        }
    }
    // 年份、月份筛选
    var dateFilter = function(year, month, tracks) {

        if (year == 0 && month == 0) {
            return tracks;
        } else {
            var renderTracks = {};
            for (var id in tracks) {
                var length = tracks[id].length;
                for (var i = 0; i < length; i++) {
                    if (year == 0 && month != 0) {
                        if (parseInt(DateFromString(tracks[id][i].time, 'yyyy-mm-dd HH:MM:SS').format('mm')) == month) {
                            renderTracks[id] = tracks[id];
                            break;
                        }
                    }

                    if (year != 0 && month == 0) {
                        if (parseInt(DateFromString(tracks[id][i].time, 'yyyy-mm-dd HH:MM:SS').format('yyyy')) == year) {
                            renderTracks[id] = tracks[id];
                            break;
                        }
                    }

                    if (year != 0 && month != 0) {
                        if ((parseInt(DateFromString(tracks[id][i].time, 'yyyy-mm-dd HH:MM:SS').format('mm')) == month) 
                            && (parseInt(DateFromString(tracks[id][i].time, 'yyyy-mm-dd HH:MM:SS').format('yyyy')) == year)) {
                            renderTracks[id] = tracks[id];
                            break;
                        }
                    }
                }
            }
            return renderTracks;
        }    
    };

    var progressing = function() {
        var width = $('#progress-bar').width();
        
        var progressingWidth = 0.384;
        var id = setInterval(function() {
           
            if (progressingWidth >= width) {
                clearInterval(id);
                $('#progress-bar').hide();
            }
            $('.progressing').width(progressingWidth);
            progressingWidth = progressingWidth + 0.384;
        }, 1);
    }
    //按季节
    var getMonthtyphoon = function (month) {
        filteredTyphoonTrakcs = null;
        $('.loader').show();
        $.post('/typhoon/Season/gettyphoonmonth',{month:month},function (data) {
            formatTyphoonData(data);
            var count = Object.keys(typhoonTracks).length;
            $('span.typhoon-collection-count').html(count);
        },'json')
    };
    //自定义
    var getDefinedtyphoon = function (start,end) {
        filteredTyphoonTrakcs = null;
        $('.loader').show();
        $.post('/typhoon/Season/gettyphoonmonth',{start:start,end:end},function (data) {
            formatTyphoonData(data);
            var count = Object.keys(typhoonTracks).length;
            if(count == 0){
                $().toastmessage('showWarningToast', "暂无数据");
            }
            $('span.typhoon-collection-count').html(count);
        },'json');
    }
    
    return {
        Init: function() {  

            // progressing();

            // 台风地图类型设置按钮
            $('.feature-config').click(function() {
                $('.map-style').toggle();
            });

            // 台风legend
            $('.for-legends').click(function() {
                $('.typhoon-legend').toggle();
            });

            // 当前选中台风信息tab切换
            $('.typhoon-detail-tab').click(function() {
				var index = $(this).index();
                $(this).siblings().removeClass('active');
                $(this).addClass('active');
				$('.typhoon-tab-content > div').eq(index).siblings().hide();
				$('.typhoon-tab-content > div').eq(index).show();
            });

            // 按强度tab点击切换
            $('.wind-intensity').click(function() {
                $('.intensity-item').removeClass('active');
                $(this).addClass('active');
                $('.hover-pressure-panel, .hover-strong-panel').hide();
                $('.hover-wind-panel').show();
                $('.hover-wind-panel > div').show();
            });

            $('.pressure-intensity').click(function() {
                $('.intensity-item').removeClass('active');
                $(this).addClass('active');
                $('.hover-wind-panel, .hover-strong-panel').hide();
                $('.hover-pressure-panel').show();
                $('.hover-pressure-panel > div').show();
            });

            $('.strong-intensity').click(function() {
                $('.intensity-item').removeClass('active');
                $(this).addClass('active');
                $('.hover-wind-panel, .hover-pressure-panel').hide();
                $('.hover-strong-panel').show();
                $('.hover-strong-panel > div').show();
            });

            // 时间过滤选择
            $('.date-filter-options > div > div').click(function() {
                $(this).siblings().removeClass('active');
                $(this).addClass('active');
            });
            // 气压过滤选择
            $('.pressure-filter-option').click(function() {
                $(this).siblings().removeClass('active');
                $(this).addClass('active');
            });
            // 左边栏目左右滑动
            $('.slide-toggle').click(function() {
                if ($('.slide-toggle span').attr('class') === 'goleft') {
                    $('.left-bar').animate({left: '-360px'}, 200, function() {
                        $('.slide-toggle span').attr('class', 'goright');
                    });
                } else {
                    $('.left-bar').animate({left: '0px'}, 200, function() {
                        $('.slide-toggle span').attr('class', 'goleft');
                    });
                }
            });

            // 按路径选择
            $('.toggle-path-info, .path-cancel-btn').click(function() {
                $('.path-info').toggle();
            }); // 按路径选择操作说明toggle

            $('.path-category').hover(function() {
                var title = $(this).attr('data-title'), left = $(this).offset().left;
                $('.path-tip').html(title);
                $('.path-tip').show().css({'left': left - 41 + 'px'});
            }, function() {
                $('.path-tip').stop().hide();
            });

            $('.path-category').click(function() {
                var type = $(this).attr('data-path');
                var classes = $(this).attr('class').split(' ').filter(function(v) {
                    return v === 'active';
                });
                pathParams.lineFilter = [];
                map.removeInteraction(draw);
                if (classes.length === 0) {
                    $(this).siblings().removeClass('active');
                    $(this).addClass('active');
                } else {
                    $(this).removeClass('active');
                    return;
                }
                map.removeLayer(typhoonLayer);
                pathShapeSource.clear();
                addPathInteraction(type);
            });

            $('.path-config img').click(function() {
                $('.path-config-wrapper').toggle();
                setPathConfigValue();
            });

            $('.complete-btn').click(function() {
                setLocalStorageValue();
                $('.path-config-wrapper').hide();
            });

            $('.cancel-btn, .config-title > img').click(function() {
                $('.path-config-wrapper').hide();
            });
            displayPathConfigValue();

            // 按年份、按路径等tab切换
            $('.category-item').click(function() {
                var index = $('.category-item').index(this);
                $('.path-category').removeClass('active');
                $(this).siblings().removeClass('active');
                $(this).addClass('active');
                $('.category-content > div').eq(index).siblings().hide();
                $('.category-content > div').eq(index).show();
                map.removeInteraction(draw);
                pathShapeSource.clear();
            });

            // 添加当前选中到我的台风
            $('.addto-mine').click(function() {
                myTyphoonTracks[selectedTyphoonID] = typhoonTracks[selectedTyphoonID] || selectedTyphoonData;
                localStorage.setItem('myTyphoonTracks', JSON.stringify(myTyphoonTracks));
                var count = Object.keys(myTyphoonTracks).length;
                $('span.my-collection-count').html(count);
                $(this).hide();
                $('.removefrom-mine').show();
            });

            // 把当前选中的台风从我的台风中移除
            $('.removefrom-mine').click(function() {
                delete myTyphoonTracks[selectedTyphoonID];
                localStorage.setItem('myTyphoonTracks', JSON.stringify(myTyphoonTracks));
                var count = Object.keys(myTyphoonTracks).length;
                $('span.my-collection-count').html(count);
                $(this).hide();
                $('.addto-mine').show();
            });

            // 结果集、当前选中、我的台风三个tab切换
            $('.selected-category').click(function() {
                var index = $('.selected-category').index(this);
                if (index === 0)
                    showTyhpoonList();

                if (index == 1) {
                    if (!selectedTyphoonID) return false;
                    renderSelectedTyphoonTrack(selectedTyphoonData);
                }
                if (index == 2)
                    showMyTyphoonsList();

                $(this).siblings().removeClass('active');
                $(this).addClass('active');

                $('.typhoon-list-wrapper > div').eq(index).siblings().hide();
                $('.typhoon-list-wrapper > div').eq(index).show();
            });

            $('.year-category-content div').click(function() {
                $(this).addClass('active');
                $(this).siblings().removeClass('active');
                var year = $(this).html();
                getTyphoonList(year);
            });

            
            //按季节click事件
            $('.season-category-content .month-item div').click(function () {
                $(this).siblings().removeClass('active');
                $(this).addClass('active');
                var month = parseInt($(this).html());
                getMonthtyphoon(month);
            });
            //按季节自定义时间click事件
            $('#submit').click(function () {
                var dateStart = parseInt($('#date-start span').html());
                var dateEnd = parseInt($('#date-end span').html());

                if(dateStart > dateEnd){
                    $().toastmessage('showWarningToast', "结束时间需要大于开始时间!");
                    return false;
                }
                getDefinedtyphoon(dateStart,dateEnd);
            })

            // drawWarningLevelLineLayer();
            var currentYear = $('.year-category-content div.active').html();
            getTyphoonList(currentYear);
        },
        GetTyphoonByNameOrID: function() {
            var params = {
                content: $('input[name=search-content]').val()
            };
            filteredTyphoonTrakcs = null;
            $.post('/typhoon/index/gettyphoonbysearchcontent', params, function(data) {
                formatTyphoonData(data);
                var count = Object.keys(typhoonTracks).length;
                $('span.typhoon-collection-count').html(count);
            }, 'json');
        },
        SetBaseMapSource: function(dom, source) { // 切换地图类型
            $(dom).siblings().removeClass('active');
            $(dom).addClass('active');
            baseMapLayer.setSource(baseMapSource[source]);
            var className = $('.current-coordinate').attr('class').split(' ');
            $('.current-coordinate').removeClass(className[1]);
            if (source === 'tdmap') {
                $('.current-coordinate').addClass(source);
            }
        },
        RemoveTyphoon: function() { // 清除结果集的台风数据
            $('.typhoon-collection .table').html('');
            $('.typhoon-collection-count').html(0);
            typhoonTracks = {};
            map.removeLayer(typhoonLayer);
            pathShapeSource.clear();
        },
        RemoveMyTyphoon: function() { // 清除我的台风数据
            $('.my-collection .table').html('');
            $('.my-collection-count').html(0);
            myTyphoonTracks = {};
            map.removeLayer(typhoonLayer);
        },
        Sort: function() {
            // console.log(Object.keys(typhoonTracks));
            // var newTyphoonTracks = {}, typhoonIDs = [];
            // for (var id in typhoonTracks) {
            //     typhoonIDs.push(typhoonTracks[id][0].name);
            // }
            // typhoonIDs.sort(function(a, b) {
            //     return a - b;
            // });
            //console.log(typhoonIDs);
        },
        GetSimilarPathByID: function() {
            var parammeter = {
                id: selectedTyphoonID,
                maxNumber: configStorage.maxSimilarNumber,
                maxDistance: configStorage.maxDistance
            };
            $('.loader').show();
            filteredTyphoonTrakcs = null;
            $.post('/typhoon/index/getsimilarpathbyid', parammeter, function(data) {
                formatTyphoonData(data);
                var count = Object.keys(typhoonTracks).length;
                $('span.typhoon-collection-count').html(count);
                $('.toast-container').remove();
                $().toastmessage('showSuccessToast', "台风路径计算完成，显示最相似的" + configStorage.maxSimilarNumber + "条台风路径");
            }, 'json');
        },
        GetTyphoonByWindLevel: function(dom, min, max) {
            $('.hover-wind-panel div').removeClass('active');
            $(dom).addClass('active');
            $(dom).parent().siblings().hide();
            filteredTyphoonTrakcs = null;
            $('.loader').show();
            $.post('/typhoon/index/gettyphoonbywindlevel', {min: min, max: max}, function(data) {
                formatTyphoonData(data);
                var count = Object.keys(typhoonTracks).length;
                $('span.typhoon-collection-count').html(count);
            }, 'json');
        },
        GetTyphoonByPressure: function(dom, min, max) {
            $('.hover-pressure-panel div').removeClass('active');
            $(dom).addClass('active');
            $(dom).parent().siblings().hide();
            filteredTyphoonTrakcs = null;
            $('.loader').show();
            $.post('/typhoon/index/gettyphoonbypressure', {min: min, max: max}, function(data) {
                formatTyphoonData(data);
                var count = Object.keys(typhoonTracks).length;
                $('span.typhoon-collection-count').html(count);
            }, 'json');
        },
        GetTyphoonByIntensityLevel: function(dom, min, max) {
            $('.hover-strong-panel div').removeClass('active');
            $(dom).addClass('active');
            $(dom).parent().siblings().hide();
            filteredTyphoonTrakcs = null;
            $('.loader').show();
            $.post('/typhoon/index/gettyphoonbywindlevel', {min: min, max: max}, function(data) {
                formatTyphoonData(data);
                var count = Object.keys(typhoonTracks).length;
                $('span.typhoon-collection-count').html(count);
            }, 'json');
        },
        ToggleAdvanceFilter: function() {
            $('.advance-filter-wrapper').toggle();
        },
        AdvanceFilter: function() {
            // $('.loader').show();
            var intensity = $('input[name=intensity]:checked').val(),
                minPressure = parseInt($('.pressure-filter-option.active').attr('minPressure')), 
                maxPressure = parseInt($('.pressure-filter-option.active').attr('maxPressure')),
                year = parseInt($('.year-options > div.active').attr('value')),
                month = parseInt($('.month-options > div.active').attr('value'));

            var minIntensity = intensity.split(',')[0], maxIntensity = intensity.split(',')[1];
            var intensityFiltedTracks = intensityFilter(minIntensity, maxIntensity);
            var pressureFiltedTracks = pressureFilter(minPressure, maxPressure, intensityFiltedTracks);
            filteredTyphoonTrakcs = dateFilter(year, month, pressureFiltedTracks); 
            showTyhpoonList(filteredTyphoonTrakcs);
            var count = Object.keys(filteredTyphoonTrakcs).length;
            $('span.typhoon-collection-count').html(count);
        }
    }
})();

Typhoon.Init();