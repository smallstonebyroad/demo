$(function () {
    $('.defined-month').click(function () {
        $('.season-content-month').hide();
        $('.season-content-defined').show();
    });
    $('#return').click(function () {
        $('.season-content-month').show();
        $('.season-content-defined').hide();
    });

    $('.defined-month').hover(function () {
        var index = $('.defined-month img');
        if (index.attr('src') == '/Typhoon/images/defined-icon.png') {
            index.attr('src', '/Typhoon/images/defined-blue.png')
        } else {
            index.attr('src', '/Typhoon/images/defined-icon.png')
        }
    });

});
//月份加减
function ChangeMonth(obj, parm) {
    var index = parseInt($(obj).siblings().children().html());

    if (parm === 1) {
        index = (index >= 1 && index < 12) ? index + 1 : '12';
    } else {
        index = (index > 1 && index <= 12) ? index - 1 : '1';
    }
    $(obj).siblings().eq(0).html('<span>' + index + '月</span>');

     // $(obj).parent().siblings().children().eq(0).removeClass('active');
     // $(obj).parent().children().eq(0).addClass('active');

}