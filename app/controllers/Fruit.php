<?php
use MetGS\GN as MG;
/**
 * Fruit controller
 * @author xjc@metgs.com 2017-06-25
 */
class FruitController extends Yaf_Controller_Abstract {

	public function indexAction($name = "Stranger") {
	    echo "Hello Fruit";
//		//1. fetch query
//		$get = $this->getRequest()->getQuery("get", "default value");
//
//		//2. fetch model
//		$model = new SampleModel();
//
//		//3. assign
//		$this->getView()->assign("content", $model->selectSample());
//		$this->getView()->assign("name", $name);

		//4. render by Yaf, 如果这里返回FALSE, Yaf将不会调用自动视图引擎Render模板
        return FALSE;
	}

	public function ecmwfAction()
    {
        $this->getView()->assign("model", "ECMWF");
        return TRUE;
    }

    public function debugAction()
    {
        $app = Yaf_Application::app();
        $a = $app->getModules();
        var_dump($a);
        return FALSE;
    }

    private function getParam($param, $key, $default = null)
    {
        return array_key_exists($key,$param) ? $param[$key] : $default;
    }

    private function getVarTitle( $varItem ){
        $titles = [
            'h'=>'高度场',
            'slp'=>'海平面气压',
            'u,v'=>'风场'
        ];

        return $titles[$varItem['name']];
    }

    private function getLayerCaption($source, $dtInitCST, $fh, $level, $varTitle)
    {
        $dtFcst = (new DateTime($dtInitCST->format('Y-m-d H:i:s')))->add(new DateInterval('PT' . $fh . 'H'));
        return $source . '_' . $dtInitCST->format('y年m月d日H时 预报') . $dtFcst->format('y年m月d日H时(+') .
            sprintf('%03d', $fh) . 'h)' . ( $level < 0 ? "" : ($level . 'hPa') ) . $varTitle;
    }

    private function getFruitNcFile($source, $dtInitCST, $fh)
    {
        $modelConfig = [
            'ECMWF'=>['dir'=>'nc_ecf', 'prefix'=>'ecfine'],
            'JMA'=>['dir'=>'nc_jmaf', 'prefix'=>'jmafine'],
            'NCEP'=>['dir'=>'nc_gfs', 'prefix'=>'gfs'],
            'GRAPES'=>['dir'=>'nc_grapes', 'prefix'=>'grapes']
        ];

        $dtInit = (new DateTime($dtInitCST->format('Y-m-d H:i:s')))->sub(new DateInterval('PT8H'));
        $dtFcst = (new DateTime($dtInit->format('Y-m-d H:i:s')))->add(new DateInterval('PT' . $fh . 'H'));

//        echo $dtFcst->format('Y-m-d H:i:s') . '-' .$dtInit->format('Y-m-d H:i:s');
        $fruitPath = "S:/Data/fruit";
//        $fruitPath = "P:";

        $ncFile = $fruitPath . "/" . $modelConfig[$source]['dir'] . '/' . $dtInit->format('Y.m/YmdH/') .
                $modelConfig[$source]['prefix'] . '.I' . $dtInit->format('YmdH.') .sprintf('%03d.F', $fh) . $dtFcst->format('YmdH') . '.nc';

        return $ncFile;
    }

    public function parseParam( $input )
    {
        $param = new \stdClass();

        // var_dump($input);

        //-- Parse parameters
        $param->width = $this->getParam($input, 'width',1000);
        $param->height = $this->getParam($input, 'height', 800);

        $extent = $this->getParam($input, 'fullLonLat', null);

        $param->xMin = $extent == null ? 100 : $extent[0];
        $param->xMax = $extent == null ? 110 : $extent[1];
        $param->yMin = $extent == null ? 30 : $extent[2];
        $param->yMax = $extent == null ? 35 : $extent[3];

        $param->varList = $this->getParam($input, 'varList',null);

        //-- in format 'yyyymmddHHMM'
        $param->dtInit = DateTime::createFromFormat('YmdH',$this->getParam($input, 'dtInit', '2017062220'));
        $param->fh = $this->getParam($input, 'fh', 24);
        //$param->level = $this->getParam($input, 'level', 500);
        $param->source = $this->getParam($input, 'source', 'ECMWF');

        $param->dx = 0.5;//( $xMax - $xMin ) * 0.1;
        $param->dy = 0.5;//( $yMax - $yMin ) * 0.1;

        return $param;
    }

    /**
     * 自动设置等值线属性
     * @param $layer
     * @param $param
     * @param $varIndex
     */
    public function setContourProp($layer, $varItem)
    {
        $classArray = explode('\\',get_class($layer));
//        echo $classArray[count($classArray)-1] ;

        if ( $classArray == FALSE || $classArray[count($classArray)-1] != 'MLayerGrid' )
            return false;

        if ( $varItem['name'] == 'h' ){
            $levDef = ['1000'=>[2.5,1000],'925'=>[2.5,100],'850'=>[4,152],'700'=>[4,316],'500'=>[4,588],'200'=>[4,1240],'100'=>[4,1600]];
            $key = sprintf('%2.0d',$varItem['level']);
            if ( key_exists($key, $levDef) ){
                $layer->setContLevelInterval($levDef[$key][0]);
                $layer->setContLevelPassingThrough($levDef[$key][1]);
            }
            $layer->setContLineStyle(1, '(0,0,255)');
        }
    }

