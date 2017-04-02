// TODO custom objects, support Set, Map etc
// TODO custom dictionary
;(function (exports) {
	'use strict'
	var stringRE = /^[a-zA-Z]/
	var numRE = /^[\d-]/
	var TRUE = '_T'
	var FALSE = '_F'
	var NULL = '_N'
	var UNDEF = '_U'

	var dict = {
		T: true,
		F: false,
		N: null,
		U: undefined,
	}

	var fromEscape = {
		'*': '*',
		'_': '_',
		'-': '~',
		'.': '%',
		'S': '$',
		'P': '+',
		'"': "'",
		'C': '(',
		'D': ')',
	}
	var toEscape = {
		'*': '*',
		'_': '_',
		'~': '-',
		'%': '.',
		'$': 'S',
		'+': 'P',
		"'": '"',
		'(': 'C',
		')': 'D',
	}
	function origChar (s) {
		if (s === '_') {
			return ' '
		}
		var c = fromEscape[s.charAt(1)]
		if (!c) {
			throw new Error('Illegal escape code', s)
		}
		return c
	}
	function escCode (c) {
		if (c === ' ') {
			return '_'
		}
		return '*' + toEscape[c]
	}
	var escapeRE = /(_|\*.)/g
	function unescape (s) {
		// oddly enough, testing first is faster
		return escapeRE.test(s) ? s.replace(escapeRE, origChar) : s
	}
	var replaceRE = /([*_~%$+'() ])/g
	function escape (s) {
		// oddly enough, testing first is faster
		return replaceRE.test(s) ? s.replace(replaceRE, escCode) : s
	}
	function eat (a) {
		var j, c
		for (
			var j = a.i;
			j < a.l && (c = a.s.charAt(j), c !== '~' && c !== ')');
			j++
		) {}
		var w = a.s.slice(a.i, j)
		if (c === '~') {
			j++
		}
		a.i = j
		return w
	}
	function peek (a) {
		return a.s.charAt(a.i)
	}
	function eatOne (a) {
		a.i++
	}
	var EOS = {} // unique symbol
	function decode (a) {
		var out, k, t
		var c = peek(a)
		if (!c) {return EOS}
		if (c === '(') {
			eatOne(a)
			out = {}
			while (c = peek(a), c && c !== ')') {
				k = unescape(eat(a))
				c = peek(a)
				if (c && c !== ')') {
					t = decode(a)
				} else {
					t = true
				}
				out[k] = t
			}
			if (c === ')') {
				eatOne(a)
			}
		} else if (c === '!') {
			eatOne(a)
			out = []
			while (c = peek(a), c && c !== '~' && c !== ')') {
				out.push(decode(a))
			}
			if (c === '~') {
				eatOne(a)
			}
		} else if (c === '_') {
			eatOne(a)
			k = unescape(eat(a))
			if (k.charAt(0) === 'D') {
				out = new Date(k.slice(1))
			} else if (k in dict) {
				out = dict[k]
			} else {
				throw new Error('Unknown dict reference', k)
			}
		} else if (c === '*') {
			eatOne(a)
			out = unescape(eat(a))
		} else if (c === '~') {
			eatOne(a)
			out = true
		} else if (numRE.test(c)) {
			out = Number(eat(a))
		} else if (stringRE.test(c)) {
			out = unescape(eat(a))
		} else {
			throw new Error('Cannot decode part ' + [t].concat(a).join('~'))
		}
		return out
	}

	var endTildesRE = /~*$/
	function encode (v, out) {
		var t, a, T = typeof v, val, prefix

		if (T === 'number') {
			out.push(isFinite(v) ? v.toString() : NULL)
		} else if (T === 'boolean') {
			out.push(v ? '' : FALSE)
		} else if (T === 'string') {
			t = escape(v)
			if (stringRE.test(t)) {
				out.push(t)
			} else {
				out.push('*' + t)
			}
		} else if (T === 'object') {
			if (!v) {
				out.push(NULL)
			} else if (v instanceof Date) {
				out.push('_D' + v.toJSON().replace('T00:00:00.000Z', ''))
			} else if (Array.isArray(v)) {
				out.push('!')
				for (var i = 0; i < v.length; i++) {
					t = v[i]
					// Special case: only use full -T~ in arrays
					if (t === true) {
						out.push(TRUE)
					} else {
						encode(t, out)
					}
				}
				out.push('')
			} else {
				out.push('(')
				for (var key in v) {
					if (v.hasOwnProperty(key)) {
						t = v[key]
						if (t !== undefined && typeof t !== 'function') {
							out.push(escape(key))
							encode(t, out)
						}
					}
				}
				while(out[out.length - 1] === '') {
					out.pop()
				}
				out.push(')')
			}
		} else {
			// function, undefined
			out.push(UNDEF)
		}
	}

	const closeObjRE = /\)+$/g
	const noTilde = {'!': true, '(': true, ')': true}
	exports.stringify = function (v, options) {
		var out = [], t, str = '', len, sep = false, short = options && options.short
		encode(v, out)
		len = out.length - 1
		// until where we have to stringify
		while(t = out[len], t === '' || (short && t === ')')) {
			len--
		}
		// extended join('~')
		for (var i = 0; i <= len; i++) {
			t = out[i]
			if (sep && t !== ')') {
				str += '~'
			}
			str += t
			sep = !(t === '!' || t === '(' || t === ')')
		}
		if (!short) {
			str += '~'
		}
		return str
	}

	exports.parse = function (s, options) {
		if (options && options.deURI) {
			while (s.indexOf('%') !== -1) {
				s = decodeURIComponent(s)
			}
		}
		var l = s.length
		// if (s.charAt(l - 1) !== '~') {
		// 	throw new Error('not a JSURL2 string')
		// }
		var r = decode({s: s, i: 0, l: l})
		return r === EOS ? true : r
	}

	exports.tryParse = function (s, def) {
		try {
			return exports.parse(s)
		} catch (ex) {
			return def
		}
	}
})(typeof exports !== 'undefined' ? exports : (window.JSURL2 = window.JSURL2 || {}))
