
/*
 * spa.player
 *
 * Module for accessing/rendering player information
*/
 /*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/

/*global $, spa */

spa.player = (function () {

    //---------------- BEGIN MODULE SCOPE VARIABLES --------------
    var
        moduleName = '[player] ',
        configMap = {
            set_anchor : null,
            render_page_bar : null
        },

        jqueryMap = {}, template_func = {};

    var
        setJqueryMap, initModule, configModule,
        onPlayersClick, onPlayerListClick,
        onHofClick;

    //----------------- END MODULE SCOPE VARIABLES ---------------

    //------------------- BEGIN UTILITY METHODS ------------------

    //-------------------- END UTILITY METHODS -------------------

    //--------------------- BEGIN DOM METHODS --------------------

    setJqueryMap = function () {
        jqueryMap = {
            $players : $('#players'), // attach click handler to this
            $db_results : $('.db-results'),
            $page_bar : $('.page-bar'),
            $player_list : $('.player-list'), // rendered by Handlebars template
            $hof : $('#hof')
        }
    };

    //---------------------- END DOM METHODS ---------------------

    //------------------- BEGIN EVENT HANDLERS -------------------
    onPlayersClick = function(e) {
        e.preventDefault();
        configMap.set_anchor({url : '/player-list', init: 1, page : 1, limit: 50});
        return false;
    };

    // Get player profile and stats when player name is clicked on
    // player or hall of fame list
    onPlayerListClick = function(e) {
        var $elem, $tbody;

        e.preventDefault();

        // console.log(moduleName, 'onPlayerListClick: target ->', e.target);

        $elem = $(e.target);
        $tbody = $elem.parents('tbody');
        // console.log(moduleName, 'onPlayerListClick: parent tbody->', $tbody);

        if (($elem.is('a') && $tbody.hasClass('player-list-tbody')) ||
            ($elem.is('a') && $tbody.hasClass('hof-list-tbody'))){

            configMap.set_anchor({
                url : '/player-profile', data: $elem.text().trim()
            });
        }

    };

    onHofClick = function(e) {
        e.preventDefault();
        configMap.set_anchor({url : '/hof-list', init: 1, page : 1, limit: 50});
        return false;
    };
    //-------------------- END EVENT HANDLERS --------------------

    //------------------- BEGIN LOCAL METHODS --------------------

    function renderPlayerProfile(data) {

        var html, player_prof;

        // console.log('renderPlayerProfile: data ->', data);

        html = template_func['player-profile-1'](data);

        jqueryMap.$page_bar.html('');
        jqueryMap.$db_results.html(html);

        player_prof = {player : data["playerID"], position: data["LAST_POS"]};

        // AJAX request to get player yearly stats
        $.ajax({
            type: "GET",
            url: "/player-stats",
            dataType: "json",
            data: player_prof,

            success: function(resp, status){
                // console.log('ajax success: response ->', resp);
                renderPlayerStats(player_prof, resp);
            }
        });

        // AJAX request to get player career stats
        $.ajax({
            type: "GET",
            url: "/player-career-stats",
            dataType: "json",
            data: player_prof,

            success: function(resp, status){
                // console.log('ajax success: response ->', resp);
                renderPlayerCareerStats(player_prof, resp);
            }
        });

    }

    function renderPlayerCareerStats(player_prof, data) {
        var html, $row, val, singles;

        console.log('renderPlayerStats: data ->', data);


        if (player_prof.position == "P") {

            // fix ERA and innings pitched
            val = data[0].ERA.toFixed(2);
            data[0].ERA = val;

            val = data[0].IP.toFixed(1);
            data[0].IP = val;

            html = template_func['player-career-pitching'](data);

        } else {
            // fix BA, OBP, SLG
            val = data[0].BA.toFixed(3).slice(1);
            data[0].BA = val;

            val = data[0].OBP.toFixed(3).slice(1);
            data[0].OBP = val;

            // For now calculate slugging percentage here on client side
            // Formula is : SLG = (1B + 2 × 2B + 3 × 3B + 4 × HR) / AB
            singles = data[0].H - data[0].HR - data[0]['3B'] - data[0]['2B'];

            val =
                (singles +  2 * data[0]['2B'] +
                    3 * data[0]['3B'] + 4 * data[0].HR)/data[0].AB;

            data[0].SLG = val.toFixed(3).slice(1);

            html = template_func['player-career-batting'](data);
        }

        // append to player-profile-row, there might be a race condition
        // with this as .player-profile-row div may not be in DOM yet.
        // for now it seems to work ok
        $row = jqueryMap.$db_results.find('.player-profile-row');
        $row.after(html);

    }

    function renderPlayerStats(player_prof, data) {
        var html;

        console.log('renderPlayerStats: data ->', data);

        // Do some massaging of the data
        // data: array containing yearly stats
        data.forEach(function(stat) {
            for (var key in stat) {
                if (stat.hasOwnProperty(key)) {
                    if (!stat[key]) {
                        stat[key] = 0;
                    }
                    if (key == 'ERA') {
                        stat['ERA'] = stat[key].toFixed(2);
                    }
                    if (key == 'IPouts') {
                        stat['IP'] = Math.floor((stat[key] / 3));
                    }
                    if (key == 'AB') {
                        stat['BA'] = (stat['H'] / stat[key]).toFixed(3).slice(1);
                    }
                }
            }
        });

        // console.log('renderPlayerStats: data ->', data);

        if (player_prof.position == "P") {
            html = template_func['player-pitching-stats'](data);
        } else {
            html = template_func['player-batting-stats'](data);
        }
        jqueryMap.$db_results.append(html);
    }

    function renderPlayerList(data, init, page, limit) {
        var Ht_feet, Ht_inches, html, max_page;

        // console.log(moduleName, 'renderPlayerList ->', init);

        // do some massaging of data from server
        data.forEach(function(player, idx) {
            player.num = ((page - 1) * limit) + idx + 1;

            // fix date
            player.profile.Birthdate =
                new Date(player.profile.Y, player.profile.M - 1, player.profile.D).toLocaleDateString();
            // fix height
            Ht_feet = Math.floor((player.profile.Ht / 12));
            Ht_inches = player.profile.Ht % 12;
            player.profile.Ht = Ht_feet + "'" + Ht_inches + '"';

        });

        // console.log(moduleName, 'renderPlayerList ->', data);

        html = template_func['player-list'](data);
        jqueryMap.$db_results.html(html);

        // 18354 = total number of players in database
        max_page = Math.ceil(18354 / limit);
        configMap.handle_page_bar(init, page, max_page, '/player-list' );
    }

    function renderHofList(data, init, page, limit) {
        var html, max_page;

        // console.log(moduleName, 'renderHofList ->', data);

        html = template_func['hall-of-fame-list'](data);
        jqueryMap.$db_results.html(html);

        // 306 = total hall of fame members
        max_page = Math.ceil(306 / limit);
        configMap.handle_page_bar(init, page, max_page, '/hof-list' );

    }

    //------------------- END LOCAL METHODS ---------------------

    //------------------- BEGIN PUBLIC METHODS -------------------
    function getPlayerProfile(map) {
         $.ajax({
             type: "GET",
             url: map.url,
             dataType: "json",
             data: {search : map.data}, // appended to URL as query string

             success: function(resp, status){
                 console.log(moduleName, 'ajax success');
                 renderPlayerProfile(resp);
             }
         });


    }

    function getPlayerList(map) {
        var page = map.page, limit = map.limit, init = map.init;
        console.log(moduleName,
            'getPlayerList -> init', init, 'page', page, 'limit', limit);

        $.ajax({
            type: "GET",
            url: map.url,
            dataType: "json",
            data : {page : page, limit : limit},

            success: function(resp, status){
                console.log(moduleName, 'ajax success');
                renderPlayerList(resp, init, page, limit);
            }
        });
    }

    function getHofList(map) {
        var page = map.page, limit = map.limit, init = map.init;
        console.log(moduleName,
            'getHofList -> init', init, 'page', page, 'limit', limit);

        $.ajax({
            type: "GET",
            url: map.url,
            dataType: "json",
            data : {page : page, limit : limit},

            success: function(resp, status){
                console.log(moduleName, 'ajax success');
                renderHofList(resp, init, page, limit);
            }
        });
    }

    // Begin public method /configModule/
    // Purpose    : Configuration info from shell
    configModule = function (input_map ) {
        configMap.set_anchor = input_map.set_anchor;
        configMap.render_page_bar = input_map.render_page_bar;
        configMap.handle_page_bar = input_map.handle_page_bar;
    };

    // End public method /configModule/

    // Begin public method /initModule/
    // Purpose    : Initializes module

    initModule = function () {
        setJqueryMap();

        // Load  Handlebars templates
        spa.util.getTemplates([
            'player-profile-1', 'player-batting-stats',
            'player-pitching-stats', 'player-list',
            'player-career-batting', 'player-career-pitching',
            'hall-of-fame-list'
            ], template_func
        );

        // Set up event handlers
        jqueryMap.$players.on('click', onPlayersClick);
        jqueryMap.$hof.on('click', onHofClick);

        jqueryMap.$db_results.on('click', onPlayerListClick);

    };

    // End public method /initModule/

    // return public methods
    return {
        configModule : configModule,
        initModule   : initModule,
        getPlayerProfile : getPlayerProfile,
        getPlayerList : getPlayerList,
        getHofList : getHofList
    };
  //------------------- END PUBLIC METHODS ---------------------
}());
