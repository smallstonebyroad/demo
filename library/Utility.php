<?php
/**
 * Created by PhpStorm.
 * User: sun
 * Date: 2017/6/27
 * Time: 8:28
 */

class Utility
{
    /**
     * 构建模块的绝对地址URL,
     * 规则如下：
     *    （+）对于全局模块(Index模块)， 在根目录下的 ./ ./目录中
     *    （+）对于非全局模块， 在模块根目录下的 ./modules/name/ ./modules/name/目录中
     *
     * xjc@metgs.com 2017-07-05
     *
     * @param $assetPath 模块的URL，不包含最后一个"/"号
     */
    public static function getModuleUrl($file = null)
    {
        $script = $_SERVER['SCRIPT_NAME'];
        $module = Yaf_Application::app()->getDispatcher()->getRequest()->getModuleName();

        if ( strtoupper($module) == 'INDEX' )
            echo substr($script, 0, strrpos($script, '/')) . $file;
        else
            echo substr($script, 0, strrpos($script, '/')) . '/' . $module . '/' . $file;
    }
}