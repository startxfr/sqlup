/* global require */

var expect = require("chai").expect;

var test = null;

/* Test suite for mysql resource */
describe("mysql resource component", function () {
    describe("app object", function () {
        test = require("../core/resource/mysql");
        test = test("test-mysql", {
            server: {
                "host": "172.17.42.1",
                "database": "test"
            }
        });
        it("should be an object", function () {
            expect(test).to.be.an('object');
        });
        it("should have config property", function () {
            expect(test).to.have.any.keys('config');
            expect(test.config).to.be.an('object');
        });
        it("should have id property", function () {
            expect(test).to.have.any.keys('id');
            expect(test.id).to.be.an('string');
        });
    });
    describe("#init()", function () {
        it("should exist", function () {
            expect(test).to.have.any.keys('init');
        });
        it("should be a method", function () {
            expect(test.init).to.be.an('function');
        });
    });
    describe("#start()", function () {
        it("should exist", function () {
            expect(test).to.have.any.keys('start');
        });
        it("should be a method", function () {
            expect(test.start).to.be.an('function');
        });
    });
    describe("#stop()", function () {
        it("should exist", function () {
            expect(test).to.have.any.keys('stop');
        });
        it("should be a method", function () {
            expect(test.stop).to.be.an('function');
        });
    });
    describe("#open()", function () {
        it("should exist", function () {
            expect(test).to.have.any.keys('open');
        });
        it("should be a method", function () {
            expect(test.open).to.be.an('function');
        });
    });
    describe("resource methods", function () {
        describe("#query()", function () {
            it("should exist", function () {
                expect(test).to.have.any.keys('query');
            });
            it("should be a method", function () {
                expect(test.query).to.be.an('function');
            });
            describe("#__queryDefaultCallback()", function () {
                it("should exist", function () {
                    expect(test).to.have.any.keys('__queryDefaultCallback');
                });
                it("should be a method", function () {
                    expect(test.__queryDefaultCallback).to.be.an('function');
                });
            });
        });
        describe("#load()", function () {
            it("should exist", function () {
                expect(test).to.have.any.keys('load');
            });
            it("should be a method", function () {
                expect(test.load).to.be.an('function');
            });
        });
    });
});