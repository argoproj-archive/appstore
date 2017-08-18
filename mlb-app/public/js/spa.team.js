
/*
 * spa.team
 *
 * Module for accessing/rendering team and franchise information
 */
/*jslint         browser : true, continue : true,
 devel  : true, indent  : 2,    maxerr   : 50,
 newcap : true, nomen   : true, plusplus : true,
 regexp : true, sloppy  : true, vars     : false,
 white  : true
 */

/*global $, spa */

spa.team = (function () {

    //---------------- BEGIN MODULE SCOPE VARIABLES --------------
    var
        moduleName = '[team] ',
        configMap = {
            set_anchor : null,
            render_page_bar : null
        },
        stateMap  = {

        },
        jqueryMap = {

        },
        template_func = {};

    var
        setJqueryMap, initModule, configModule,
        onTeamsClick, onTeamListClick,
        onFranchisesClick, onFranchiseListClick;

    //----------------- END MODULE SCOPE VARIABLES ---------------

    //------------------- BEGIN UTILITY METHODS ------------------

    //-------------------- END UTILITY METHODS -------------------

    //--------------------- BEGIN DOM METHODS --------------------

    setJqueryMap = function () {
        jqueryMap = {
            $teams : $('#teams'),
            $franchises : $('#franchises'),
            $team_list : $('.team-list'), // rendered by Handlebars template
            $franchise_list : $('.franchise-list'), // rendered by Handlebars template
            $db_results : $('.db-results'),
            $page_bar : $('.page-bar')
        }
    };

    //---------------------- END DOM METHODS ---------------------

    //------------------- BEGIN EVENT HANDLERS -------------------
    onTeamsClick = function(e) {
        e.preventDefault();
        configMap.set_anchor({url : '/team-list'});
        return false;
    };

    onFranchisesClick = function(e) {
        e.preventDefault();
        configMap.set_anchor({url : '/franchise-list'});
        return false;
    };

    onTeamListClick = function(e) {
        var $elem, $tbody, id;

        e.preventDefault();

        console.log(moduleName, 'onTeamListClick: target ->', e.target);


        $elem = $(e.target);

        $tbody = $elem.parents('tbody');
        console.log(moduleName, 'onTeamListClick: parent tbody ->', $tbody);

        if ($elem.is('a') && $tbody.hasClass('team-list-tbody')){
            // Need to grab team Id text
            id = $elem.parent().next().text();

            console.log(moduleName,
                'onTeamListClick: team ID ->', id);

            configMap.set_anchor({
                url : '/team-profile', name: $elem.text(), id : id
            });
        }
    };

    onFranchiseListClick = function(e) {
        var $elem, $tbody, id;

        e.preventDefault();

        console.log(moduleName, 'onFranchiseListClick: target ->', e.target);


        $elem = $(e.target);

        $tbody = $elem.parents('tbody');
        console.log(moduleName, 'onFranchiseListClick: parent tbody ->', $tbody);

        if ($elem.is('a') && $tbody.hasClass('franchise-list-tbody')){

            id = $elem.text();

            console.log(moduleName,
                'onFranchiseListClick: team ID ->', id);

            configMap.set_anchor({
                url : '/team-profile', name: "", id : id
            });
        }
    };

    //-------------------- END EVENT HANDLERS --------------------

    //------------------- BEGIN LOCAL METHODS --------------------
    function renderFranchiseList(data) {
        var  html, name;

        // We can sort array using desired key in object!
        data.sort(function (a, b) {
            if (a.Name > b.Name)
                return 1;
            if (a.Name < b.Name)
                return -1;
            // a must be equal to b
            return 0;
        });

        // console.log(moduleName, 'renderFranchiseList ->', data);
        // do more massaging of data
        data.forEach(function(franchise, idx) {
            franchise.num = idx + 1;
            // franchise.Teams = franchise.Teams.join(', ');
            franchise.team1 = franchise.Teams[0];
            franchise.team2 = franchise.Teams[1];
            franchise.team3 = franchise.Teams[2];
        });

        html = template_func['franchise-list'](data);
        jqueryMap.$page_bar.html('');
        jqueryMap.$db_results.html(html);

    }

    function renderTeamList(data, init, page, limit) {
        var  html;

        // console.log(moduleName, 'renderTeamList ->', data);

        html = template_func['team-list'](data);
        jqueryMap.$page_bar.html('');
        jqueryMap.$db_results.html(html);
    }

    function renderTeamYearlyStats(data) {
        var  html;

        data.forEach(function(year, idx) {
            year.num = idx + 1;
        });

        html = template_func['team-year-stats'](data);

        jqueryMap.$db_results.append(html);
    }

    function renderTeamTotalStats(data) {
        var  html;

        // console.log(moduleName, 'renderTeamTotalStats ->', data);

        html = template_func['team-total-stats-1'](data);

        jqueryMap.$db_results.find('.team-profile-row').after(html);
    }

    function renderTeamProfile(data) {
        var  html;
        console.log(moduleName, 'renderTeamProfile ->', data);

        if (data.parks.length > 1) {
            data.parks = data.parks.join(', ');
        }

        html = template_func['team-profile'](data);
        jqueryMap.$page_bar.html('');
        jqueryMap.$db_results.html(html);

        // AJAX request to get team yearly stats
        $.ajax({
            type: "GET",
            url: "/team-year-stats",
            cache : true,
            dataType: "json",
            data: {name: data['name'], id : data['teamID']},

            success: function(resp, status){
                // console.log('ajax success: response ->', resp);
                renderTeamYearlyStats(resp);
            }
        });

        // AJAX request to get team total stats
        $.ajax({
            type: "GET",
            url: "/team-total-stats",
            cache : true,
            dataType: "json",
            data: {name: data['name'], id : data['teamID']},

            success: function(resp, status){
                // console.log('ajax success: response ->', resp);
                renderTeamTotalStats(resp);
            }
        });


    }

    //------------------- END LOCAL METHODS ---------------------



    //------------------- BEGIN PUBLIC METHODS -------------------
    function getFranchiseList(map) {

        $.ajax({
            type: "GET",
            url: map.url,
            cache : true,
            dataType: "json",

            success: function(resp, status){
                console.log(moduleName, 'ajax success');
                renderFranchiseList(resp);
            }
        });
    }

    function getTeamList(map) {
        var page = map.page, limit = map.limit, init = map.init;
        console.log(moduleName,
            'getTeamList -> init', init, 'page', page, 'limit', limit);

        $.ajax({
            type: "GET",
            url: map.url,
            cache : true,
            dataType: "json",
            data : {page : page, limit : limit},

            success: function(resp, status){
                console.log(moduleName, 'ajax success');
                renderTeamList(resp, init, page, limit);
            }
        });
    }

    function getTeamProfile(map) {
        $.ajax({
            type: "GET",
            url: map.url,
            cache : true,
            dataType: "json",

            // appended to URL as query string
            data: {name : map.name, id : map.id},

            success: function(resp, status){
                console.log('ajax success: response ->', resp);
                renderTeamProfile(resp);
            }
        });
    }

    // Begin public method /configModule/
    // Purpose    : Configuration info from shell
    configModule = function (input_map ) {
        configMap.set_anchor = input_map.set_anchor;
        configMap.render_page_bar = input_map.render_page_bar;
    };

    // End public method /configModule/

    // Begin public method /initModule/
    // Purpose    : Initializes module
    // Returns    : true
    // Throws     : none

    initModule = function () {
        setJqueryMap();

        // Load  Handlebars templates
        spa.util.getTemplates([
            'franchise-list', 'team-list', 'team-profile',
            'team-year-stats', 'team-total-stats-1'
            ], template_func
        );

        // Set up event handlers
        jqueryMap.$franchises.on('click', onFranchisesClick);
        jqueryMap.$teams.on('click', onTeamsClick);

        jqueryMap.$db_results
            .on('click', onTeamListClick)
            .on('click', onFranchiseListClick);
    };

    // End public method /initModule/

    // return public methods
    return {
        configModule : configModule,
        initModule   : initModule,
        getFranchiseList : getFranchiseList,
        getTeamList : getTeamList,
        getTeamProfile : getTeamProfile
    };
    //------------------- END PUBLIC METHODS ---------------------
}());
