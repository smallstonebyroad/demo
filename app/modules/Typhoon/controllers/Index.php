<?php
/**
 * @name IndexController
 * @author lh
 * @desc 默认控制器
 */
class IndexController extends Yaf_Controller_Abstract
{
	public function indexAction()
	{
		$db = new MDatabase('typhoon');
		$db->connect();
		$data = $db->select('SELECT year FROM (SELECT SUBSTRING(cast(TyphoonID AS VARCHAR(6)), 0 ,5) AS year FROM [dbo].[TyList]) temp GROUP BY year ORDER BY year DESC');
		$this->getView()->assign("years", $data);
       	return TRUE;
	}

	public function gettyphoonbyyearAction()
	{
		$year = $this->getRequest()->getPost('year');
		$start = $year . '00'; 
		$end = $year . '99';
		$db = new MDatabase('typhoon');
		$db->connect();
		$data = $db->select("SELECT a.TyphoonID AS id, a.ObserveTime AS time, a.Lat AS lat, a.Lon AS lon, a.MaxSpeed AS speed, a.MoveSpeed AS ms, a.Power AS power, a.Strong AS strong, a.MoveDirection AS md, a.Pressure AS pressure,
			(CASE WHEN NameCN = '-' THEN NameEN ELSE NameCN END) AS name, b.LifeStart, b.LifeEnd 
			FROM [dbo].[TyTrackFromSH] AS a INNER JOIN [dbo].[TyList] AS b ON a.TyphoonID = b.TyphoonID
			WHERE a.TyphoonID > ? AND a.TyphoonID <= ? ORDER BY a.TyphoonID DESC", [(int)$start, (int)$end]);

		$response = $this->getResponse();
		$response->setBody('data')->setBody(json_encode($data));

		return FALSE;
	}

	public function gettyphoonbysearchcontentAction()
	{
		$content = $this->getRequest()->getPost('content');
		$numeric = is_numeric($content);
		$db = new MDatabase('typhoon');
		$db->connect();
		if ($numeric) {
			$data = $db->select("SELECT a.TyphoonID AS id, a.ObserveTime AS time, a.Lat AS lat, a.Lon AS lon, a.MaxSpeed AS speed, a.MoveSpeed AS ms, a.Power AS power, a.Strong AS strong, a.MoveDirection AS md, a.Pressure AS pressure,
			(CASE WHEN NameCN = '-' THEN NameEN ELSE NameCN END) AS name, b.LifeStart, b.LifeEnd 
			FROM [dbo].[TyTrackFromSH] AS a INNER JOIN [dbo].[TyList] AS b ON a.TyphoonID = b.TyphoonID
			WHERE b.TyphoonID = ?", [$content]);
		} else {
			$data = $db->select("SELECT a.TyphoonID AS id, a.ObserveTime AS time, a.Lat AS lat, a.Lon AS lon, a.MaxSpeed AS speed, a.MoveSpeed AS ms, a.Power AS power, a.Strong AS strong, a.MoveDirection AS md, a.Pressure AS pressure,
			(CASE WHEN NameCN = '-' THEN NameEN ELSE NameCN END) AS name, b.LifeStart, b.LifeEnd 
			FROM [dbo].[TyTrackFromSH] AS a INNER JOIN [dbo].[TyList] AS b ON a.TyphoonID = b.TyphoonID
			WHERE b.NameCN = ? OR b.NameEN = ?", [$content, $content]);
		}

		$response = $this->getResponse();
		$response->setBody('data')->setBody(json_encode($data));

		return FALSE;
	}

	public function gettyphoonbypathshapeAction()
	{
		$filter = $this->getRequest()->getPost('filter');
		$polygonFilter = $this->getRequest()->getPost('polygonFilter');
		$lineFilter = $this->getRequest()->getPost('lineFilter');
		$maxNumber = $this->getRequest()->getPost('maxNumber');

		$declareVarStr = '';
        $setVarStr = '';
        $makeValidStr = '';
    
        $areaMaxNumber = (int)$maxNumber;

        switch ($filter) {
            case 'LineString':
                for ($i = 0; $i < count($lineFilter); $i++)
                {
                    $lineString = 'LINESTRING('. $lineFilter[$i][0][0] . ' ' . $lineFilter[$i][0][1] . ', ' . $lineFilter[$i][1][0] . ' ' . $lineFilter[$i][1][1] . ')';
                    $declareVarStr .= " DECLARE @typhoon" . $i . " geometry ";
                    $setVarStr .= " SET @typhoon" . $i . " = geometry::STGeomFromText('" . $lineString . "', 4326)";
                    $makeValidStr .= " AND t.Geo.MakeValid().STIntersects(" . "@typhoon" . $i . ") = 1";
                }
                break;
            default:
                $polygonString = $polygonFilter;
                $declareVarStr .= " DECLARE @typhoon geometry ";
                $setVarStr .= " SET @typhoon = geometry::STGeomFromText('" . $polygonString . "', 4326)";
                $makeValidStr .= " AND t.Geo.MakeValid().STCrosses(" . "@typhoon) = 1";
                break;
        }

        $sql = $declareVarStr . " " . $setVarStr . " SELECT TOP $areaMaxNumber t.TyphoonID FROM TyTrackFromSH AS t INNER JOIN TyList AS l ON l.TyphoonID = t.TyphoonID WHERE t.TyphoonID IN (SELECT TyphoonID FROM [dbo].[TyGeometry] t WHERE 1 = 1 " . $makeValidStr . ") GROUP BY t.TyphoonID ORDER BY t.TyphoonID DESC ";

        $db = new MDatabase('typhoon');
		$db->connect();
        $id = $db->select($sql);

        $idCount = count($id);
        if ($idCount === 0) {
            $data = [];
        } else {
            $ids = '(';
            for ($i = 0; $i < count($id); $i++) { 
                $ids .= $id[$i]['TyphoonID'] . ($i === count($id) - 1 ? ')' : ',');
            }

            $sql = "SELECT a.TyphoonID AS id, a.ObserveTime AS time, a.Lat AS lat, a.Lon AS lon, a.MaxSpeed AS speed, a.MoveSpeed AS ms, a.Power AS power, a.Strong AS strong, a.MoveDirection AS md, a.Pressure AS pressure,
			(CASE WHEN NameCN = '-' THEN NameEN ELSE NameCN END) AS name, b.LifeStart, b.LifeEnd 
			FROM [dbo].[TyTrackFromSH] AS a INNER JOIN [dbo].[TyList] AS b ON a.TyphoonID = b.TyphoonID
			WHERE a.TyphoonID IN $ids ORDER BY a.TyphoonID DESC";

            $data = $db->select($sql);
        }

		$response = $this->getResponse();
		$response->setBody('data')->setBody(json_encode($data));

		return FALSE;
	}

	public function getsimilarpathbyidAction()
	{
		$specifyID = $this->getRequest()->getPost('id');
		$maxNumber = $this->getRequest()->getPost('maxNumber');
		$distance = $this->getRequest()->getPost('maxDistance');

		$db = new MDatabase('typhoon');
		$db->connect();
		session_start();
		if (!isset($_SESSION['typhoon'])) {
			$_SESSION['typhoon'] = $db->select('SELECT TyphoonID, Lat, Lon FROM [dbo].[TyTrackFromSH]');
		}

		$typhoons = $_SESSION['typhoon'];
        $typhoonGroupById = [];
        foreach ($typhoons as $typhoon) {
            $typhoonGroupById[$typhoon['TyphoonID']][] = [(float)$typhoon['Lon'], (float)$typhoon['Lat']];
        }

        $specifyTyphoon = $typhoonGroupById[$specifyID];

        $firstLatLon = '';
        $specifyTyphoonLength = count($specifyTyphoon) - 1;
        for ($i = $specifyTyphoonLength; $i >= 0 ; $i--) { 
            $firstLatLon .= $specifyTyphoon[$i][0] . ' ' . $specifyTyphoon[$i][1] . ',';
        }

        $length = count($specifyTyphoon);
        $specifyTyphoonFirstPT = $specifyTyphoon[$length - 1];
        $specifyTyphoonLastPT = $specifyTyphoon[0];

        $tempTable = 'SET NOCOUNT ON;DECLARE @ploy table (id varchar(15), geo geometry);';
        $finallyStrList = $tempTable;

        $querybuild = ' ';
        foreach ($typhoonGroupById as $id => $typhoon) {
            if ($id != $specifyID) {
                $geometrySQL = 'DECLARE @' . $specifyID . '_' . $id . ' geometry; SET @' . $specifyID . '_' . $id . ' = geometry::STPolyFromText(\'POLYGON((';

                $geometrySQL = $geometrySQL . $firstLatLon;
                if (count($typhoon) < 2)
                    continue;

                $curTyLastPt = $typhoon[0];
                $curTyFirstPt = $typhoon[count($typhoon) - 1];
                $distanceHead = (pow($curTyFirstPt[0] - $specifyTyphoonFirstPT[0], 2) + pow($curTyFirstPt[1] - $specifyTyphoonFirstPT[1], 2));
                $distanceTail = (pow($curTyLastPt[0] - $specifyTyphoonLastPT[0], 2) + pow($curTyLastPt[1] - $specifyTyphoonLastPT[1], 2));

                if ($distanceTail > ($distance * $distance))
                    continue;

                foreach ($typhoon as $xy) {
                    $geometrySQL = $geometrySQL . $xy[0] . ' ' . $xy[1] . ',';
                }

                $geometrySQL = $geometrySQL . $specifyTyphoonFirstPT[0] . ' ' . $specifyTyphoonFirstPT[1] . '))\', 4326);';

                $geometrySQL = $geometrySQL . " insert into @ploy values ('" . $specifyID . "_" . $id . "', @" . $specifyID . "_" . $id . ");";
                $querybuild .= $geometrySQL;
            }
        }
        $finallyStrList = $finallyStrList . $querybuild . 'SELECT TOP ' . $maxNumber . ' id, geo.MakeValid().STArea() g FROM @ploy ORDER BY g ASC;';
        $data = $db->select($finallyStrList);

        $ids = '(' . $specifyID;
        for ($i = 0; $i < count($data); $i ++) { 
        	$typhoonID = explode('_', $data[$i]['id']);
            $ids .= ',' . $typhoonID[1];
        }
        $ids .= ')';
        $sql = "SELECT a.TyphoonID AS id, a.ObserveTime AS time, a.Lat AS lat, a.Lon AS lon, a.MaxSpeed AS speed, a.MoveSpeed AS ms, a.Power AS power, a.Strong AS strong, a.MoveDirection AS md, a.Pressure AS pressure,
			(CASE WHEN NameCN = '-' THEN NameEN ELSE NameCN END) AS name, b.LifeStart, b.LifeEnd 
			FROM [dbo].[TyTrackFromSH] AS a INNER JOIN [dbo].[TyList] AS b ON a.TyphoonID = b.TyphoonID
			WHERE a.TyphoonID IN $ids";

        $data = $db->select($sql);

        $response = $this->getResponse();
		$response->setBody('data')->setBody(json_encode($data));

		return FALSE;
	}

	public function gettyphoonbywindlevelAction()
	{	
		$min = (float)$this->getRequest()->getPost('min');
		$max = (float)$this->getRequest()->getPost('max');

		$db = new MDatabase('typhoon');
		$db->connect();
		$data = $db->select("SELECT a.TyphoonID AS id, a.ObserveTime AS time, a.Lat AS lat, a.Lon AS lon, a.MaxSpeed AS speed, a.MoveSpeed AS ms, a.Power AS power, a.Strong AS strong, a.MoveDirection AS md, a.Pressure AS pressure,
			(CASE WHEN NameCN = '-' THEN NameEN ELSE NameCN END) AS name, b.LifeStart, b.LifeEnd 
			FROM [dbo].[TyTrackFromSH] AS a INNER JOIN [dbo].[TyList] AS b ON a.TyphoonID = b.TyphoonID
			WHERE a.TyphoonID IN (SELECT TyphoonID FROM (SELECT TyphoonID, MAX(MaxSpeed) AS MaxSpeed FROM [dbo].[TyTrackFromSH] GROUP BY TyphoonID) q1 WHERE MaxSpeed >= $min AND MaxSpeed < $max)");

		$response = $this->getResponse();
		$response->setBody('data')->setBody(json_encode($data));

		return FALSE;
	}

	public function gettyphoonbypressureAction()
	{
		$min = (float)$this->getRequest()->getPost('min');
		$max = (float)$this->getRequest()->getPost('max');

		$db = new MDatabase('typhoon');
		$db->connect();
		$data = $db->select("SELECT a.TyphoonID AS id, a.ObserveTime AS time, a.Lat AS lat, a.Lon AS lon, a.MaxSpeed AS speed, a.MoveSpeed AS ms, a.Power AS power, a.Strong AS strong, a.MoveDirection AS md, a.Pressure AS pressure,
			(CASE WHEN NameCN = '-' THEN NameEN ELSE NameCN END) AS name, b.LifeStart, b.LifeEnd 
			FROM [dbo].[TyTrackFromSH] AS a INNER JOIN [dbo].[TyList] AS b ON a.TyphoonID = b.TyphoonID
			WHERE a.TyphoonID IN (SELECT TyphoonID FROM (SELECT TyphoonID, MIN(Pressure) AS Pressure FROM [dbo].[TyTrackFromSH] GROUP BY TyphoonID) q1 WHERE Pressure >= $min AND Pressure < $max)");

		$response = $this->getResponse();
		$response->setBody('data')->setBody(json_encode($data));

		return FALSE;
	}

}
