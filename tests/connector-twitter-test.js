//testing for Twitter connector

var assert = require('assert');
var vows = require('vows');
var RESTeasy = require('rest-easy');
var http = require('http');
var querystring = require('querystring');
var events = require('events');
var fs = require('fs');
var request = require('request');
var lfs = require('../Common/node/lfs.js');
var locker = require('../Common/node/locker.js');
var path = require('path');
var testUtils = require(__dirname + "/test-utils.js");

var suite = RESTeasy.describe('Twitter Connector')

var id = 'twitter-test';

function addFriendOrFollowersSync(friendsOrFollowers) {
    var tpc = 'Twitter Connector can sync ' + friendsOrFollowers + ' from Twitter';
    var test = {};
    test[tpc] = {
            topic:function() {
                var promise = new events.EventEmitter;
            
                request({uri:'http://localhost:8042/Me/' + id + '/' + friendsOrFollowers}, function(err, resp, body) {
                    if(err) {
                        promise.emit('error', err);
                        return;
                    }
                    //TODO: file size might not be a great way to determine if a file is done
                    testUtils.waitForFileToComplete('../Me/' + id + '/' + friendsOrFollowers + '.json',
                                                    10000, 10, 1000, function(success) { //10KB doesn't really make any sense!!
                        if(success == true)
                            promise.emit('success', true);
                        else
                            promise.emit('error', new Error);
                    });
                });
                return promise;
            },
            'and returns within 10 seconds':function(err, stat) {
                assert.isNull(err);
            }
        };
    suite.next().suite.addBatch(test);
}

addFriendOrFollowersSync('friends');
addFriendOrFollowersSync('followers');


function addStatusSync(type) {
    var tpc = 'Twitter Connector can sync ' + type + ' from Twitter';
    var test = {};
    test[tpc] = {
            topic:function() {
                var promise = new events.EventEmitter;
            
                request({uri:'http://localhost:8042/Me/' + id + '/' + type}, function(err, resp, body) {
                    if(err) {
                        promise.emit('error', err);
                        return;
                    }
                    //TODO: file size might not be a great way to determine if a file is done
                    testUtils.waitForFileToComplete('../Me/' + id + '/' + type + '.json',
                                                    1000, 30, 1000, function(success) { //10KB doesn't really make any sense!!
                        if(success == true)
                            promise.emit('success', true);
                        else
                            promise.emit('error', new Error);
                    });
                });
                return promise;
            },
            'and returns within 30 seconds':function(err, stat) {
                assert.isNull(err);
            }
        };
    suite.next().suite.addBatch(test);
}

addStatusSync('home_timeline');
addStatusSync('mentions');

var port = 8042, mePath = '/Me/' + id;
//var port = 18043, mePath = '';

suite.next().use('localhost', port)
    .discuss('Twitter connector')
        .discuss('can get all friends and followers')
            .path(mePath + '/allContacts')
            .get()
                .expect(200)
                .expect('returns some friends or followers', function(err, res, body) {
                    assert.isNull(err);;
                    var friends = JSON.parse(body);
                    assert.isNotNull(friends);
                    assert.ok(friends.length > 0);
                })
            .unpath()
        .undiscuss()
    .undiscuss();
    
suite.next().use('localhost', port)
    .discuss('Twitter connector')
        .discuss('can get home timeline')
            .path(mePath + '/get_home_timeline')
            .get()
                .expect(200)
                .expect('returns some statuses', function(err, res, body) {
                    assert.isNull(err);;
                    var statuses = JSON.parse(body);
                    assert.isNotNull(statuses);
                    assert.ok(statuses.length > 0);
                })
            .unpath()
        .undiscuss()
    .undiscuss();
    
suite.next().use('localhost', port)
    .discuss('Twitter connector')
        .discuss('can get mentions')
            .path(mePath + '/get_mentions')
            .get()
                .expect(200)
                .expect('returns some mentions', function(err, res, body) {
                    assert.isNull(err);;
                    var statuses = JSON.parse(body);
                    assert.isNotNull(statuses);
                    assert.ok(statuses.length > 0);
                })
            .unpath()
        .undiscuss()
    .undiscuss();

suite.next().suite.addBatch({
    'When Twitter Connector got friends' : {
        topic:function() {
            var promise = new events.EventEmitter;
//            setTimeout(function() {
                fs.readdir('../Me/' + id + '/photos', function(err, files) {
                        if(err || !files || files.length < 2)
                            promise.emit('error', new Error);
                        else
                            promise.emit('success', true);
                    }
                );
//            }, 10000);
            return promise;
        },
        'it downloaded their profile photos':function(err, stat) {
            assert.isNull(err);
        }
    }
});
suite.export(module);
