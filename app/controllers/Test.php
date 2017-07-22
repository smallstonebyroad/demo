<?php
/**
 * Created by PhpStorm.
 * User: sun
 * Date: 2017/7/3
 * Time: 10:07
 */
class TestController extends Yaf_Controller_Abstract
{
    public function oneAction()
    {
        echo 'Module=' . $this->getRequest()->getModuleName() . '<br>';
        echo 'action=' . $this->getRequest()->getActionName() . '<br>';
        echo '<hr>';
//        foreach($_SERVER as $k=>$v)
//            echo $k . '=' . $v . "<br>";
////        echo "Hello one action";
//        echo $this->getRequest()->getRequestUri();
//        return false;
    }

    function DB( $dbName = '' )
    {
        $config = Yaf_Application::app()->getConfig()['db'];
        //$=['database'];
//    var_dump($config);
        if ($dbName != ''){
            $config = $config[$dbName];
        }


        try{
//            echo   ;
//            return true;
            $driver = $config['driver'];
            $server = $config['server'];
            $username = $config['username'];
            $password = $config['password'];
            $database = $config['database'];

            $dns = "{$driver}:Server={$server};Database={$database};";
            echo $dns;
//        $db = new PDO( "sqlsrv:Server=172.21.129.92;Database=zjszdzdb;", "awsuer", '12345');
        $db = new PDO( $dns, $username, $password);
//            $this->_db = new PDO( "{$driver}:Server={$server};Database={$database}", $username, $password);
//            $this->clearError();
            return true;
        }
        catch (PDOException $e)
        {
//            $this->setError($e->getMessage());
            return false;
        }

//        return $db;
    }

    public  function testAction()
    {
        $db = new MDatabase('local');
        if ( !$db->connect() ){
            echo "Connect to db error" . $db->getMessage() . "<br>";
        }

        $n = $db->insert("delete from test where name=?",['a']);
        echo $n;

        return false;
    }

    public function dbAction()
    {
        $db = new MDatabase('aws92');
        if ( !$db->connect() ){
            echo "Connect error" . $db->getMessage();
            return fasle;
        }
        $result = $db->select("select IIIii, StationName from tab_StationInfo where province=? and IIIii < ?", ['浙江', '58700']);
        foreach( $result as $row){
            echo $row[0] . "-" . $row['StationName'] . "<br>";
        }
        // var_dump($result);

        return false;
//        try {
//            $dbName = "sqlsrv:Server=c.metgs.com,4092;Database=zjszdzdb;";
//            $dbUser = "awsuser";
//            $dbPassword = "12345";
//            $db = new PDO($dbName, $dbUser, $dbPassword);
//            if ($db)
//            {
//                $sql = "Select IIiii, StationName from tab_StationInfo where IIiii='58457'";
//                $stat = $db->query($sql);
//                foreach( $stat as $row ){
//                    echo $row['IIiii'] . '-' . $row['StationName'] . '<br>';
//                }
//                echo "database connect succeed.<br />";
//            }
//        }
//        catch (PDOException $e)
//        {
//            $content = iconv("UTF-8","gbk",$e->getMessage());
//            echo   $content . "<br />";
//        }
//        return FALSE;
        $config = Yaf_Application::app()->getConfig()['db'];
        $dbName = 'aws92';
        //$=['database'];
//    var_dump($config);
        if ($dbName != ''){
            $config = $config[$dbName];
        }


        try{
//            echo   ;
//            return true;
            $driver = $config['driver'];
            $server = $config['server'];
            $username = $config['username'];
            $password = $config['password'];
            $database = $config['database'];

            var_dump($username);
            $dns = "{$driver}:Server={$server};Database={$database};";

            $dbName = "sqlsrv:Server=c.metgs.com,4092;Database=zjszdzdb;";
            $dbUser = "awsuser";
            $dbPassword = "12345";
//            $db = new PDO($dbName, $dbUser, $dbPassword);

            $db = new PDO( $dns, $username, $password);
//            if ($db)
//            {
//                $sql = "Select IIiii, StationName from tab_StationInfo where IIiii='58457'";
//                $stat = $db->query($sql);
//                foreach( $stat as $row ){
//                    echo $row['IIiii'] . '-' . $row['StationName'] . '<br>';
//                }
//                echo "database connect succeed.<br />";
//            }
//

//            echo $dns;

            return true;
        }
        catch (PDOException $e)
        {
//            $this->setError($e->getMessage());
            return false;
        }


//
//        try{
//            $driver = "sqlsrv";
//            $server = "c.metgs.com,4092";
//            $database = "zjszdzdb";
//            $username = "awsuser";
//            $password = "12345";
//
//            $dns = "{$driver}:Server={$server};Database={$database};";
//            $abcd = new PDO( $dns, $username, $password);
//            return false;
//        }
//        catch (PDOException $e)
//        {
//            $this->setError($e->getMessage());
//            return false;
//        }




//        var_dump($result);
        return FALSE;
    }
}