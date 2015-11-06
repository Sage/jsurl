"use strict";

var fs = require('fs');
var fsp = require('path');

var root = fsp.join(__dirname, 'common');
var tests = fs.readdirSync(root).filter(function(file) {
	return /\.js$/.test(file);
}).map(function(file) {
	return fsp.join(root, file);
});

var testrunner = require("qunit");

process.on('uncaughtException', function(err) {
	console.error(err.stack);
	process.exit(1);
});

testrunner.run({
	code: '',
    tests: tests,
}, function(err) {
	if (err) throw err;
});
