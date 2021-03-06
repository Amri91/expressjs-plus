/**
 * Created by Amri on 11/11/2016.
 */
import errorHandler from 'errorhandler'

/**
 * This function abstracts the constraints of express middleware signature and allows you to easily pass variables
 * between middlewares without ugly code. It introduces a neat pattern for passing these variables.
 * @param {Object} app express app object
 * @param {Array} passedParamHandlers array of functions in the format of @see {@link lastHandler}
 * @param {Array} passedErrorHandlers array of middlewares
 * @constructor
 */
export function ExpressPlus(app, passedParamHandlers = [], passedErrorHandlers = []) {
    let self = this;

    if (!Array.isArray(passedParamHandlers) || !Array.isArray(passedErrorHandlers)) {
        throw Error('Bad array passed to ExpressPlus constructor. Shame on you!')
    }

    passedParamHandlers.push(lastHandler);
    let paramHandlers = passedParamHandlers;

    passedErrorHandlers.push(errorHandler());
    let errorHandlers = passedErrorHandlers;

    /**
     * sets error handlers, make sure to use this last
     */
    this.setErrorHandlers = () => {
        self.useArray(errorHandlers)
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
    this.getMiddlewareVersion = this.GMV = (func) => {
        if (!isFunction(func)) throw new Error('Non-function passed');
        // takes all parameters except for the last one which is assumed to be the callback.
        const params = $args(func).slice(0, -1);
        // the middleware version of the passed method
        return function (req, res, next) {
            let paramsArray = [];
            // looping through every parameter except the callback
            for (let i = 0; i < params.length; i++) {
                // looping through every handler, breaking when a handler is successful
                for (let j = 0; j < paramHandlers.length; j++) {
                    if (paramHandlers[j](params[i], paramsArray, req, res)) break
                }
            }
            // adding a replacement callback function, using the error first pattern
            paramsArray.push((err, vars) => {
                if (err) return next(err);
                else {
                    // adding the variables passed to the data argument to res.locals
                    // which will be used by the responder to send the final response
                    Object.assign(res.locals, vars);
                    return next()
                }
            });
            // when the middleware is called in express, we're replacing it with this function
            func.apply(this, paramsArray)
        }
    };

    /**
     * Similar to GMV @see {@link GMV} but accepts promises instead
     * @param {Promise} promise the promise to be converted
     * @return function
     * @example
```js
function regularPromise = (someVar) => {
// you can use co as well
    return new Promise((resolve, reject) => {
        resolve({ response: {user: user, id: id}, status: 123 });
    });
}
// middleware version of regularFunc
var func = GMVPromise(regularFunc);
```
     */
    this.getMiddlewareVersionPromise =  this.GMVPromise = function(promise){
        let self = this;
        if (!isFunction(promise)) throw new Error('Non-function passed');
        // takes all parameters except for the last one which is assumed to be the callback.
        const params = $args(promise);
        // the middleware version of the passed method
        return function (req, res, next) {
            let paramsArray = [];
            // looping through every parameter except the callback
            for (let i = 0; i < params.length; i++) {
                // looping through every handler, breaking when a handler is successful
                for (let j = 0; j < paramHandlers.length; j++) {
                    if (paramHandlers[j](params[i], paramsArray, req, res)) break
                }
            }
            // when the middleware is called in express, we're replacing it with this function
            promise.apply(self, paramsArray)
                .then(vars => {
                    Object.assign(res.locals, vars);
                    return next();
                })
                .catch(err => next(err));
        }
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
        const status = res.locals.status;
        const data = res.locals.response;
        // TODO: handle different accept headers
        if (status) {
            return res.status(status).send(data)
        } else {
            return res.status(404).send()
        }
    };

    /**
     * Handles callbacks and puts response & status in the second callback argument if successful
     * Replace your callback with this if appropriate.
     * @param {Function} cb callback function
     * @param {Number} [status=204] optional argument to pass specific HTTP code if no errors were found
     * if the status is 204, no response will be returns according to HTTP codes.
     */
    this.defaultCbWithResponse = (cb, status) => {
        if (!isFunction(cb)) throw new Error('Non-function passed');
        return function (err, result) {
            if (err) return cb(err);
            else {
                status = status || 204;
                let obj = {status};
                if (status !== 204) obj.response = result;
                return cb(null, obj)
            }
        }
    };

    /**
     * Handles callbacks.
     * Replace your callback with this if appropriate.
     * @param {Function} cb callback function
     * @param {Object} [resource] optional argument to return instead of the actual result
     */
    this.defaultCb = (cb, resource) => {
        if (!isFunction(cb)) throw new Error('Non-function passed');
        return function (err, result) {
            if (err) return cb(err);
            else if (!result && !resource) return cb(new self.HTTPError(404, 'ResourceNotFound'));
            return cb(null, resource || result)
        }
    };

    /**
     * Generic error handler
     * @param {Number} status HTTP error code
     * @param {String} errCode errorCode, the error handler should handle this
     * @constructor
     */
    this.HTTPError = function (status, errCode) {
        this.status = status;
        this.errCode = errCode
    };

    /**
     * Enables sending array of middlewares to app.use
     * @param middlewares
     */
    this.useArray = function (middlewares) {
        for (let i = 0; i < middlewares.length; i++) {
            app.use(middlewares[i])
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
     * @param {Object} req express request object that is used in middlewares, useful for accessing req.params,
     * req.query, etc
     * @param {Object} res exppress response object that is used in middlewares, could be useful if you want to access
     * res.locals
     * @returns {boolean} if true is returned, the parameter will be considered handled and the function {@link GMV} will
     * move on to the next parameter. if false is returned, the next handler on the list will attempt to handle the
     * parameter until this methods turn comes, which will always return true
     */
    function lastHandler(param, paramsArray, req, res) {
        paramsArray.push(req.params[param] || req.query[param]);
        return true
    }
}

// All credits goes to Jack Allan
// https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically-from-javascript/31194949#31194949
// Parses a function and returns an array that contains all of its parametersvar STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;
function $args(func) {
    var fnStr = func.toString().replace(STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if(result === null)
        result = [];
    return result;
}


// Checks where a variable is a function
function isFunction(func) {
    return typeof func === 'function'
}
