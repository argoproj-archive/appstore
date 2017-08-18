/**
 * Created by raynald on 5/28/14.
 */

/*
 * spa.js
 * Root namespace module
 */

/*jslint           browser : true,   continue : true,
 devel  : true,    indent : 2,       maxerr  : 50,
 newcap : true,     nomen : true,   plusplus : true,
 regexp : true,    sloppy : true,       vars : false,
 white  : true
 */
/*global $, spa */

// Un-comment to get supress all console.log messages
// var console = {};
// console.log = function () {};

var spa = (function () {
    'use strict';
    var initModule = function () {
        spa.shell.initModule();
    };

    return { initModule: initModule };
}());