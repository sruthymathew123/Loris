<?php
require_once 'NDB_Form.class.inc';
require_once 'CouchDB.class.inc';

class NDB_Form_dataquery extends NDB_Form
{
    function _hasAccess()
    {
        // create user object
        $user =& User::singleton();

        // check user permissions
        return $user->hasPermission('dataquery_view');
    }

    function dataquery()
    {
        $user = User::singleton();
        $username = $user->getUsername();
        $couch = CouchDB::singleton();

        $update = $couch->queryView(
            "DQG-2.0",
            "runlog",
            array(
             "reduce" => "false",
             "limit" => "1",
             "descending" => "true"
            )
        );
        $this->tpl_data['updatetime'] = $update[0]['key'];

        $categories = $couch->queryView(
            "DQG-2.0",
            "datadictionary",
            array(
             "reduce" => "true",
             "group_level" => "1"
            )
        );

        $cat_tpl = array();
        foreach($categories as $row) {
            if ($row['value']) {
                $cat_tpl[$row['key'][0]] = $row['value'];
            } else {
                $cat_tpl[$row['key'][0]] = -1;
            }
        }
        $this->tpl_data['categories'] = $cat_tpl;

        $usersaved = $couch->queryView(
            "DQG-2.0",
            "savedqueries",
            array(
             "key" => "\"$username\"",
             "reduce" => "false",
            )
        );


        $globalsaved = $couch->queryView(
            "DQG-2.0",
            "savedqueries",
            array(
             "key" => "\"global\"",
             "reduce" => "false",
            )
        );

        $IDMapCallback = function($row) {
            return $row['id'];
        };

        $usersavedNames = array_map($IDMapCallback, $usersaved);
        $globalsavedNames = array_map($IDMapCallback, $globalsaved);

        $this->tpl_data['savedqueries'] = array(
            'user'   => $usersavedNames,
            'shared' => $globalsavedNames
        );
        $sessionResults = $couch->queryView(
            "DQG-2.0",
            "sessions",
            array(
                "reduce" => "true",
                "group" => "true",
            )
        );
        $this->tpl_data['visits'] = Utility::getExistingVisitLabels();

        $sessions = array_map(function($element) { return $element['key']; }, $sessionResults);

        $this->tpl_data['sessions'] = $sessions;
    }

    /**
     * Include the column formatter required to display the feedback link colours
     * in the candidate_list menu
     *
     * @return array of javascript to be inserted
     */
    function getJSDependencies()
    {
        $factory = NDB_Factory::singleton();
        $baseURL = $factory->settings()->getBaseURL();
        $deps    = parent::getJSDependencies();
        return array_merge(
            $deps,
            array(
             $baseURL . "/dataquery/js/arrayintersect.js",
             $baseURL . "/dataquery/js/react.fieldselector.js",
             $baseURL . "/dataquery/js/react.filterBuilder.js",
             $baseURL . "/dataquery/js/react.tabs.js",
             $baseURL . "/dataquery/js/react.sidebar.js",
             $baseURL . "/dataquery/js/react.app.js",
             $baseURL . "/dataquery/js/jstat.js",
             $baseURL . "/js/components/StaticDataTable.js",
             $baseURL . "/js/flot/jquery.flot.min.js",
             $baseURL . '/js/components/PaginationLinks.js',
             $baseURL . "/js/jszip/jszip.min.js",
             $baseURL . "/js/components/MultiSelectDropdown.js"
            )
        );
    }

    /**
     * Include additional CSS files:
     *  1. dataquery.css
     *
     * @return array of javascript to be inserted
     */
    function getCSSDependencies()
    {
        $factory = NDB_Factory::singleton();
        $baseURL = $factory->settings()->getBaseURL();
        $deps    = parent::getCSSDependencies();
        return array_merge(
            $deps,
            array(
             $baseURL . "/dataquery/css/dataquery.css",
            )
        );
    }
}