    public function addLayer($map, $reader, $varItem, $param)
    {
        //var_dump($varItem);
//        echo "<hr>";
//        echo 'json=='.json_encode($varItem);

        $level = $varItem['level'] ;

        $reader->setDim(MG_NcDimX, $param->xMin - $param->dx, $param->xMax + $param->dx, $level > 0 ? 'lonP' : 'lonS');
        $reader->setDim(MG_NcDimY, $param->yMin - $param->dy, $param->yMax + $param->dy, $level > 0 ? 'latP' : 'latS');
        $reader->setDim(MG_NcDimT, $param->fh);
        if ( $level > 0)
            $reader->setDim(MG_NcDimZ, $level, 'lev');

        $varNames = explode(',', $varItem['name']);
        $grid = count($varNames) == 2 ? $reader->readVar($varNames[0], $varNames[1]) : $reader->readVar($varNames[0]);

        if ( $grid->isEmpty() )
        {
            //echo "读取netcdf中变量失败：" . $ncFile . "\n<br>";
            echo "读取netcdf中变量失败：\n<br>";
            return;
        }

        //-- Vector layer
        if ( count($varNames) == 2 ){
            $layer = new MG\MLayerVector();
            $layer->setName("Layer_Vector_" . $varItem['name']);
            $layer->setCaption($this->getLayerCaption($param->source, $param->dtInit, $param->fh, $varItem['level'], $this->getVarTitle($varItem)));
            $layer->setData($grid);
            $this->setSkipGrid($layer);
            $map->addLayer($layer);
        }
        else{
            $layer = new MG\MLayerGrid();
            $layer->setName("Layer_Grid_" . $varItem['name']);
            $layer->setCaption($this->getLayerCaption($param->source, $param->dtInit, $param->fh, $varItem['level'], $this->getVarTitle($varItem)));
            $layer->setData($grid);
            $layer->setContFillsOn(false);
            $layer->setContLinesOn(true);
            $layer->setContLabelsOn(true);
            $layer->setSkipGridsOn(true);
            $layer->setOpacity(0.2);

            $this->setContourProp($layer,$varItem);
//    $layer->setSkipGridForContourOn(true);
//    $layer->setGridValueShown(true);
//    $layer->setGridValueShownFormat("%2.0f");
////    $layer->setContLevel([580]);
            $this->setSkipGrid($layer);
            $map->addLayer($layer);

//            echo 'name=Layer_Grid_' . $varItem['name'] . '<br>';
//            echo $this->getLayerCaption($param->source, $param->dtInit, $param->fh, $varItem['level'], $this->getVarTitle($varItem)) . '<hr>';
        }
    }

    function setSkipGrid($layer)
    {
        //-- 数据跳点设置
        $skipGrid = [
            [0, 3, 1, 1], [3, 6, 2, 1],[6, 9, 4, 2],[9, 12, 6, 3],[12, 999, 8, 4]
        ];
        $nSkipGrid = count($skipGrid);

        $layer->setSkipGridsOn(true);
        for( $i = 0; $i < $nSkipGrid; $i++ ) {
            $layer->addSkipGridSetting($skipGrid[$i][0],$skipGrid[$i][1],$skipGrid[$i][2],$skipGrid[$i][3]);
        }
    }

    public function jsonAction() {
        session_start();

        $param = $this->parseParam($this->getRequest()->isGet() ? $_GET : $_POST );

        // var_dump($param);

        if ($param->varList == null || count($param->varList) < 1 ){
            return FALSE;;
        }

        //-- Create map
        $map = new MG\MMap(session_id());
        $map->setMapProjection(MG_MapProj_WebMercator);

        $map->setClientRect($param->width, $param->height );
        $map->setMapExtent( $param->xMin, $param->xMax, $param->yMin , $param->yMax );
        //$map->setClipMaskOnDataLayer(true);
        $map->setGridLineOn(false);

        //-- Read variables and add layer to map
        $reader = new \NcReaderEx();

        //-- 读取nc文件
//        $ncFile = "S:/Data/fruit/nc_ecf/2016.08/2016080812/ecfine.I2016080812.009.F2016080912.nc";
        $ncFile = $this->getFruitNcFile($param->source, $param->dtInit, $param->fh);
        $ret = $reader->setFile( $ncFile );

        if ( !$ret )
        {
            echo "读取netcdf文件失败：" . $ncFile . "\n<br>";
            return false;
        }

        $grid = 0;

        $nLayer = count($param->varList);
        for( $i = 0; $i < $nLayer; $i++ ){
            $this->addLayer($map, $reader, $param->varList[$i], $param);
        }

        //-- 图层加载完成后，绘制地图
        $map->render();

//        return FALSE;

//        echo $map->getJson();
//        return FALSE;

        //-- 获取地图JSON经ZIP压缩后的二进制流
        $json = $map->getZippedJson();
        header("Content-Type: image/png");
        header("Content-Length: " . strlen($json));
        echo $json;

        //4. render by Yaf, 如果这里返回FALSE, Yaf将不会调用自动视图引擎Render模板
        return FALSE;
    }


}
