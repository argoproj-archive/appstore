/**
 * Created by raynald on 5/19/14.
 */

// Auto-complete search implementation.
// Adapted from "Pro JavaScript Techniques", Chapter 12,
// John Resig, Publisher Apress, 2006

// create namespace for search functionality
spa.autoc_search = (function() {
    'use strict';
    //---------------- BEGIN MODULE SCOPE VARIABLES --------------
    var
        moduleName = '[auto-search] ',
        configMap = {
            set_anchor : null
        },
        stateMap  = {

        },
        jqueryMap = {

        };
    var setJqueryMap, initModule, configModule;

    var
        onInput, onSearchFocus,
    // currently selected DOM element in search popup box
        curPos;

    //----------------- END MODULE SCOPE VARIABLES ---------------

    //--------------------- BEGIN DOM METHODS --------------------
    setJqueryMap = function() {
        jqueryMap = {
            $search : $('#search'),    // search text box
            $search_results : $('#search-results') // search results
        }
    };

    //---------------------- END DOM METHODS ---------------------

    //------------------- BEGIN EVENT HANDLERS -------------------

    // Watch for key input in search box
    onInput = function(e) {

        console.log('keydown handler: key', e.keyCode);
        console.log('curPos:', curPos);

        var $li = jqueryMap.$search_results.find('li'), elem;

        // If the [TAB] or [Enter] keys are pressed
        if ( e.keyCode == 9 || e.keyCode == 13 ) {
            if (curPos) {
                addSelection(curPos);
                console.log('onInput: retrieve selection from db server');
            }
            // Stop the key from doing its normal action
            e.preventDefault();
            // return false;

            // If the up key is pressed
        } else if ( e.keyCode == 38 ) {
            // Select the previous entry, or the last entry
            // (if we're at the beginning)
            console.log('keyup: currPos ->', curPos);
            elem = $(curPos).prev()[0];
            return updatePos( elem || $li[ $li.length - 1 ] );
        }
        // If the down key is pressed
        else if ( e.keyCode == 40 ) {
            // Select the next entry, or the first entry (if we're at the end)
            console.log('keydown: currPos ->', curPos);
            elem = $(curPos).next()[0];
            return updatePos( elem || $li[0] );
        }
    };

    onSearchFocus = function() {
        var position, offset;
        jqueryMap.$search.val('');

        // position search pop-up
        // 1. find position of search input box
        position = jqueryMap.$search.position();
        offset = jqueryMap.$search.offset();

        // console.log('onSearchFocus: position top ->', position.top,
        //    ' left ->', position.left);

        // console.log('onSearchFocus: offset top ->', offset.top,
        //    ' left ->', offset.left);

        // 2. position popup box
        jqueryMap.$search_results.css({ position: 'absolute',
            top:offset.top + 43, left : offset.left
        });

        // jqueryMap.$search_results.show();
    };
    //-------------------- END EVENT HANDLERS --------------------

    //------------------- BEGIN LOCAL METHODS --------------------
    // Add selection to search box
    // elem is currently selected DOM element is search popup box
    function addSelection( elem ) {
        // The text value of the text input
        console.log('addSelection: elem ->', elem);

        jqueryMap.$search.val($(elem).html());

        // Prevents opt.open() from sending un-needed player-search
        // request
        jqueryMap.$search.blur();

        // Hide popup box results
        jqueryMap.$search_results.hide();

        // Tell spa.shell we've selected a player profile to display
        // shell will add entry to browser history and kick off DB request
        // to get player profile
        configMap.set_anchor({
            url : '/player-profile', data: jqueryMap.$search.val()
        });

    }

    // On search box input change, call open method to send AJAX request
    // to server
    function delayedInput(opt) {
        // The amount of time (in ms) to wait before looking for new user input
        opt.time = opt.time || 400;

        // The minimum number of characters to wait for, before firing a request
        opt.chars = opt.chars != null ? opt.chars : 3;

        // The callback to fire when the results popup should be opened,
        // and possibly when a new request should be made
        opt.open = opt.open || function(){};

        // The callback to execute when the results popup should be closed
        opt.close = opt.close || function(){};

        // Should the focus of the field be taken into account, for
        // opening/closing the results popup
        opt.focus = opt.focus !== null ? opt.focus : false;

        // Remember the original value that we're starting with
        var old = opt.elem.val();

        // And the current open/close state of the results popup
        var state = false;

        // Check to see if there's been a change in the input,
        // at a given interval
        setInterval(function(){
            // Only check for user input if search box input is in focus
            if (opt.elem.is(':focus')) {
                // The new input value
                var newValue = opt.elem.val();

                // The number of characters that's been entered
                var len = newValue.length;

                // Quickly check to see if the value has changed since the last
                // time that we checked the input
                // console.log('check input: old=',old, ' new=',newValue,' len=',len);

                if ( old != newValue ) {
                    // If not enough characters have been entered, and the 'popup'
                    // is currently open
                    if ( len < opt.chars && state ) {
                        // Close the display
                        console.log('opt.close()');
                        opt.close();

                        // And remember that it's closed
                        state = false;

                        // Otherwise, if the minimum number of characters have
                        // been entered
                        // as long as its more than one character
                    } else if ( len >= opt.chars && len > 0 ) {
                        // Open the results popup with the current value
                        console.log('opt.open()');
                        opt.open(newValue, state);

                        // Remember that the popup is current open
                        state = true;
                    }
                    // Save the current value for later
                    old = newValue;
                }
            }
        }, opt.time );

        // If we're also checking for user focus (to handle opening/closing)
        // the results popup
        if ( opt.focus ) {
            // Watch for when the user moves away from the input
            opt.elem.blur(function(){
                console.log('delay.js -> blur');
                // If its currently open
                if ( state ) {
                    // Close the popup
                    opt.close();

                    // And remember that its closed
                    state = false;
                }
            });

            // Watch for when the user focus' back on the popup
            opt.elem.focus(function(){
                console.log('delay.js -> focus');
                // If it has a value, and its currently closed
                if ( this.value.length != 0 && !state ) {
                    // Re-open the popup - but with a blank value
                    // (this lets the 'open' function know not to re-retrieve
                    // new results from the server, just re-open the popup).
                    opt.open( '', state );

                    // And remember that the popup is open
                    state = true;
                }
            });
        }
    } // delayedInput

    // Change the highlight of the result that's currently selected
    function updatePos( elem ) {

        // Update the position to the currently selected element
        curPos = elem; // elem is DOM element
        console.log('updatePos: curPos ->', curPos);

        // Get all popup box li elements
        var $li = jqueryMap.$search_results.find('li');

        // Remove the 'cur' class from the currently selected one
        for ( var i = 0; i < $li.length; i++ ) {
            var el = $li[i];
            $(el).removeClass('cur');
        }

        // And add the highlight to the current user item
        $(curPos).addClass("cur");

        return false;
    }

    // Populate search results in popup box
    function renderSearchResults(elem, resp_arr) {
        console.log('renderSearchResults: arr len ->', resp_arr.length);
        elem.html('');
        resp_arr.forEach(function(name) {
            elem.append('<li>' + name.nameFirst + ' ' + name.nameLast + '</li>');
        });
    }



    //------------------- END LOCAL METHODS ---------------------

    //------------------- BEGIN PUBLIC METHODS -------------------
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

        // On startup hide results pop-up
        jqueryMap.$search_results.hide();

        // install handler for keystrokes in search box
        jqueryMap.$search.on('keydown', onInput);

        // install handler - clear search box when it gains focus
        jqueryMap.$search.on('focus', onSearchFocus);

        // Initialize the delayed input checks on our input
        // This is what gets things going!
        delayedInput({
            // We're attaching to the input text field
            elem: jqueryMap.$search,

            // We're going to start searching after this many characters of input
            chars: 3,

            // When the text field loses focus, close the results popup
            focus: false,

            // Handle when the result popup should be opened up
            open: function (val, open) {
                var w = 1;

                if (w) {
                    // Make sure nothing is currently selected
                    curPos = null;

                    // Get the UL that holds all the results
                    // var results = id("results").lastChild;
                    var $ul = jqueryMap.$search_results.find('ul');

                    // And empty it out
                    $ul.html('');

                    // Do a request for new data
                    console.log('openPopup: send data ->', val);

                    $.ajax({
                        type: "GET",
                        url: "/autoc-search",
                        dataType: "json",
                        data: {search : val.trim()}, // appended to URL as query string

                        success: function(resp, status){
                            var i;
                            console.log('ajax success: response ->', resp);

                            renderSearchResults($ul, resp);

                            // Go through each of the returned results
                            var $li = $ul.find('li');
                            for (i = 0; i < $li.length; i++) {
                                // console.log($li[i],'add handler');

                                $($li[i]).hover(function() {
                                    $(this).css({cursor:'pointer'});
                                    // console.log('hover handler: elem ->', this);
                                    updatePos(this);
                                });

                                // When the result is clicked
                                $($li[i]).bind('click',function(){
                                    // Add the user to the input
                                    console.log('click handler: elem ->', this);
                                    console.log('retrieve selection from db server');
                                    addSelection(this); //this s/b <li> element

                                    // And focus back on the input again
                                    // $input.focus();
                                });
                            }

                            if ( $li.length == 0 ) {
                                jqueryMap.$search_results.hide();
                            } else {
                                // Add 'odd' classes to each result
                                // to give them a striping
                                for (i = 1; i < $li.length; i += 2)
                                    // addClass( li[i], "odd" );
                                    $($li[i]).addClass('odd');

                                // Set the currently selected result to the first one
                                updatePos( $li[0] );
                                jqueryMap.$search_results.show();
                            }
                        }
                    });
                }
            },

            // When the popup needs to be closed
            close: function() {
                jqueryMap.$search_results.hide();
            }
        });

    };

    // End public method /initModule/

    // return public methods
    return {
        configModule : configModule,
        initModule   : initModule
    };

}());
