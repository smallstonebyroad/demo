<?php
/**
 * Created by PhpStorm.
 * User: sun
 * Date: 2017/6/26
 * Time: 16:29
 */


class LayoutPlugin extends Yaf_Plugin_Abstract {

    private $_layoutDir;
    private $_layoutFile;
    private $_layoutVars = array();

    public function __construct($layoutFile, $layoutDir=null){
        $this->_layoutFile = $layoutFile;  
        $this->_layoutDir = ($layoutDir) ? $layoutDir : Yaf_Application::app()->getConfig()->application->directory;
    }

    public function  __set($name, $value) {
        $this->_layoutVars[$name] = $value;
    }

    public function dispatchLoopShutdown ( Yaf_Request_Abstract $request , Yaf_Response_Abstract $response ){

    }

    public function dispatchLoopStartup ( Yaf_Request_Abstract $request , Yaf_Response_Abstract $response ){

    }

    public function postDispatch ( Yaf_Request_Abstract $request , Yaf_Response_Abstract $response ){
        if ( $request->isXmlHttpRequest() )
            return;
        // get the body of the response
        $body = $response->getBody();

        // clear existing response
        $response->clearBody();
        
        // load layout.phtml by each different module
        $module = $request->getModuleName();
        $this->_layoutDir = $this->_layoutDir . ($module !== 'Index' ? '/modules/' . $module : '') . '/views';

        // wrap it in the layout
        $layout = new Yaf_View_Simple($this->_layoutDir);
        // $layout->content = $body;
        $layout->assign('layout', $this->_layoutVars);

        //-- Parse template
        $offset = 0;

        while ( true ){
            $n = preg_match('/@section\(\'([\w]+)\'\)(.*?)@endsection/s', $body, $matches, PREG_OFFSET_CAPTURE, $offset);
            $count = count($matches);

            if ( $n > 0 && $count == 3 ){

                $layout->assign($matches[1][0], $matches[2][0]);

                $offset = $matches[2][1] + strlen($matches[2][0]);
                continue;
            }

            break;

        }

        // set the response to use the wrapped version of the content
        $response->setBody($layout->render($this->_layoutFile));

    }

    public function preDispatch ( Yaf_Request_Abstract $request , Yaf_Response_Abstract $response ){

    }

    public function preResponse ( Yaf_Request_Abstract $request , Yaf_Response_Abstract $response ){

    }

    public function routerShutdown ( Yaf_Request_Abstract $request , Yaf_Response_Abstract $response ){

    }

    public function routerStartup ( Yaf_Request_Abstract $request , Yaf_Response_Abstract $response ){

    }
}