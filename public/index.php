<?php

define('APPLICATION_PATH', dirname(__FILE__) . "/..");

$application = new Yaf_Application( APPLICATION_PATH . "/config/application.ini");

$application->bootstrap()->run();
?>
