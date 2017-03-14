[![Build Status](https://travis-ci.org/Amri91/expressjs-plus.svg?branch=master)](https://travis-ci.org/Amri91/expressjs-plus)

## Description
The main feature of this library is the getMiddlewareVersion function which facilitates passing variables between middlewares
seamlessly. A great feature of this library is that it allows its users to create their own handlers for passing variables.

## Usage
``` js
var express = require('express');
var ExpressPlus = require('expressjs-plus').ExpressPlus;
var app = express();
// simple handler example
var userHandler = function (param, paramsArray, req, res) {
    if (param !== 'user') return false;
    paramsArray.push("USER WAS FOUND!");
    return true;
};

// this handler allows you to pass res.locals properties between your middlewares seemingly,
// it the parameter was found in locals, it attaches it to paramsArray.
var resLocalsHandler = function (param, paramsArray, req, res) {
    if (param in res.locals) {
        paramsArray.push(res.locals[param]);
        return true;
    } else return false;
};
var appPlus = new ExpressPlus(app, [userHandler, resLocalsHandler], []);
var regularFunction = function (user, id, cb) {
    return cb(null, {response: {user: user, id: id}, status: 200, resLocalsVar: "passVar"});
};

// resLocalsVar was passed in a previous method
var regularFunction2 = function (resLocalsVar, user, id, cb) {
    // now you can have access to it
    console.log(resLocalsVar);
    return cb(null);
};

// the responder at the end will use res.locals.status and res.locals.response to issue an HTTP response
app.use(appPlus.GMV(regularFunction), appPlus.GMV(regularFunction2), appPlus.responder);

// adds error handlers, it will add a default error handler along with the list of error handlers passed
// in this case, no error handlers were passed
appPlus.setErrorHandlers();

app.listen(3001, function () {
    console.log('Listening!');
});
```

## Another example for a paramHandler
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

## Install
```
npm install expressjs-plus
```

<a name="ExpressPlus"></a>

## ExpressPlus
**Kind**: global class  

* [ExpressPlus](#ExpressPlus)
    * [new exports.ExpressPlus(app, passedParamHandlers, passedErrorHandlers)](#new_ExpressPlus_new)
    * _instance_
        * [.HTTPError](#ExpressPlus+HTTPError)
            * [new this.HTTPError(status, errCode)](#new_ExpressPlus+HTTPError_new)
        * [.getMiddlewareVersion](#ExpressPlus+getMiddlewareVersion) ⇒
        * [.setErrorHandlers()](#ExpressPlus+setErrorHandlers)
        * [.responder(req, res, next)](#ExpressPlus+responder)
        * [.defaultCbWithResponse(cb, [status])](#ExpressPlus+defaultCbWithResponse)
        * [.defaultCb(cb, [resource])](#ExpressPlus+defaultCb)
        * [.useArray(middlewares)](#ExpressPlus+useArray)
    * _inner_
        * [~lastHandler(param, paramsArray, req, res)](#ExpressPlus..lastHandler) ⇒ <code>boolean</code>

<a name="new_ExpressPlus_new"></a>

### new exports.ExpressPlus(app, passedParamHandlers, passedErrorHandlers)
This function abstracts the constraints of express middleware signature and allows you to easily pass variables
between middlewares without ugly code. It introduces a neat pattern for passing these variables.


| Param | Type | Description |
| --- | --- | --- |
| app | <code>Object</code> | express app object |
| passedParamHandlers | <code>Array</code> | array of functions in the format of @see [lastHandler](lastHandler) |
| passedErrorHandlers | <code>Array</code> | array of middlewares |

<a name="ExpressPlus+HTTPError"></a>

### expressPlus.HTTPError
**Kind**: instance class of <code>[ExpressPlus](#ExpressPlus)</code>  
<a name="new_ExpressPlus+HTTPError_new"></a>

#### new this.HTTPError(status, errCode)
Generic error handler


| Param | Type | Description |
| --- | --- | --- |
| status | <code>Number</code> | HTTP error code |
| errCode | <code>String</code> | errorCode, the error handler should handle this |

<a name="ExpressPlus+getMiddlewareVersion"></a>

### expressPlus.getMiddlewareVersion ⇒
Returns a middleware version of the function passed, this function replaces the last parameter with a callback
function to work with express js.

**Kind**: instance property of <code>[ExpressPlus](#ExpressPlus)</code>  
**Returns**: function  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>function</code> | the function to be converted |

**Example**  
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
<a name="ExpressPlus+setErrorHandlers"></a>

### expressPlus.setErrorHandlers()
sets error handlers, make sure to use this last

**Kind**: instance method of <code>[ExpressPlus](#ExpressPlus)</code>  
<a name="ExpressPlus+responder"></a>

### expressPlus.responder(req, res, next)
Handles responses. Other middlewares need to use locals to pass data to this function

**Kind**: instance method of <code>[ExpressPlus](#ExpressPlus)</code>  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | request object |
| res | <code>Object</code> | response object |
| res.status | <code>function</code> | function to set the status |
| res.locals | <code>Object</code> | object that is used to pass data around |
| res.locals.status | <code>Number</code> | Contains HTTP status code |
| res.locals.response | <code>Object</code> | Contains the response body |
| next | <code>function</code> |  |

<a name="ExpressPlus+defaultCbWithResponse"></a>

### expressPlus.defaultCbWithResponse(cb, [status])
Handles callbacks and puts response & status in the second callback argument if successful
Replace your callback with this if appropriate.

**Kind**: instance method of <code>[ExpressPlus](#ExpressPlus)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cb | <code>function</code> |  | callback function |
| [status] | <code>Number</code> | <code>204</code> | optional argument to pass specific HTTP code if no errors were found if the status is 204, no response will be returns according to HTTP codes. |

<a name="ExpressPlus+defaultCb"></a>

### expressPlus.defaultCb(cb, [resource])
Handles callbacks.
Replace your callback with this if appropriate.

**Kind**: instance method of <code>[ExpressPlus](#ExpressPlus)</code>  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>function</code> | callback function |
| [resource] | <code>Object</code> | optional argument to return instead of the actual result |

<a name="ExpressPlus+useArray"></a>

### expressPlus.useArray(middlewares)
Enables sending array of middlewares to app.use

**Kind**: instance method of <code>[ExpressPlus](#ExpressPlus)</code>  

| Param |
| --- |
| middlewares | 

<a name="ExpressPlus..lastHandler"></a>

### ExpressPlus~lastHandler(param, paramsArray, req, res) ⇒ <code>boolean</code>
Default parameter handler used in getMiddlewareVersion.
Every parameter is passed to a set of functions to be handled, this is the last handler that just pushes
the parameter to the paramsArray.

**Kind**: inner method of <code>[ExpressPlus](#ExpressPlus)</code>  
**Returns**: <code>boolean</code> - if true is returned, the parameter will be considered handled and the function [GMV](GMV) will
move on to the next parameter. if false is returned, the next handler on the list will attempt to handle the
parameter until this methods turn comes, which will always return true  
**See**: [dataHandler](dataHandler) this function is a more real example of a parameter handler, it is used to integrate
with another library [https://www.npmjs.com/package/simple-express-validator](https://www.npmjs.com/package/simple-express-validator)  

| Param | Type | Description |
| --- | --- | --- |
| param | <code>String</code> | string parameter |
| paramsArray | <code>Array</code> | parameter arrays which will be sent to the underlying function of the middleware |
| req | <code>Object</code> | express request object that is used in middlewares, useful for accessing req.params, req.query, etc |
| res | <code>Object</code> | exppress response object that is used in middlewares, could be useful if you want to access res.locals |


# Testing
```
npm test
```

* * *

&copy; 2016 A Amri a.amri.91@gmail.com