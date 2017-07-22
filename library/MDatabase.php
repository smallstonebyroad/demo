<?php
/**
 * 简单的PHP PDO封装类。
 * 不过度封装的目的是，简单原生高效，要求使用者熟练掌握 PDO/PDOStatement类
 *
 * 调用过程如下：
 *   （1） $db = new MDatabase()
 *   （2） $db->connect() [此项可选，如不执行，使用构造函数中配置项自动连接]
 *   （3） $db->select()/insert()/update()/delete()/execute()
 * User: sun
 * Date: 2017/7/3 Time: 10:47
 */
class MDatabase
{
    /**
     * MDatabase constructor.
     * @param string $dbConfigName yaf配置项中数据库信息节点名，不提供的时候使用默认数据库配置
     *
     * 配置约定如下：
     *  （+）关于数据库的配置以db.开头
     *  （+）中间的数据库配置名为可选项，不提供则为数据库全局配置，提供则可以同时配置多个数据库
     *  （+）每个数据库包含4个子节点,
     *     （－）db.[dbName].driver    PDO支持的驱动名称，如sqlsrv/mysql
     *     （－）db.[dbName].server    数据库服务器IP或域名
     *     （－）db.[dbName].username  数据库用户名
     *     （－）db.[dbName].password  数据库密码
     *     （－）db.[dbName].database  需要连接的数据库名称
     *     （－）db.[dbName].database  需要连接的数据库名称
     */
    public function __construct( $dbConfigName = '' )
    {
        /// -- Try using default database config
        $config = Yaf_Application::app()->getConfig()['db'];
        if ( $config != NULL ) {
            if ($dbConfigName != '') {
                $config = $config[$dbConfigName];
            }
            $this->_driver = $config['driver'];
            $this->_server = $config['server'];
            $this->_username = $config['username'];
            $this->_password = $config['password'];
            $this->_database = $config['database'];
        }
    }

    /**
     * 执行数据库连接。如果不提供任何参数，则使用构造函数中匹配到的配置项参数连接。
     * @param $driver
     * @param $server
     * @param $username
     * @param $password
     * @param $database
     * @param string $charset
     */
    public function connect( $driver = null, $server = null, $username = null, $password=null, $database=null, $charset = 'utf8' )
    {
        // close old connection
        $this->close();

        if ( $driver == null ) {
            $driver = $this->_driver;
            $server = $this->_server;
            $username = $this->_username;
            $password = $this->_password;
            $database = $this->_database;
        }

        //-- Connect to database
        try{
            $this->_db = new PDO("{$driver}:Server={$server};" . ($database != null ? "Database={$database}" : ""), $username, $password);
            $this->clearError();
            return true;
        }
        catch (PDOException $e) {
            $this->_lastSql = "[DNS]={$this->_driver}:Server={$this->_server}, [USER]={$username}, [PASSWORD]={$password}";
            $this->setError($e->getMessage());
            return false;
        }
    }

    /**
     * 关闭数据库连接。 一般无需执行，PDO会自动释放资源
     */
    public function close()
    {
        $this->_db = null;
    }

    /**
     * 执行查询操作
     * @param string $sql 要执行的SQL语句
     * @param array $bindings   使用?参数符时，提供的参数绑定数组
     * @return 如果执行成功，则返回PDOStatement对像，否则返回false
     */
    public function select($sql, $bindings = array())
    {
        return $this->execute($sql, $bindings) === true ? $this->_stmt->fetchAll(PDO::FETCH_ASSOC) : false;
    }

    /**
     * 执行删除操作
     * @param string $sql 要执行的SQL语句
     * @param array $bindings   使用?参数符时，提供的参数绑定数组
     * @return 如果执行成功，则返回影响的行数，否则返回false
     */
    public function delete($sql, $bindings = array())
    {
        if ( $this->execute($sql, $bindings) === false ){
            $errorInfo = $this->_stmt->errorInfo();
            $this->setError($errorInfo[2]);
            return false;
        }
        return $this->_stmt->rowCount();
    }

    /**
     * 执行更新操作
     * @param string $sql 要执行的SQL语句
     * @param array $bindings   使用?参数符时，提供的参数绑定数组
     * @return 如果执行成功，则返回影响的行数，否则返回false
     */
    public function update($sql, $bindings = array())
    {
        if ( $this->execute($sql, $bindings) === false ){
            $errorInfo = $this->_stmt->errorInfo();
            $this->setError($errorInfo[2]);
            return false;
        }
        return $this->_stmt->rowCount();
    }

    /**
     * 执行操入操作
     * @param string $sql 要执行的SQL语句
     * @param array $bindings   使用?参数符时，提供的参数绑定数组
     * @return 如果执行成功，则返回影响的行数，否则返回false
     */
    public function insert($sql, $bindings = array())
    {
        $ret = $this->execute($sql, $bindings);
        if ( $ret === false ){
            $errorInfo = $this->_stmt->errorInfo();
            $this->setError($errorInfo[2]);
            return false;
        }
        return $this->_stmt->rowCount();
    }

    /**
     * 执行通用的SQL命令
     * @param string $sql 要执行的SQL语句
     * @param array $bindings   使用?参数符时，提供的参数绑定数组
     * @return 如果执行成功，则返回影响的行数，否则返回false
     */
    public function execute($sql, $bindings = array())
    {
        //-- If not connect yet, do coonection
        if ( ! $this->checkConnection() )
            return false;

        //-- Save sql string and do execution
        $this->_lastSql = $sql;
        $this->_stmt = $this->_db->prepare($sql);

        $n = count($bindings);
        for( $i = 1; $i <= $n; $i++ ){
            $this->_stmt->bindValue( $i, $bindings[$i-1] );
        }

        return $this->_stmt->execute();
    }

    public function getPDO(){
        //-- If not connect yet, do coonection
        if ( ! $this->checkConnection() )
            return null;

        return $this->_db;
    }

    public function getPDOStatement(){
        //-- If not connect yet, do coonection
        if ( ! $this->checkConnection() )
            return null;

        return $this->_stmt;
    }

    /**
     * 获取错误信息
     * @return mixed
     */
    public function getMessage()
    {
        return $this->_message;
    }

    //=====================以下为私有函数和私有对像====================/

    /// 检查连接状态，如果没有连接，执行连接
    public function checkConnection(){
        if ( $this->_db === null )
            return $this->connect();

        return true;
    }

    /// 设置错误信息
    private function setError( $errorMessage )
    {
        $this->_hasError = true;
        $this->_message = $errorMessage;

        if ( $this->_isExceptionEnabled )
            throw new Exception("Exception occur in MDatabase : <br>" . $errorMessage . '<br> SQL executed is : ' . $this->_lastSql);
    }

    /// 清除错误信息
    private function clearError()
    {
        $this->_hasError = false;
        $this->_message = '';
    }

    /// PDO object
    private $_db = null;

    /// PDOStatement object
    private $_stmt;

    private $_message;

    private $_hasError;

    /// When error occur, throw exception or keep silent
    private $_isExceptionEnabled = true;

    /// Parameters used by PDO
    private $_driver, $_server, $_username, $_password, $_database;

    /// Last sql string executed.
    private $_lastSql;
}
