'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

exports.ExpressPlus = ExpressPlus;

var _errorhandler = require('errorhandler');

var _errorhandler2 = _interopRequireDefault(_errorhandler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @example
 * // Usage
 *
```js
var express = require('express');
var bodyParser = require('body-parser');
var userHandler = function(param, paramsArray, req){
    if(param !== 'user') return false;
    paramsArray.push(req.user);
    return true;
};
var app = express()
app.use(bodyParser.json());
var appPlus = new ExpressPlus(app, [userHandler], []);
var regularFunction = function(user, id, cb){
    return cb(null, { response: {user: user, id: id}, status: 200 });
};
app.use(appPlus.GMV(regularFunction), appPlus.responder);

appPlus.setErrorHandlers();
```

 * @param {Object} app express app object
 * @param {Array} passedParamHandlers array of functions in the format of @see {@link lastHandler}
 * @example //this is an example of a paramHandler function that is interested in the user parameter
 *
```js
function userHandler(param, paramsArray, req){
    if(param === 'user'){
        paramsArray.push(req.user);
        return true;
    }else{
        return false;
    }
}
```

 * @param {Array} passedErrorHandlers array of middlewares
 * @constructor
 */
function ExpressPlus(app) {
    var passedParamHandlers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    var passedErrorHandlers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

    var self = this;

    if (!Array.isArray(passedParamHandlers) || !Array.isArray(passedErrorHandlers)) {
        throw Error('Bad array passed to ExpressPlus constructor. Shame on you!');
    }

    passedParamHandlers.push(lastHandler);
    var paramHandlers = passedParamHandlers;

    passedErrorHandlers.push((0, _errorhandler2.default)());
    var errorHandlers = passedErrorHandlers;

    /**
     * sets error handlers, make sure to use this last
     */
    this.setErrorHandlers = function () {
        self.useArray(errorHandlers);
    };

    /**
     * Returns a middleware version of the function passed, this function replaces the last parameter with a callback
     * function to work with express js.
     * @param {Function} func the function to be converted
     * @return function
     * @example
    ```js
    function regularFunc(someVar, cb){
    console.log(someVar);
    return cb(null, {response: someVar+="addedString"});
    }
    // middleware version of regularFunc
    var func = GMV(regularFunc);
    // func will behave like this
    function mw(req, res, next){
    let someVar = req.query.someVar;
    console.log(someVar);
    res.locals.response = someVar+="addedString";
    return next();
    }
    ```
     */
    this.getMiddlewareVersion = this.GMV = function (func) {
        if (!isFunction(func)) throw new Error('Non-function passed');
        // takes all parameters except for the last one which is assumed to be the callback.
        var params = $args(func).slice(0, -1);
        // the middleware version of the passed method
        return function (req, res, next) {
            var paramsArray = [];
            // looping through every parameter except the callback
            for (var i = 0; i < params.length; i++) {
                // looping through every handler, breaking when a handler is successful
                for (var j = 0; j < paramHandlers.length; j++) {
                    if (paramHandlers[j](params[i], paramsArray, req)) break;
                }
            }
            // adding a replacement callback function, using the error first pattern
            paramsArray.push(function (err, vars) {
                if (err) return next(err);else {
                    // adding the variables passed to the data argument to res.locals
                    // which will be used by the responder to send the final response
                    (0, _extends3.default)(res.locals, vars);
                    return next();
                }
            });
            // when the middleware is called in express, we're replacing it with this function
            func.apply(this, paramsArray);
        };
    };

    /**
     * Handles responses. Other middlewares need to use locals to pass data to this function
     * @param {Object} req request object
     * @param {Object} res response object
     * @param {Function} res.status function to set the status
     * @param {Object} res.locals object that is used to pass data around
     * @param {Number} res.locals.status Contains HTTP status code
     * @param {Object} res.locals.response Contains the response body
     * @param {Function} next
     */
    this.responder = function (req, res, next) {
        var status = res.locals.status;
        var data = res.locals.response;
        // TODO: handle different accept headers
        if (status) {
            return res.status(status).send(data);
        } else {
            return res.status(404).send();
        }
    };

    /**
     * Handles callbacks and puts response & status in the second callback argument if successful
     * Replace your callback with this if appropriate.
     * @param {Function} cb callback function
     * @param {Number} [status=204] optional argument to pass specific HTTP code if no errors were found
     * if the status is 204, no response will be returns according to HTTP codes.
     */
    this.defaultCbWithResponse = function (cb, status) {
        if (!isFunction(cb)) throw new Error('Non-function passed');
        return function (err, result) {
            if (err) return cb(err);else {
                status = status || 204;
                var obj = { status: status };
                if (status !== 204) obj.response = result;
                return cb(null, obj);
            }
        };
    };

    /**
     * Handles callbacks.
     * Replace your callback with this if appropriate.
     * @param {Function} cb callback function
     * @param {Object} [resource] optional argument to return instead of the actual result
     */
    this.defaultCb = function (cb, resource) {
        if (!isFunction(cb)) throw new Error('Non-function passed');
        return function (err, result) {
            if (err) return cb(err);else if (!result && !resource) return cb(new self.HTTPError(404, 'ResourceNotFound'));
            return cb(null, resource || result);
        };
    };

    /**
     * Generic error handler
     * @param {Number} status HTTP error code
     * @param {String} errCode errorCode, the error handler should handle this
     * @constructor
     */
    this.HTTPError = function (status, errCode) {
        this.status = status;
        this.errCode = errCode;
    };

    /**
     * Enables sending array of middlewares to app.use
     * @param middlewares
     */
    this.useArray = function (middlewares) {
        for (var i = 0; i < middlewares.length; i++) {
            app.use(middlewares[i]);
        }
    };

    /**
     * Default parameter handler used in getMiddlewareVersion.
     * Every parameter is passed to a set of functions to be handled, this is the last handler that just pushes
     * the parameter to the paramsArray.
     * @see {@link dataHandler} this function is a more real example of a parameter handler, it is used to integrate
     * with another library {@link https://www.npmjs.com/package/simple-express-validator}
     * @param {String} param string parameter
     * @param {Array} paramsArray parameter arrays which will be sent to the underlying function of the middleware
     * @param {Object} req express request object that is used in middlewares
     * @returns {boolean} if true is returned, the parameter will be considered handled and the function {@link GMV} will
     * move on to the next parameter. if false is returned, the next handler on the list will attempt to handle the
     * parameter until this methods turn comes, which will always return true
     */
    function lastHandler(param, paramsArray, req) {
        paramsArray.push(req.params[param] || req.query[param]);
        return true;
    }
}

// All credits goes to humbletim
// https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically-from-javascript/31194949#31194949
// Parses a function and returns an array that contains all of its parameters
/**
 * Created by Amri on 11/11/2016.
 */
function $args(func) {
    return (func + '').replace(/[/][/].*$/mg, '') // strip single-line comments
    .replace(/\s+/g, '') // strip white space
    .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments
    .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters
    .replace(/=[^,]+/g, '') // strip any ES6 defaults
    .split(',').filter(Boolean); // split & filter [""]
}

// Checks where a variable is a function
function isFunction(func) {
    return typeof func === 'function';
}
