
/*
 * spa.shell.js
 *
 * Handles:
 *  - Module initialization and coordination
 *  - Browser history management
 *  - About and Contact pages
*/
 /*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/

/*global $, spa */

spa.shell = (function () {

    //---------------- BEGIN MODULE SCOPE VARIABLES --------------
    var
        moduleName = '[shell] ',
        configMap = {
            anchor_schema_map : {},
            about_html :
              '<div id="about-content">Data source credit: ' +
                '<a href="http://www.seanlahman.com" id="lahman">The Lahman Baseball Database</a>' +
                '<p>Email <a href="mailto:raynaldmo@gmail.com" id="mail">raynaldmo@gmail.com</a>' +
                ' &copy; 2014 mlb-db.com</p>' +
              '</div>'
        },
        stateMap  = {
            anchor_map : null
        },
        jqueryMap = {

        };

    var setJqueryMap, configModule, initModule,
        changeAnchorPart, copyAnchorMap,
        onHashchange, decodeAnchorMap, showAboutContent,
        onLinkClick;

    //----------------- END MODULE SCOPE VARIABLES ---------------

    //------------------- BEGIN UTILITY METHODS ------------------
    // Returns copy of stored anchor map; minimizes overhead
    copyAnchorMap = function () {
        return $.extend( true, {}, stateMap.anchor_map );
    };


    //-------------------- END UTILITY METHODS -------------------

    //--------------------- BEGIN DOM METHODS --------------------
    // Begin DOM method /setJqueryMap/

    setJqueryMap = function () {
        jqueryMap = {
            $body : $('body'),
            $about : $('#about'),
            $about_content : $('#about-content'),
            $db_results : $('.db-results'),
            $page_bar : $('.page-bar')
        }
    };

    // End DOM method /setJqueryMap/

    // Begin DOM method /changeAnchorPart/
    // Purpose    : Changes part of the URI anchor component
    // Arguments  :
    //   * arg_map - The map describing what part of the URI anchor
    //     we want changed.
    // Returns    :
    //   * true  - the Anchor portion of the URI was updated
    //   * false - the Anchor portion of the URI could not be updated
    // Actions    :
    //   The current anchor rep stored in stateMap.anchor_map.
    //   See uriAnchor for a discussion of encoding.
    //   This method
    //     * Creates a copy of this map using copyAnchorMap().
    //     * Modifies the key-values using arg_map.
    //     * Manages the distinction between independent
    //       and dependent values in the encoding.
    //     * Attempts to change the URI using uriAnchor.
    //     * Returns true on success, and false on failure.
    //
    changeAnchorPart = function ( arg_map ) {
        var
            anchor_map_revise = copyAnchorMap(),
            bool_return       = true,
            key_name, key_name_dep;

        // Begin merge changes into anchor map
        KEYVAL:
            for ( key_name in arg_map ) {
                if ( arg_map.hasOwnProperty( key_name ) ) {
                    // skip dependent keys during iteration
                    if ( key_name.indexOf( '_' ) === 0 ) { continue KEYVAL; }

                    // update independent key value
                    anchor_map_revise[key_name] = arg_map[key_name];

                    // update matching dependent key
                    key_name_dep = '_' + key_name;
                    if ( arg_map[key_name_dep] ) {
                        anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
                    }
                    else {
                        delete anchor_map_revise[key_name_dep];
                        delete anchor_map_revise['_s' + key_name_dep];
                    }
                }
            }
        // End merge changes into anchor map

        // Begin attempt to update URI; revert if not successful
        try {
            // For this app, no need to merge anchor setting
            // $.uriAnchor.setAnchor( anchor_map_revise );
            $.uriAnchor.setAnchor( arg_map );
        }
        catch ( error ) {
            // replace URI with existing state
            $.uriAnchor.setAnchor( stateMap.anchor_map,null,true );
            bool_return = false;
        }
        // End attempt to update URI...

        return bool_return;
    };
    // End DOM method /changeAnchorPart/
    //---------------------- END DOM METHODS ---------------------

    //------------------- BEGIN EVENT HANDLERS -------------------
    // example: onClickButton = ...


    //-------------------- END EVENT HANDLERS --------------------
    showAboutContent = function(e) {
        e.preventDefault();

        jqueryMap.$page_bar.html('');

        jqueryMap.$db_results.html(configMap.about_html);
        return false;
    };

    // Begin Event handler /onHashchange/
    // Purpose    : Handles the hashchange event
    // Actions    :
    //   * Parses the URI anchor component
    //   * Compares proposed application state with current
    //   * Adjust the application only where proposed state
    //     differs from existing and is allowed by anchor schema
    // Note:
    // All HTML5 compliant browsers support hashchange event
    // (this support is not inherent to the uriAnchor library)
    onHashchange = function ( event ) {
        var
            anchor_map_proposed,
            is_ok = true,
            anchor_map_previous = copyAnchorMap();

        console.log(moduleName, 'onHashchange', document.location.href);

        // attempt to parse anchor
        try { anchor_map_proposed = $.uriAnchor.makeAnchorMap(); }
        catch ( error ) {
            $.uriAnchor.setAnchor( anchor_map_previous, null, true );
            return;
        }
        stateMap.anchor_map = anchor_map_proposed;

        console.log(moduleName, 'onHashchange',
            'anchor_map ->', stateMap.anchor_map);

        if ( stateMap.anchor_map) { // make sure it was set at least once
            if ( JSON.stringify(anchor_map_previous) !=
                JSON.stringify(anchor_map_proposed)) {
                decodeAnchorMap(stateMap.anchor_map);
            }
        }

    };
    // End Event handler /onHashchange

    // Handle link clicks on about page itself
    // Probably a complicated way to do this!
    onLinkClick = function(e) {
        var $elem;

        e.preventDefault();

        console.log(moduleName, 'onLinkClick: target ->', e.target);

        $elem = $(e.target);

        if ($elem.is('a') && ($elem.attr('id') == 'lahman')){
            window.open('http://www.seanlahman.com');
        }
        if ($elem.is('a') && ($elem.attr('id') == 'mail')){
            window.location.href = 'mailto:raynaldmo@gmail.com';
        }
    };

    //------------------- BEGIN LOCAL METHODS -------------------
    // These next two functions are for future use
    function showSplashBackground() {
        console.log(moduleName, 'showSplashBackground');
        jqueryMap.$body.css({backgroundImage : './images/splash-1024.jpg'});
    }

    function showPageBackground() {
        console.log(moduleName, 'showPageBackground');
        jqueryMap.$body.css("background-image" , 'images/halftone.png');
    }

    // decode anchor/fragment-part/hashtag of URI and based on results
    // call API to recreate page (application state)
    decodeAnchorMap = function(map) {
        if ($.isEmptyObject(map)) {
            window.location.reload(true);
            // showSplashBackground();
            return;
        }
        // showPageBackground();

        if (map.url == '/player-profile') {
            spa.player.getPlayerProfile(map);
        } else if (map.url == '/player-list') {
            spa.player.getPlayerList(map);
        } else if (map.url == '/search-list') {
            spa.search.getSearchList(map);
        } else if (map.url == '/hof-list') {
            spa.player.getHofList(map);
        } else if (map.url == '/franchise-list') {
            spa.team.getFranchiseList(map);
        } else if (map.url == '/team-list') {
            spa.team.getTeamList(map);
        }  else if (map.url == '/team-profile') {
            spa.team.getTeamProfile(map);
        }
    };

    //------------------- END LOCAL METHODS ---------------------
      
    //------------------- BEGIN PUBLIC METHODS -------------------
    // Begin public method /configModule/
    // Purpose    : Adjust configuration of allowed keys

    configModule = function (input_map ) {

    };

    // End public method /configModule/

    // Begin public method /initModule/
    // Purpose    : Initializes module

    initModule = function () {
        var device, mobile_device;

        // Detect if mobile device. May not be the best way to do this
        device = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;

        mobile_device = device.test(navigator.userAgent);

        setJqueryMap();

        // configure uriAnchor to use our schema
        // TODO
        // $.uriAnchor.configModule({
        //    schema_map : configMap.anchor_schema_map
        //});

        // configure and initialize feature modules
        if (!mobile_device) {
            // Auto-complete search
            spa.autoc_search.initModule();
            spa.autoc_search.configModule({
                set_anchor : changeAnchorPart
            });
        } else {
            // display search list
            spa.search.initModule();
            spa.search.configModule({
                set_anchor : changeAnchorPart
            });
        }

        spa.pagination.configModule({
            set_anchor : changeAnchorPart
        });

        spa.pagination.initModule();

        spa.player.configModule({
            set_anchor : changeAnchorPart,
            render_page_bar: spa.pagination.renderBar,
            handle_page_bar : spa.pagination.handleBar,
            set_page_bar_page : spa.pagination.setBarPage
        });
        spa.player.initModule();

        spa.team.configModule({
            set_anchor : changeAnchorPart,
            set_page_bar_page : spa.pagination.setBarPage
        });
        spa.team.initModule();

        // Handle click for about page
        jqueryMap.$about.on('click', showAboutContent);

        // Need this to handle link (<a>) clicks on about page itself
        // TODO: Investigate easier/cleaner way to do this
        jqueryMap.$db_results.on('click', onLinkClick);

        // Handle URI anchor change events.
        // This is done /after/ all feature modules are configured
        // and initialized, otherwise they will not be ready to handle
        // the trigger event, which is used to ensure the anchor
        // is considered on-load
        //
        $(window)
            .bind( 'hashchange', onHashchange )
            .trigger( 'hashchange' );
    };

    // End public method /initModule/

    // return public methods
    return {
        configModule : configModule,
        initModule   : initModule
    };
  //------------------- END PUBLIC METHODS ---------------------
}());
