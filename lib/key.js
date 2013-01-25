var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var crypto = require('crypto');
var RiakClient = require("riak");

// this is a rudimentary key-value get/set wrapper

var STORES = {};

// create a new key value store of the given type
exports.store = function(type, options, cbDone)
{
  if (!type) return cbDone(new Error("no type given"));
  if (!STORES[type]) return cbDone(new Error("unknown type "+type));
  var ret = new STORES[type](options);
  if (!ret) return cbDone(new Error("storage failed to initialize"));
  // optional async initialization
  if (ret.init) return ret.init(options, cbDone);
  cbDone(null, ret);
};

// allow passing in objects or strings, unify to a buffer
function valued(val)
{
  if (Buffer.isBuffer(val)) return val;
  if (typeof val === 'object') return new Buffer(JSON.stringify(val));
  return new Buffer(val);
}

// on the way back out, optional transform back, default to json
function devalued(val, args, cb)
{
  if (!args) args = {};
  if (args.buffer) return cb(null, val);
  if (args.string) return cb(null, val.toString());
  var js;
  try {
    js = JSON.parse(val);
  } catch(E) {
    return cb("JSON parse error: "+E);
  }
  cb(null, js);
}

// simple in-memory
STORES.mem = function () {
  this.store = {};

  this.get = function (key, cb, args) {
    if(!this.store[key]) return cb(new Error("no data for "+key));
    devalued(this.store[key], args, cb);
  };

  this.set = function (key, value, cb) {
    buf = valued(value);
    var inBuffer = new Buffer(buf.length);
    buf.copy(inBuffer);
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

  this.get = function (key, cb, args) {
    fs.readFile(path.join(this.base_path, this.safekey(key)), 'utf8', function(err, data){
      if (err) return cb(err);
      devalued(data, args, cb);      
    });
  };

  this.set = function (key, value, cb) {
    var buf = valued(value);
    var keypath = path.join(this.base_path, this.safekey(key));

    // Ensure the base of the keypath exists
    mkdirp(path.dirname(keypath), function (err) {
      if (err) return cb(err);
      fs.writeFile(keypath, buf, null, cb);
    });
  };

  this.del = function (key, cb) {
    fs.unlink(path.join(this.base_path, this.safekey(key)), cb);
  };

  return this;
};

// riaksome
STORES.riak = function (options) {
  if (!options || !options.servers) return null;
  this.client = new RiakClient(options.servers, Math.random().toString());

  this.get = function (key, cb, args) {
    if (!args || !args.bucket) return cb("missing bucket");
    this.client.get(args.bucket, key, args.options || {}, function(err, resp, obj){
      cb(err, obj);
    });
  };

  this.set = function (key, value, cb, args) {
    if (!args || !args.bucket) return cb("missing bucket");
    this.client.put(args.bucket, key, value, args.options || {}, cb);
  };
  
  this.del = function (key, cb, args) {
    if (!args || !args.bucket) return cb("missing bucket");
    this.client.del(args.bucket, key, cb);
  };

  return this;
};

