/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
// 
(function(exports) {
	"use strict";
	exports.stringify = function stringify(v) {
		function encode(s) {
			return !/[^\w-.]/.test(s) ? s : s.replace(/[^\w-.]/g, function(ch) {
				if (ch === '$') return '!';
				ch = ch.charCodeAt(0);
				// thanks to Douglas Crockford for the negative slice trick
				return ch < 0x100 ? '*' + ('00' + ch.toString(16)).slice(-2) : '**' + ('0000' + ch.toString(16)).slice(-4);
			});
		}

		switch (typeof v) {
			case 'number':
				return isFinite(v) ? '~' + v : '~null';
			case 'boolean':
				return '~' + v;
			case 'string':
				return "~'" + encode(v);
			case 'object':
				if (!v) return '~null';
				if (Array.isArray(v)) {
					return '~(' + (v.map(function(elt) {
						return stringify(elt) || '~null';
					}).join('') || '~') + ')';
				} else {
					return '~(' + Object.keys(v).map(function(key) {
						var val = stringify(v[key]);
						// skip undefined and functions
						return val && (encode(key) + val);
					}).filter(function(str) {
						return str;
					}).join('~') + ')';
				}
			default:
				// function, undefined
				return;
		}
	};

	var reserved = {
		true: true,
		false: false,
		null: null
	};

	exports.parse = function(s) {
		if (!s) return s;
		var i = 0,
			len = s.length;

		function eat(expected) {
			if (s[i] !== expected) throw new Error("bad JSURL syntax: expected " + expected + ", got " + (s && s[i]));
			i++;
		}

		function decode() {
			var beg = i,
				ch, r = "";
			while (i < len && (ch = s[i]) !== '~' && ch !== ')') {
				switch (ch) {
					case '*':
						if (beg < i) r += s.substring(beg, i);
						if (s[i + 1] === '*') r += String.fromCharCode(parseInt(s.substring(i + 2, i + 6), 16)), beg = (i += 6);
						else r += String.fromCharCode(parseInt(s.substring(i + 1, i + 3), 16)), beg = (i += 3);
						break;
					case '!':
						if (beg < i) r += s.substring(beg, i);
						r += '$', beg = ++i;
						break;
					default:
						i++;
				}
			}
			return r + s.substring(beg, i);
		}

		return (function parseOne() {
			var result, ch, beg;
			eat('~');
			switch (ch = s[i]) {
				case '(':
					i++;
					if (s[i] === '~') {
						result = [];
						if (s[i + 1] === ')') i++;
						else {
							do {
								result.push(parseOne());
							} while (s[i] === '~');
						}
					} else {
						result = {};
						if (s[i] !== ')') {
							do {
								var key = decode();
								result[key] = parseOne();
							} while (s[i] === '~' && ++i);
						}
					}
					eat(')');
					break;
				case "'":
					i++;
					result = decode();
					break;
				default:
					beg = i++;
					while (i < len && /[^)~]/.test(s[i]))
					i++;
					var sub = s.substring(beg, i);
					if (/[\d\-]/.test(ch)) {
						result = parseFloat(sub);
					} else {
						result = reserved[sub];
						if (typeof result === "undefined") throw new Error("bad value keyword: " + sub);
					}
			}
			return result;
		})();
	}
})(typeof exports !== 'undefined' ? exports : (window.JSURL = window.JSURL || {}));