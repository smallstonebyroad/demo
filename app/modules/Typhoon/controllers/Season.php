<?php

class SeasonController extends Yaf_Controller_Abstract
{
    public function gettyphoonmonthAction()
    {
        $month = $this->getRequest()->getPost('month');

        $dateStart = $this->getRequest()->getPost('start');
        $dateEnd = $this->getRequest()->getPost('end');

        $db = new MDatabase('typhoon');
        $db->connect();
        
        if ($month) {
            $data = $db->select("SELECT a.TyphoonID as id, a.ObserveTime  AS time,a.Lat AS lat,a.Lon AS lon, a.MaxSpeed AS speed, a.MoveSpeed AS ms,a.Power AS power,a.Strong AS strong,a.MoveDirection AS md,a.Pressure AS pressure,(CASE WHEN NameCN = '-' THEN NameEN ELSE NameCN END) AS name,b.LifeStart,b.LifeEnd FROM [dbo].[TyTrackFromSH] AS a INNER JOIN [dbo].[TyList] AS b ON a.TyphoonID = b.TyphoonID WHERE DATEPART(mm, LifeStart) = ? ", [$month]);
        } else {
            $data = $db->select('SELECT a.TyphoonID as id, a.ObserveTime  AS time,a.Lat AS lat,a.Lon AS lon, a.MaxSpeed AS speed, a.MoveSpeed AS ms, a.Power AS power,a.Strong AS strong,a.MoveDirection AS md,a.Pressure AS pressure,(CASE WHEN NameCN = \'-\' THEN NameEN ELSE NameCN END) AS name,b.LifeStart,b.LifeEnd FROM [dbo].[TyTrackFromSH] AS a INNER JOIN [dbo].[TyList] AS b ON a.TyphoonID = b.TyphoonID WHERE DATEPART(mm, LifeStart) BETWEEN ? AND  ?', [$dateStart,$dateEnd]);
        }
        

        $response = $this->getResponse();
        $response->setBody('data')->setBody(json_encode($data));

        return false;
    }
}