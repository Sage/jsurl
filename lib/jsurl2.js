// TODO custom objects, support Set, Map etc
// TODO custom dictionary
;(function(exports) {
	'use strict'
	var hasOwnProperty = new Object().hasOwnProperty
	var stringRE = /^[a-zA-Z]/
	var numRE = /^[\d-]/
	var TRUE = '_T'
	var FALSE = '_F'
	var NULL = '_N'
	var UNDEF = '_U'
	var NAN = '_n'
	var INF = '_I'
	var NINF = '_J'

	var dict = {
		T: true,
		F: false,
		N: null,
		U: undefined,
		n: NaN,
		I: Infinity,
		J: -Infinity,
	}

	var fromEscape = {
		'*': '*',
		_: '_',
		'-': '~',
		S: '$',
		P: '+',
		'"': "'",
		C: '(', // not necessary but we keep it for symmetry
		D: ')',
		L: '<',
		G: '>', // not necessary but we keep it for symmetry
		'.': '%',
		Q: '?',
		H: '#',
		A: '&',
		E: '=',
		B: '\\',
		N: '\n',
		R: '\r',
		U: '\u2028',
		Z: '\0',
	}
	var toEscape = {
		'*': '*',
		_: '_',
		'~': '-',
		$: 'S',
		'+': 'P',
		"'": '"',
		'(': 'C',
		')': 'D',
		'<': 'L',
		'>': 'G',
		'%': '.',
		'?': 'Q',
		'#': 'H',
		'&': 'A',
		'=': 'E',
		'\\': 'B',
		'\n': 'N',
		'\r': 'R',
		'\0': 'Z',
		'\u2028': 'U',
	}
	function origChar(s) {
		if (s === '_') {
			return ' '
		}
		var c = fromEscape[s.charAt(1)]
		if (!c) {
			throw new Error('Illegal escape code', s)
		}
		return c
	}
	function escCode(c) {
		if (c === ' ') {
			return '_'
		}
		return '*' + toEscape[c]
	}
	var escapeRE = /(_|\*.)/g
	function unescape(s) {
		// oddly enough, testing first is faster
		return escapeRE.test(s) ? s.replace(escapeRE, origChar) : s
	}
	// First half: encoding chars; second half: URI and script chars
	var replaceRE = /([*_~$+'() <>%?#&=\\\n\r\0\u2028])/g
	function escape(s) {
		// oddly enough, testing first is faster
		return replaceRE.test(s) ? s.replace(replaceRE, escCode) : s
	}
	function eat(a) {
		var j, c
		for (
			j = a.i;
			j < a.l && ((c = a.s.charAt(j)), c !== '~' && c !== ')');
			j++
		) {}
		var w = a.s.slice(a.i, j)
		if (c === '~') {
			j++
		}
		a.i = j
		return w
	}
	function peek(a) {
		return a.s.charAt(a.i)
	}
	function eatOne(a) {
		a.i++
	}
	var EOS = {} // unique symbol
	function decode(a) {
		var out, k, t
		var c = peek(a)
		if (!c) {
			return EOS
		}
		if (c === '(') {
			eatOne(a)
			out = {}
			while (((c = peek(a)), c && c !== ')')) {
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
			while (((c = peek(a)), c && c !== '~' && c !== ')')) {
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
			if (isNaN(out)) {
				throw new Error('Not a number', c)
			}
		} else if (stringRE.test(c)) {
			out = unescape(eat(a))
		} else {
			throw new Error('Cannot decode part ' + [t].concat(a).join('~'))
		}
		return out
	}

	function encode(v, out, rich, depth) {
		var t,
			T = typeof v

		if (T === 'number') {
			out.push(
				isFinite(v)
					? v.toString()
					: rich
						? isNaN(v)
							? NAN
							: v > 0
								? INF
								: NINF
						: NULL
			)
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
			} else if (rich && v instanceof Date) {
				out.push('_D' + v.toJSON().replace('T00:00:00.000Z', ''))
			} else if (typeof v.toJSON === 'function') {
				encode(v.toJSON(), out, rich, depth)
			} else if (Array.isArray(v)) {
				out.push('!')
				for (var i = 0; i < v.length; i++) {
					t = v[i]
					// Special case: only use full -T~ in arrays
					if (t === true) {
						out.push(TRUE)
					} else {
						encode(t, out, rich, depth + 1)
					}
				}
				out.push('')
			} else {
				out.push('(')
				for (var key in v) {
					if (hasOwnProperty.call(v, key)) {
						t = v[key]
						if (t !== undefined && typeof t !== 'function') {
							out.push(escape(key))
							encode(t, out, rich, depth + 1)
						}
					}
				}
				while (out[out.length - 1] === '') {
					out.pop()
				}
				out.push(')')
			}
		} else {
			// function or undefined
			out.push(rich || depth === 0 ? UNDEF : NULL)
		}
	}

	var antiJSON = {true: '*true', false: '*false', null: '*null'}
	exports.stringify = function(v, options) {
		var out = [],
			t,
			str = '',
			len,
			sep = false,
			short = options && options.short,
			rich = options && options.rich
		encode(v, out, rich, 0)
		// until where we have to stringify
		len = out.length - 1
		while (((t = out[len]), t === '' || (short && t === ')'))) {
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
		if (short) {
			if (str.length < 6) {
				t = antiJSON[str]
				if (t) str = t
			}
		} else {
			str += '~'
		}
		return str
	}

	function clean(s) {
		var out = ''
		var i = 0
		var j = 0
		var c
		while (i < s.length) {
			c = s.charCodeAt(i)
			if (c === 37) {
				// %
				if (i > j) out += s.slice(j, i)
				i++
				while (c === 37) {
					c = parseInt(s.slice(i, i + 2), 16)
					i += 2
				}
				if (c > 32) {
					// not a control character or space
					out += String.fromCharCode(c)
				}
				j = i
			} else if (c <= 32) {
				if (i > j) out += s.slice(j, i)
				i++
				j = i
			} else {
				i++
			}
		}
		if (i > j) out += s.slice(j, i)
		return out
	}

	var JSONRE = /^({|\[|"|true$|false$|null$)/
	exports.parse = function(s, options) {
		if (options && options.deURI) s = clean(s)
		if (JSONRE.test(s)) return JSON.parse(s)
		var l = s.length
		// if (s.charAt(l - 1) !== '~') {
		// 	throw new Error('not a JSURL2 string')
		// }
		var r = decode({s: s, i: 0, l: l})
		return r === EOS ? true : r
	}

	exports.tryParse = function(s, def, options) {
		try {
			return exports.parse(s, options)
		} catch (ex) {
			return def
		}
	}
})(
	typeof exports !== 'undefined' ? exports : (window.JSURL = window.JSURL || {})
)
