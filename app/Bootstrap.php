<?php
/**
 * @name Bootstrap
 * @author desktop-84f1l7e\sun
 * @desc 所有在Bootstrap类中, 以_init开头的方法, 都会被Yaf调用,
 * @see http://www.php.net/manual/en/class.yaf-bootstrap-abstract.php
 * 这些方法, 都接受一个参数:Yaf_Dispatcher $dispatcher
 * 调用的次序, 和申明的次序相同
 */
class Bootstrap extends Yaf_Bootstrap_Abstract {

    public function _initConfig() {
		//把配置保存起来
		$arrConfig = Yaf_Application::app()->getConfig();
		Yaf_Registry::set('config', $arrConfig);
	}

	public function _initPlugin(Yaf_Dispatcher $dispatcher) {
		//注册一个插件
		// $objSamplePlugin = new SamplePlugin();
		// $dispatcher->registerPlugin($objSamplePlugin);
		
		//－
        /*layout allows boilerplate HTML to live in /views/layout rather than every script*/
        $layout = new LayoutPlugin('layout.phtml');

        /* Store a reference in the registry so values can be set later.
         * This is a hack to make up for the lack of a getPlugin
         * method in the dispatcher.
         */
        Yaf_Registry::set('layout', $layout);

        /*add the plugin to the dispatcher*/
        $dispatcher->registerPlugin($layout);
	}

	public function _initRoute(Yaf_Dispatcher $dispatcher) {
		//在这里注册自己的路由协议,默认使用简单路由
	}
	
	public function _initView(Yaf_Dispatcher $dispatcher) {
		//在这里注册自己的view控制器，例如smarty,firekylin
	}
}
