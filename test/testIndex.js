/**
 * Created by Amri on 11/11/2016.
 */

var should = require('should');
var sinon  = require('sinon');

var ExpressPlus = require('../lib/index').ExpressPlus;


describe('#setErrorHandlers and useArray testing', function() {
    it('should call useArray which should call app.use twice ', function (done) {
        var obj = mockExpressApp();
        var spy = sinon.spy(obj, 'use');
        var appPlus = new ExpressPlus(obj, undefined, [function(){}]);
        appPlus.setErrorHandlers();
        spy.calledTwice.should.be.true();
        done();
    });
});

describe('#getMiddlewareVersion testing', function() {
    it('should call function with correct parameters', function (done) {
        var unsuspectingFunction = function(user, id, cb){
            return cb(null, { response: {user: user, id: id}, status: 123 });
        };
        var userHandler = function(param, paramsArray, req, res){
            if(param !== 'user') return false;
            paramsArray.push(req.user);
            return true;
        };
        var spy = sinon.spy(userHandler);

        var spyForFunc = sinon.spy(unsuspectingFunction);

        var appPlus = new ExpressPlus(mockExpressApp(), [userHandler], []);

        var mockedReq = mockReq();
        var mockedRes = mockRes();
        appPlus.GMV(unsuspectingFunction)(mockedReq, mockedRes, function(){
            mockedRes.locals.status.should.be.equal(123);
            mockedRes.locals.response.user.should.be.equal("sup");
            mockedRes.locals.response.id.should.be.equal(1);
            done();
        });
    });

    it('should call ES6 function with correct parameters', function (done) {
        var unsuspectingES6Function = (user, id, cb) => {
            return cb(null, { response: {user: user, id: id}, status: 123 });
        };
        var userHandler = function(param, paramsArray, req, res){
            if(param !== 'user') return false;
            paramsArray.push(req.user);
            return true;
        };
        var spy = sinon.spy(userHandler);

        var spyForFunc = sinon.spy(unsuspectingES6Function);

        var appPlus = new ExpressPlus(mockExpressApp(), [userHandler], []);

        var mockedReq = mockReq();
        var mockedRes = mockRes();
        appPlus.GMV(unsuspectingES6Function)(mockedReq, mockedRes, function(){
            mockedRes.locals.status.should.be.equal(123);
            mockedRes.locals.response.user.should.be.equal("sup");
            mockedRes.locals.response.id.should.be.equal(1);
            done();
        });
    });
});

describe('#responder testing', function() {
    it('should call status then send when status is not null', function (done) {
        var mockedRes = mockRes();
        var spy = sinon.spy(mockedRes, "status");
        var appPlus = new ExpressPlus(mockExpressApp(), [], []);

        appPlus.responder(null, mockedRes, null);

        spy.calledOnce.should.be.true();
        done();
    });
});

describe('#defaultCbWithResponse testing', function() {
    it('should call cb with error = null and obj.response = null', function (done) {
        var appPlus = new ExpressPlus(mockExpressApp(), [], []);

        appPlus.defaultCbWithResponse(function(err, obj){
            obj.status.should.be.equal(204);
            should.not.exist(obj.response);
            done();
        })(null, "obj");
    });
});

describe('#defaultCb testing', function() {
    it('should call cb with error = null and obj = notObj', function (done) {
        var appPlus = new ExpressPlus(mockExpressApp(), [], []);

        appPlus.defaultCb(function(err, obj){
            obj.should.be.equal("notObj");
            done();
        }, "notObj")(null, "obj");
    });
});

describe('#HTTPError testing', function() {
    it('should create an object with status = 123, errCode = "code', function (done) {
        var appPlus = new ExpressPlus(mockExpressApp(), [], []);
        var obj = new appPlus.HTTPError('123', 'code');
        obj.status.should.equal('123');
        obj.errCode.should.equal('code');
        done();
    });
});

function mockReq(){
    return {
        user: "sup",
        params: {},
        query: {
            id: 1
        }
    }
}

function mockRes(status){
    return {
        locals: {
            status: status || 200,
            response: {}
        },
        status: function(status){
            return {
                send: function(obj){}
            }
        }
    };
}

function mockExpressApp(){
    return {
        use: function(obj){}
    }
}