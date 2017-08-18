
/*
 * spa.util.js
 * Utility methods
*/
 /*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/

/*global $, spa */

spa.util = (function () {

    //---------------- BEGIN MODULE SCOPE VARIABLES --------------
    var moduleName = 'util';

    //----------------- END MODULE SCOPE VARIABLES ---------------


    //------------------- BEGIN PUBLIC METHODS -------------------
    // Get handlebars template from server, compile them and
    // store in template_func map
    function getTemplates(arr, template_func) {
        var tmpl_url;

        arr.forEach(function(template, idx) {
            tmpl_url = '/templates/' + template + '.html';

            $.ajax({
                url: tmpl_url,
                method: 'GET',
                dataType: 'html',
                success: function(html) {
                    // console.log('getTemplates:', idx, html);
                    template_func[template]= Handlebars.compile(html);
                }
            });
        });
    }

    // return public methods
    return {
        getTemplates : getTemplates
    };
  //------------------- END PUBLIC METHODS ---------------------
}());
