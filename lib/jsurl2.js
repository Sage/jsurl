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
		return s.replace(escapeRE, origChar)
	}
	var replaceRE = /([*_~%$+'() ])/g
	function escape (s) {
		return s.replace(replaceRE, escCode)
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
		if (c === '~') {
			eatOne(a)
			out = true
		} else if (c === '(') {
			eatOne(a)
			out = {}
			while (c = peek(a), c && c !== ')') {
				k = unescape(eat(a))
				t = decode(a)
				if (t === EOS) {
					throw new Error('expected value after object key')
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
		} else if (numRE.test(c)) {
			out = Number(eat(a))
		} else if (stringRE.test(c)) {
			out = unescape(eat(a))
		} else if (c === '*') {
			eatOne(a)
			out = unescape(eat(a))
		} else {
			throw new Error('Cannot decode part ' + [t].concat(a).join('~'))
		}
		return out
	}

	var endTildesRE = /~*$/
	function encode (v) {
		var t, a, out, T = typeof v, val

		if (T === 'number') {
			out = isFinite(v) ? v : NULL
		} else if (T === 'boolean') {
			out = v ? '' : FALSE
		} else if (T === 'string') {
			t = escape(v)
			if (stringRE.test(t)) {
				out = t
			} else {
				out = '*' + t
			}
		} else if (T === 'object') {
			if (!v) {
				out = NULL
			} else if (v instanceof Date) {
				out = '_D' + v.toJSON().replace('T00:00:00.000Z', '')
			} else if (Array.isArray(v)) {
				a = []
				for (var i = 0; i < v.length; i++) {
					t = encode(v[i])
					// Special case: only use full -T~ in arrays
					a[i] = (t === '~' ? TRUE + '~' : t) || NULL
				}

				out = '!' + a.join('')
			} else {
				a = []
				val = undefined
				for (var key in v) {
					if (v.hasOwnProperty(key)) {
						val = encode(v[key])

						// skip undefined and functions
						if (val !== UNDEF + '~') {
							a.push(escape(key) + '~', val)
						}
					}
				}
				t = a.join('')
				if (val !== true) {
					t = t.replace(endTildesRE, '')
				}

				return '(' + t + ')'
			}
		} else {
			// function, undefined
			out = UNDEF
		}
		return out + '~'
	}

	exports.stringify = function (v) {
		return encode(v).replace(endTildesRE, '~')
	}

	exports.parse = function (s, options) {
		if (!s) return s
		if (options && options.deURI) {
			while (s.indexOf('%') !== -1) {
				s = decodeURIComponent(s)
			}
		}
		var l = s.length
		if (s.charAt(l - 1) !== '~') {
			throw new Error('not a JSURL2 string')
		}
		return decode({s: s, i: 0, l: l})
	}

	exports.tryParse = function (s, def) {
		try {
			return exports.parse(s)
		} catch (ex) {
			return def
		}
	}
})(typeof exports !== 'undefined' ? exports : (window.JSURL2 = window.JSURL2 || {}))
