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
		'"': "'"
	}
	var toEscape = {
		'*': '*',
		'_': '_',
		'~': '-',
		'%': '.',
		'$': 'S',
		'+': 'P',
		"'": '"'
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
	var replaceRE = /([*_~%$+' ])/g
	function escape (s) {
		return s.replace(replaceRE, escCode)
	}
	function eat (a) {
		return a.splice(0, 1)[0]
	}

	function decode (a) {
		if (a.length === 0) {
			throw new Error('got empty array?')
		}
		var out, k, t
		var t = eat(a)
		if (!t) {return true}
		var c = t.charAt(0)
		if (c === '(') {
			out = {}
			t = t.slice(1)
			while (t && t.charAt(0) !== ')') {
				k = unescape(t)
				if (!a.length) {
					throw new Error('expected value after object key')
				}
				out[k] = decode(a)
				k = false
				if (a.length) {
					t = eat(a)
				}
			}
			if (t.charAt(0) === ')') {
				a.unshift(t.slice(1))
			}
		} else if (c === '!') {
			out = []
			a.unshift(t.slice(1))
			while (a[0]) {
				out.push(decode(a))
			}
			a.splice(0, 1)
		} else if (c === '_') {
			k = unescape(t.slice(1))
			if (k.charAt(0) === 'D') {
				out = new Date(k.slice(1))
			} else if (k in dict) {
				out = dict[k]
			} else {
				throw new Error('Unknown dict reference', k)
			}
		} else if (numRE.test(c)) {
			out = Number(t)
		} else if (stringRE.test(c)) {
			out = unescape(t)
		} else if (c === '*') {
			out = unescape(t.slice(1))
		} else {
			throw new Error('Cannot decode part ' + [t].concat(a).join('~'))
		}
		return out
	}

	function encode (v) {
		var t, a, out, T = typeof v

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
				for (var key in v) {
					if (v.hasOwnProperty(key)) {
						var val = encode(v[key])

						// skip undefined and functions
						if (val !== UNDEF + '~') {
							a.push(escape(key) + '~', val)
						}
					}
				}

				return '(' + a.join('') + ')'
			}
		} else {
			// function, undefined
			out = UNDEF
		}
		return out + '~'
	}

	exports.stringify = function (v) {
		return encode(v).replace(/~*$/, '~')
	}

	exports.parse = function (s) {
		if (!s) return s
		while (s.indexOf('%') !== -1) {
			s = decodeURIComponent(s)
		}
		if (s.slice(-1) !== '~') {
			throw new Error('not a JSURL2 string')
		}
		var parts = s.slice(0, -1).split('~')
		return decode(parts)
	}

	exports.tryParse = function (s, def) {
		try {
			return exports.parse(s)
		} catch (ex) {
			return def
		}
	}
})(typeof exports !== 'undefined' ? exports : (window.JSURL2 = window.JSURL2 || {}))
