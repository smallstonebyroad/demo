function parseColor( colorStr)
{
	var arr = colorStr.split(",");
	if ( arr.length == 3 )
		return "rgb(" + colorStr + ")";

	if ( arr.length == 4){
		arr[3] /= 255.0;
		return "rgba(" + arr.join(",") + ")";
	}

	return "rgb(0,0,0)";
}

var map,
    view,
    mapCenter = [120, 30];

function loadMap_MapJS() {

    var zoom = 5, maxZoom = 11, minZoom = 3;

    view = new ol.View({
        center: ol.proj.fromLonLat(mapCenter),
        zoom: zoom,
        maxZoom: maxZoom,
        minZoom: minZoom,
        zoomFactor: 2
    });

    map = new ol.Map({
        //            layers: [mglibLayer],
        renderer: 'canvas', // Force the renderer to be used
        logo: false,
        target: 'main-map',
        view: view,
        interactions: ol.interaction.defaults({ doubleClickZoom: false }) //  disable double click zoom
    });

    map.addControl(
        new ol.control.MousePosition({
            projection: 'EPSG:4326',
            target: document.getElementById('latlon')
        })
    );

    var canvasFunction = function (extent, resolution, pixelRatio, size, projection) {
        var canvas = document.getElementById("mapCanvas") || document.createElement('canvas');
        var context = canvas.getContext('2d');
        var width = Math.round(size[0]), height = Math.round(size[1]);
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);

        context.timageSmoothingEnabled = false;

//            context['imageSmoothingEnabled'] = false;       /* standard */
////            context['mozImageSmoothingEnabled'] = false;    /* Firefox */
////            context['oImageSmoothingEnabled'] = false;      /* Opera */
////            context['webkitImageSmoothingEnabled'] = false; /* Safari */
////            context['msImageSmoothingEnabled'] = false;     /* IE */

        var fullLatLon = ol.proj.transformExtent(extent, projection, 'EPSG:4326');

        var p1 = map.getPixelFromCoordinate(ol.proj.fromLonLat([120, 30]));
        var p2 = map.getPixelFromCoordinate(ol.proj.fromLonLat([120, 31]));

        var url = "/mfruit/public/index.php/fruitJson?w=" + width + "&h=" + height +
        // var url = "/mgweb/mgjson.php?w=" + width + "&h=" + height +
            "&l=" + fullLatLon[0] + "&r=" + fullLatLon[2] +
            "&b=" + fullLatLon[1] + "&t=" + fullLatLon[3];
//
//            $('#output').html(url);
        //var url = "/mgweb/m.json";
//            var url = "/mgweb/mgjson.php";
        $.ajax({
            url: url,
            type: 'get',
            processData: false,
            async: false,
            mimeType: 'text/plain; charset=x-user-defined',
//                mimeType: 'application/json',
            error: function (jqXHR, textStatus, errorThrown) {
                var i = 0;
            },
            success: function (data, textStatus, jqXHR) {
                var jStr = pako.inflate(data, {to: 'string'});
//                    $('#output').html(jStr);
                var jMap = JSON.parse(jStr);

                for (var il = 0; il < jMap.Layers.length; il++) {
                    var layer = jMap.Layers[il];
                    for (var kf = 0; kf < layer.Features.length; kf++) {
                        var coord = layer.Features[kf].Coord;

                        if (layer.Features[kf].Action == 'T') {
                            context.fillStyle = parseColor(layer.Features[kf].Color);
                            context.font = layer.Features[kf].Style;
                            context.fillText(layer.Features[kf].Text, coord[0], height - coord[1]);
                            continue;
                        }

                        context.beginPath();
                        for (var k = 0; k < coord.length; k += 2) {
//                                coord[k] < 0 ? context.moveTo(1 - coord[k], coord[k + 1]) : context.lineTo(coord[k], coord[k + 1]);
                            coord[k] < 0 ? context.moveTo(1 - coord[k], height - coord[k + 1]) : context.lineTo(coord[k], height - coord[k + 1]);
                        }
                        if (layer.Features[kf].Action == 'L') {
                            context.strokeStyle = parseColor(layer.Features[kf].Color);
                            context.stroke();
                        }
                        if (layer.Features[kf].Action == 'F') {
                            context.fillStyle = parseColor(layer.Features[kf].Color);
                            context.closePath();
                            context.fill();
                        }

                    }
                }
            }
        });

        return canvas;
    };

    var tileLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({
            // url: baseUrl + "/tiles/{z}/{x}/{y}.png",
            url: "./tiles/{z}/{x}/{y}.png",
            wrapX: true
        }),
    });

    var canvasLayer = new ol.layer.Image({
        source: new ol.source.ImageCanvas({
            canvasFunction: canvasFunction,
            projection: 'EPSG:3857',
            ratio: 1
        })
    });

    map.addLayer(tileLayer);
    map.addLayer(canvasLayer);
}