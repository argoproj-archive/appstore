/**
 * Created by raynald on 6/13/14
 */

// Get search input from user and return matches from database

// create namespace for search functionality
spa.search = (function() {
    'use strict';
    //---------------- BEGIN MODULE SCOPE VARIABLES --------------
    var
        moduleName = '[search] ',
        configMap = {
            set_anchor : null
        },

        jqueryMap = { }, setJqueryMap, initModule, configModule,
        template_func = {},
        onSearchFocus, onSubmit, onPlayerListClick;

    //----------------- END MODULE SCOPE VARIABLES ---------------

    //--------------------- BEGIN DOM METHODS --------------------
    setJqueryMap = function() {
        jqueryMap = {
            $search : $('form.search'), // search form
            $search_input : $('#search'), // search input
            $db_results : $('.db-results'),
            $page_bar : $('.page-bar')
        }
    };

    //---------------------- END DOM METHODS ---------------------

    //------------------- BEGIN EVENT HANDLERS -------------------
    onSubmit = function(e) {
        var input;

        e.preventDefault();

        input = jqueryMap.$search_input.val();
        console.log(moduleName, 'onInput: input ->', input);

        if (input.length < 3) {
            jqueryMap.$search_input
                .val("Please enter at least three characters")
                .css({'color' :'orangered', fontSize: '90%'});
            return false;
        }

        // spa.shell will add entry to browser history and kick off DB request
        // to get search results
        configMap.set_anchor({
            url : '/search-list', data: input.trim()
        });

        return false;

    };

    // Just clear search box
    onSearchFocus = function(e) {
        e.preventDefault();
        jqueryMap.$search_input.val('').css({'color' :'black', fontSize:'100%'});
        return false;
    };

    // Get player profile and stats when player name is clicked
    onPlayerListClick = function(e) {
        var $elem, $tbody;

        e.preventDefault();

        $elem = $(e.target);
        $tbody = $elem.parents('tbody');

        if ($elem.is('a') && $tbody.hasClass('search-list-tbody')) {

            configMap.set_anchor({
                url : '/player-profile', data: $elem.text().trim()
            });
        }

    };

    //-------------------- END EVENT HANDLERS --------------------

    //------------------- BEGIN LOCAL METHODS --------------------

    // Display search results list
    function renderSearchList(data) {
        var html, Ht_feet, Ht_inches;

        // console.log('renderSearchResults ->', data);

        // do some massaging of data from server
        data.forEach(function(player, idx) {
            player.num = idx + 1;

            // fix date
            player.profile.Birthdate =
                new Date(player.profile.Y, player.profile.M - 1, player.profile.D).toLocaleDateString();
            // fix height
            Ht_feet = Math.floor((player.profile.Ht / 12));
            Ht_inches = player.profile.Ht % 12;
            player.profile.Ht = Ht_feet + "'" + Ht_inches + '"';

        });

        html = template_func['search-list'](data);
        jqueryMap.$page_bar.html('');
        jqueryMap.$db_results.html(html);
    }

    //------------------- END LOCAL METHODS ---------------------

    //------------------- BEGIN PUBLIC METHODS -------------------
    function getSearchList(map) {
        $.ajax({
            type: "GET",
            url: map.url,
            dataType: "json",
            data : {search : map.data},

            success: function(resp, status){
                console.log(moduleName, 'ajax success');
                renderSearchList(resp);
            }
        });
    }



    // Begin public method /configModule/
    // Purpose    : Configuration info from shell

    configModule = function (input_map ) {
        configMap.set_anchor = input_map.set_anchor;
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
            'search-list'
            ], template_func
        );

        // install handler - clear search box when it gains focus
        jqueryMap.$search_input.on('focus', onSearchFocus);

        // search form handler
        jqueryMap.$search.on('submit', onSubmit);

        jqueryMap.$db_results.on('click', onPlayerListClick);

        // End public method /initModule/
    };

    // return public methods
    return {
        configModule : configModule,
        initModule   : initModule,
        getSearchList : getSearchList
    };

}());
