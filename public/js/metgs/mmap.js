

/**
 * Fruit数值预报
 * Revised by xjc 2017/6/24
 */
var MMap = (function(){

    /// Map json object 
    var _jsonMap = null;

    /// Canvas object to render map
    var _canvas = document.createElement('canvas');

	function parseColor(colorStr)
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

        // Render map json action
	function renderAction( context, obj, height )
	{
	    var coord = obj.Coord;

	    if ( obj.Action == 'T' ) {
	        context.fillStyle =  parseColor(obj.Color);
	        context.font = obj.Style;
	        context.fillText(obj.Text, coord[0], height - coord[1]);
	        return;
	    }

	    context.beginPath();
	    for (var k = 0; k < coord.length; k += 2) {
	        coord[k] < 0 ? context.moveTo( -1 - coord[k], height - coord[k + 1]) : context.lineTo(coord[k], height - coord[k + 1]);
	    }
	    if ( obj.Action == 'L' ) {
	        context.strokeStyle = parseColor(obj.Color);
	        context.stroke();
	        return;
	    }
	    if ( obj.Action == 'F' ) {
	        context.fillStyle = parseColor(obj.Color);
	        context.closePath();
	        context.fill();
	    }
	}	

    function reloadMapData(url, width, height, fullLonLat, paramInput){
        var param = $.extend({}, {'width':width, 'height':height, 'fullLonLat': fullLonLat}, paramInput);
        _jsonMap = null;

        $.ajax({
            url: url,
            type: 'post',
            data : param,
            async: false,
            mimeType: 'text/plain; charset=x-user-defined',                
            error: function (jqXHR, textStatus, errorThrown) {
                _jsonMap = null;
            },
            success: function (data, textStatus, jqXHR) {
                var jStr = pako.inflate(data, {to: 'string'});
                // $('#debugBox').html(jStr);
                _jsonMap = JSON.parse(jStr);
            }
        });

        return _jsonMap;
    }	

    function renderMap( url, width, height, fullLonLat, param ) {
        // if ( _canvas == null )
        //     _canvas = document.getElementById("mapCanvas") || document.createElement('canvas');
        var context = _canvas.getContext('2d');
        _canvas.setAttribute('width', width);
        _canvas.setAttribute('height', height);

        var jMap = reloadMapData( url, width, height, fullLonLat, param );

        if ( jMap == null )
            return _canvas;

        //-- Build clip region
        if ( jMap.IsClipMaskOn ) {
            context.save();
            context.beginPath();
            for (var il = 0; il < jMap.ClipMask.length; il++) {
                var layer = jMap.ClipMask[il];
                context.beginPath();
                for (var kf = 0; kf < layer.Features.length; kf++) {
                    var coord = layer.Features[kf].Coord;
                    for (var k = 0; k < coord.length; k += 2) {
                        coord[k] < 0 ? context.moveTo(1 - coord[k], height - coord[k + 1]) : context.lineTo(coord[k], height - coord[k + 1]);
                    }
                }
            }
            context.clip();
        }

        //-- Fill parts
        for( var il = 0; il< jMap.Layers.length; il++ ) {
            for( var k = 0; k < jMap.Layers[il].FillParts.length; k++ ){
                renderAction( context, jMap.Layers[il].FillParts[k], height);
            }
        }

        //-- Line parts
        for( var il = 0; il< jMap.Layers.length; il++ ) {
            for( var k = 0; k < jMap.Layers[il].LineParts.length; k++ ){
                renderAction( context, jMap.Layers[il].LineParts[k], height);
            }
        }

        //-- Topmost parts
        if ( jMap.IsClipMaskOn )
            context.restore();

        for( var il = 0; il< jMap.Layers.length; il++ ) {
            for( var k = 0; k < jMap.Layers[il].TopMostParts.length; k++ ){
                renderAction( context, jMap.Layers[il].TopMostParts[k], height);
            }
        }

        return _canvas;
    }    

	/**
	 * Render MetGS map
	 */
	return {
		render: function( url, width, height, fullLonLat, param ){
			return renderMap( url, width, height, fullLonLat, param );
		},

        getCanvas : function(){
            return _canvas;
        },

        getJsonMap : function(){
            return _jsonMap;
        }
	}

})();
