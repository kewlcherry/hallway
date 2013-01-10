var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var crypto = require('crypto');

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
};

// simple in-memory
STORES.mem = function () {
  this.store = {};

  this.get = function (key, cb) {
    return this.store[key] ? cb(null, this.store[key]) : cb(new Error("no data for "+key));
  };

  this.set = function (key, value, cb) {
    var inBuffer = new Buffer(value.length);
    value.copy(inBuffer);
    this.store[key] = inBuffer;
    cb();
  };
  
  this.del = function (key, cb) {
    delete this.store[key];
    cb();
  };

  return this;
};

// local filesystem
STORES.fs = function (options) {
  this.base_path = (options && options.base_path) || "/tmp/kvstore";

  // filesystems don't like special chars
  this.safekey = function(key)
  {
    return crypto.createHash('md5').update(key).digest('hex');
  };

  this.get = function (key, cb) {
    fs.readFile(path.join(this.base_path, this.safekey(key)), 'utf8', cb);
  };

  this.set = function (key, buffer, cb) {
    var keypath = path.join(this.base_path, this.safekey(key));

    // Ensure the base of the keypath exists
    mkdirp(path.dirname(keypath), function (err) {
      if (err) return cb(err);
      fs.writeFile(keypath, buffer, null, cb);
    });
  };

  this.del = function (key, cb) {
    fs.unlink(path.join(this.base_path, this.safekey(key)), cb);
  };

  return this;
};

