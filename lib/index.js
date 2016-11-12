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

    this.setErrorHandlers = function () {
        self.useArray(errorHandlers);
    };

    this.getMiddlewareVersion = this.GMV = function (func) {
        if (!isFunction(func)) throw new Error('Non-function passed');

        var params = $args(func).slice(0, -1);

        return function (req, res, next) {
            var paramsArray = [];

            for (var i = 0; i < params.length; i++) {
                for (var j = 0; j < paramHandlers.length; j++) {
                    if (paramHandlers[j](params[i], paramsArray, req, res)) break;
                }
            }

            paramsArray.push(function (err, vars) {
                if (err) return next(err);else {
                    (0, _extends3.default)(res.locals, vars);
                    return next();
                }
            });

            func.apply(this, paramsArray);
        };
    };

    this.responder = function (req, res, next) {
        var status = res.locals.status;
        var data = res.locals.response;

        if (status) {
            return res.status(status).send(data);
        } else {
            return res.status(404).send();
        }
    };

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

    this.defaultCb = function (cb, resource) {
        if (!isFunction(cb)) throw new Error('Non-function passed');
        return function (err, result) {
            if (err) return cb(err);else if (!result && !resource) return cb(new self.HTTPError(404, 'ResourceNotFound'));
            return cb(null, resource || result);
        };
    };

    this.HTTPError = function (status, errCode) {
        this.status = status;
        this.errCode = errCode;
    };

    this.useArray = function (middlewares) {
        for (var i = 0; i < middlewares.length; i++) {
            app.use(middlewares[i]);
        }
    };

    function lastHandler(param, paramsArray, req, res) {
        paramsArray.push(req.params[param] || req.query[param]);
        return true;
    }
}

function $args(func) {
    return (func + '').replace(/[/][/].*$/mg, '').replace(/\s+/g, '').replace(/[/][*][^/*]*[*][/]/g, '').split('){', 1)[0].replace(/^[^(]*[(]/, '').replace(/=[^,]+/g, '').split(',').filter(Boolean);
}

function isFunction(func) {
    return typeof func === 'function';
}
