"use strict";
QUnit.module(module.id);

var JSURL = require("../..");
var undefined;

function t(v, r) {
	strictEqual(JSURL.stringify(v), r, "stringify " + (typeof v !== 'object' ? v : JSON.stringify(v)));
	strictEqual(JSURL.stringify(JSURL.parse(JSURL.stringify(v))), r, "roundtrip " + (typeof v !== 'object' ? v : JSON.stringify(v)));
}

test('basic values', 26, function() {
	t(undefined, undefined);
	t(function() {
		foo();
	}, undefined);
	t(null, "~null");
	t(false, "~false");
	t(true, "~true");
	t(0, "~0");
	t(1, "~1");
	t(-1.5, "~-1.5");
	t("hello world\u203c", "~'hello*20world**203c");
	t(" !\"#$%&'()*+,-./09:;<=>?@AZ[\\]^_`az{|}~", "~'*20*21*22*23!*25*26*27*28*29*2a*2b*2c-.*2f09*3a*3b*3c*3d*3e*3f*40AZ*5b*5c*5d*5e_*60az*7b*7c*7d*7e");
	// JSON.stringify converts special numeric values to null
	t(NaN, "~null");
	t(Infinity, "~null");
	t(-Infinity, "~null");
});
test('arrays', 4, function() {
	t([], "~(~)");
	t([undefined, function() {
		foo();
	},
	null, false, 0, "hello world\u203c"], "~(~null~null~null~false~0~'hello*20world**203c)");
});
test('objects', 4, function() {
	t({}, "~()");
	t({
		a: undefined,
		b: function() {
			foo();
		},
		c: null,
		d: false,
		e: 0,
		f: "hello world\u203c"
	}, "~(c~null~d~false~e~0~f~'hello*20world**203c)");
});
test('mix', 2, function() {
	t({
		a: [
			[1, 2],
			[], {}],
		b: [],
		c: {
			d: "hello",
			e: {},
			f: []
		}
	}, "~(a~(~(~1~2)~(~)~())~b~(~)~c~(d~'hello~e~()~f~(~)))");
});