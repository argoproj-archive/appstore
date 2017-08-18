// Error handling middle-ware

exports.errorHandler = function(err, req, res, next) {
    "use strict";
    console.error('error message: ', err.message);
    console.error('error stack: ', err.stack);
    // res.status(500);
    // res.render('error_template', { error: err });
    res.json(500, {error: err});
};
