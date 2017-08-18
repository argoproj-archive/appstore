/*
 * Pagination feature
*/
 /*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/

/*global $, spa */

spa.pagination = (function () {

    //---------------- BEGIN MODULE SCOPE VARIABLES --------------
    var
        moduleName = '[pagination] ',
        configMap = {
            set_anchor : null,
            html :
            '<div class="row">' +
              '<div class="col-md-8 col-md-offset-4">' +
               '<div class="large pagination">' +
                 '<a href="#" class="first" data-action="first">&laquo;</a>' +
                 '<a href="#" class="previous" data-action="previous">&lsaquo;</a>' +
                 '<input type="text" readonly="readonly" data-max-page="40" />' +
                 '<a href="#" class="next" data-action="next">&rsaquo;</a>' +
                 '<a href="#" class="last" data-action="last">&raquo;</a>' +
               '</div>' +
              '</div>' +
            '<div>'

        },

        stateMap  = {
            page_click_url : ''
        },

        jqueryMap = {};


    var setJqueryMap, configModule, initModule,
        onPageClick;

    //----------------- END MODULE SCOPE VARIABLES ---------------

    //------------------- BEGIN UTILITY METHODS ------------------

    //-------------------- END UTILITY METHODS -------------------

    //--------------------- BEGIN DOM METHODS --------------------
    // Begin DOM method /setJqueryMap/

    setJqueryMap = function () {
        jqueryMap = {
            $content : $('.content'),
            $page_bar : $('.page-bar')
        }
    };

    // End DOM method /setJqueryMap/

    //---------------------- END DOM METHODS ---------------------

    //------------------- BEGIN EVENT HANDLERS -------------------
    onPageClick = function(page) {
        var url = stateMap.page_click_url;

        configMap.set_anchor({url : url, init: 0, page : page, limit: 50});
        console.log(moduleName, 'onPageClick: page ->', page);
    };


    //-------------------- END EVENT HANDLERS --------------------
    
    //------------------- BEGIN LOCAL METHODS -------------------

    //------------------- END LOCAL METHODS ---------------------
      
    //------------------- BEGIN PUBLIC METHODS -------------------
    // Begin public method /configModule/

    configModule = function (input_map ) {
        configMap.set_anchor = input_map.set_anchor;
    };

    // End public method /configModule/

    // Begin public method /initModule/
    // Purpose    : Initializes module
    initModule = function () {
        setJqueryMap();
    };

    // End public method /initModule/

    // Append pagination bar to given container
    // (container is jquery object)
    // And init the jqpagination plugin
    function renderBar(container, current_page, max_page, url) {

        container.html(configMap.html);

        stateMap.page_click_url = url;
        console.log(moduleName,
            'renderBar: page_click_url ->', stateMap.page_click_url);

        // Init pagination plugin and bind event handler
        $('.pagination').jqPagination({
            current_page : current_page,
            max_page: max_page,
            page_string : '{current_page} of {max_page}',
            paged: onPageClick
        });
    }

    function setBarPage(current_page) {
        $('.pagination').jqPagination('option', 'current_page', current_page);
    }

    function handleBar(init, page, max_page, page_click_url) {
        var $page_bar;

        init = +init; // change to number

        if (init) { // when we initially render the player list
            renderBar(jqueryMap.$page_bar, 1, max_page, page_click_url);
        }

        // check page reload, back and forward button
        if (!init && page > 1) {
            // see if page bar is there
            $page_bar = jqueryMap.$content.find('.pagination');
            if ($page_bar.length > 0) {
                setBarPage(page);
            } else {
                renderBar(jqueryMap.$page_bar, page, max_page, page_click_url);
            }
        }
    }

    // return public methods
    return {
        configModule : configModule,
        initModule   : initModule,
        renderBar : renderBar,
        setBarPage : setBarPage,
        handleBar : handleBar
    };
  //------------------- END PUBLIC METHODS ---------------------
}());
