var CityDistancen = (function () {
    var earthR = 6378.137;  //地球半径

    var PI = Math.PI;

    var cities = [
        {city: '杭州', x: 120.154, y: 30.278},
        {city: '温州', x: 120.697, y: 27.990},
        {city: '台州', x: 121.423, y: 28.658},
        {city: '宁波', x: 121.543, y: 29.867},
        {city: '舟山', x: 122.204, y: 29.983},
        {city: '上海', x: 121.475, y: 31.233},
        {city: '南通', x: 120.896, y: 31.975},
        {city: '福州', x: 119.296, y: 26.071},
        {city: '茂名', x: 110.915, y: 21.653},
        {city: '漳州', x: 117.645, y: 24.518},
        {city: '宁德', x: 119.546, y: 26.666},
        {city: '深圳', x: 114.054, y: 22.540},
        {city: '厦门', x: 118.090, y: 24.476},
        {city: '东莞', x: 113.751, y: 23.015},
        {city: '泉州', x: 118.672, y: 24.871},
        // {city: '三亚', x: 109.509, y: 18.246},
        // {city: '广州', x: 113.257, y: 23.126},
        // {city: '花莲', x: 121.607, y: 23.956},
        // {city: '海口', x: 110.332, y: 20.021},
        // {city: '汕头', x: 116.680, y: 23.359},
        // {city: '宜兰', x: 121.750, y: 24.757},
        // {city: '珠海', x: 113.574, y: 22.265},
        // {city: '恒春', x: 120.745, y: 21.998},
        // {city: '台北', x: 121.560, y: 25.092},
        // {city: '湛江', x: 110.355, y: 21.264},
        // {city: '台东', x: 121.145, y: 22.751},
        // {city: '钓鱼岛', x: 123.472, y: 25.747}
    ];

    function getRad(d) {
        return d * PI / 180.0;
    }

    //根据经纬度计算两点之间的距离
    function getCityDistancen(startlat, startlon, endlat, endlon) {
        // var f = getRad((startlat + endlat) / 2);
        // var g = getRad((startlat - endlat) / 2);
        // var l = getRad((startlon - endlon) / 2);
        //
        // var sg = Math.sin(g);
        // var sl = Math.sin(l);
        // var sf = Math.sin(f);
        //
        // var s, c, w, r, d, h1, h2;
        // var a = earthR;
        // var fl = 1 / 298.257;
        //
        // sg = sg * sg;
        // sl = sl * sl;
        // sf = sf * sf;
        //
        // s = sg * (1 - sl) + (1 - sf) * sl;
        // c = (1 - sg) * (1 - sl) + sf * sl;
        //
        // w = Math.atan(Math.sqrt(s / c));
        // r = Math.sqrt(s * c) / w;
        // d = 2 * w * a;
        // h1 = (3 * r - 1) / 2 / c;
        // h2 = (3 * r + 1) / 2 / s;
        //
        // return d * (1 + fl * (h1 * sf * (1 - sg) - h2 * (1 - sf) * sg));

        radLat1 = getRad(startlat);
        radLat2 =getRad(endlat);
        a = radLat1 - radLat2;
        b = getRad(startlon) - getRad(endlon);
        s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a/2),2)+Math.cos(radLat1)*Math.cos(radLat2)*Math.pow(Math.sin(b/2),2)));
        s = s * earthR;

        return s;
    }

    return {
        Init: function () {

        },
        getCity: function () {
            return cities
        },
        //得到台风经纬度返回计算结果
        getDistancen: function (startlat, startlon) {
            var end = CityDistancen.getCity();
            var _result = [];

            for (var i = 0; i < end.length; i++) {
                var endlat = end[i].y;
                var endlon = end[i].x;
                var result = {
                    city: end[i].city,
                    rang: getCityDistancen(startlat, startlon, endlat, endlon)
                };
                _result.push(result);
            }
            return _result;

        },
        //生成table
        getTable: function (_result) {
            htmlStr = '<tr style="width: 100%;line-height: 22px">';

            for (var i = 0; i < _result.length; i++) {
                htmlStr += '<td style="width: calc(100% /6)">' + _result[i].city + '</td>\
                        <td style="width: calc(100% /6)">' + Math.ceil(_result[i].rang) + 'km</td>';

                if ((i + 1) % 3 === 0) {
                    htmlStr += '</tr><tr style="line-height: 22px ;width: 100%">'
                }

            }
            ;
            htmlStr += '</tr>';
            $('.typhoon-city-distance tbody').html(htmlStr);
        }

    }

})();
