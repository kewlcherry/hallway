var fs = require('fs');
var path = require("path");
var mkdirp = require("mkdirp");

// this is a rudimentary key-value get/set wrapper

var STORES = {};

// create a new key value store of the given type
exports.store = function(type, options, cbDone)
{
  if(!type) return cbDone(new Error("no type given"));
  if(!STORES[type]) return cbDone(new Error("unknown type "+type));
  var ret = new STORES[type](options);
  // optional async initialization
  if(ret.init) return ret.init(options, cbDone);
  cbDone(null, ret);
}

// simple in-memory
STORES.mem = function () {
  this.store = {};

  this.get = function (key, cb) {
    this.store[key] ? cb(null, this.store[key]) : cb(new Error("no data for "+key));
  };

  this.set = function (key, value, cb) {
    var inBuffer = new Buffer(value.length);
    value.copy(inBuffer);
    this.store[key] = inBuffer;
    cb(null);
  };

  return this;
};

// local filesystem
STORES.fs = function (options) {
  this.base_path = (options && options.base_path) || "/tmp/kvstore";

  this.get = function (key, cb) {
    fs.readFile(path.join(this.base_path, key), 'utf8', cb);
  };

  this.set = function (key, buffer, cb) {
    var keypath = path.join(this.base_path, key);

    // Ensure the base of the keypath exists
    mkdirp(path.dirname(keypath), function (err) {
      if (err) return cb(err);
      fs.writeFile(keypath, buffer, null, cb);
    });
  };

  return this;
};

