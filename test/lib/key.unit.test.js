var assert = require("assert");
var key = require("key");
var store;

describe("Key", function() {
  describe("mem", function() {
    before(function (done) {
      key.store('mem', {}, function(err, mem){
        store = mem;
        done();
      });
    });
    it("set", function(done) {
      store.set("foo", new Buffer("bar"), done);
    });
    it("gets", function(done) {
      store.get("foo", function(err, val){
        assert.ifError(err);
        assert.equal("bar", val.toString());
        done();
      });
    });
    it("deletes", function(done) {
      store.del("foo", function(err, val){
        store.get("foo", function(err, val){
          assert(!val);
          done();
        });
      });
    });
    it("fails", function(done) {
      store.get("bar", function(err, val){
        assert(err);
        done();
      });
    });
  });

  describe("fs", function() {
    before(function (done) {
      key.store('fs', {base_path:'/tmp/kvtest'}, function(err, mem){
        store = mem;
        done();
      });
    });
    it("set", function(done) {
      store.set("foo", new Buffer("bar"), done);
    });
    it("gets", function(done) {
      store.get("foo", function(err, val){
        assert.ifError(err);
        assert.equal("bar", val.toString());
        done();
      });
    });
    it("deletes", function(done) {
      store.del("foo", function(err, val){
        store.get("foo", function(err, val){
          assert(!val);
          done();
        });
      });
    });
    it("fails", function(done) {
      store.get("bar", function(err, val){
        assert(err);
        done();
      });
    });
  });

});
