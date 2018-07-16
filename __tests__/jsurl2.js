const {stringify, parse, tryParse} = require('..')

// It only produces JSON parseable values if they are the same
const isJsonOk = (v, str) => {
	try {
		const out = JSON.parse(str)
		return v === out
	} catch (err) {
		return true
	}
}
// test macro, both directions
const cmp = (v, s, short, rich) => {
	// regular
	const richStr = stringify(v, {rich})
	expect(richStr).not.toMatch(/[%?#&=\n\r\0'<\\]/)
	expect(richStr).toBe(s)
	// roundtrip
	expect(stringify(parse(s), {rich})).toBe(s)
	// short
	const shortStr = stringify(v, {short: true, rich})
	expect(shortStr).toBe(short)
	expect(stringify(parse(short), {short: true, rich})).toBe(short)
	// not JSON
	expect(isJsonOk(v, richStr)).toBe(true)
	expect(isJsonOk(v, shortStr)).toBe(true)
}
cmp.title = (title, v, s) => `${title} ${s}`

test('basics', () => {
	// basic values
	cmp(undefined, '_U~', '_U')
	cmp(
		function() {
			foo()
		},
		'_U~',
		'_U'
	)
	cmp(null, '_N~', '_N')
	cmp(false, '_F~', '_F')
	cmp(true, '~', '')
	cmp(0, '0~', '0')
	cmp(1, '1~', '1')
	cmp(-1.5, '-1.5~', '-1.5')
	cmp('', '*~', '*')
	cmp('hello world\u203c', 'hello_world\u203c~', 'hello_world\u203c')
	cmp(
		' !"#$%&\'"()*+,-./09:;<=>?@AZ[\\]^_`az{|}\n\r\0~',
		'*_!"*H*S*.*A*""*C*D***P,-./09:;*L*E*G*Q@AZ[*B]^*_`az{|}*N*R*Z*-~',
		'*_!"*H*S*.*A*""*C*D***P,-./09:;*L*E*G*Q@AZ[*B]^*_`az{|}*N*R*Z*-'
	)
	cmp(
		'Ľồťś ǒƒ ửňìćọđé ẁћəệ!',
		'*Ľồťś_ǒƒ_ửňìćọđé_ẁћəệ!~',
		'*Ľồťś_ǒƒ_ửňìćọđé_ẁћəệ!'
	)
	// JSON.stringify converts special numeric values to null
	cmp(NaN, '_N~', '_N')
	cmp(Infinity, '_N~', '_N')
	cmp(-Infinity, '_N~', '_N')
	cmp(
		new Date(1456898746898),
		'*2016-03-02T06:05:46.898Z~',
		'*2016-03-02T06:05:46.898Z'
	)
	cmp(
		new Date('2017-04-01'),
		'*2017-04-01T00:00:00.000Z~',
		'*2017-04-01T00:00:00.000Z'
	)
	cmp(
		new Date(1456898746898),
		'_D2016-03-02T06:05:46.898Z~',
		'_D2016-03-02T06:05:46.898Z',
		true
	)
	cmp(new Date('2017-04-01'), '_D2017-04-01~', '_D2017-04-01', true)

	// arrays
	cmp([], '!~', '!')
	cmp([true], '!_T~', '!_T')
	cmp(
		[
			undefined,
			function() {
				foo()
			},
			null,
			false,
			0,
			'hello world\u203c',
		],
		'!_U~_U~_N~_F~0~hello_world\u203c~',
		'!_U~_U~_N~_F~0~hello_world\u203c'
	)

	// objects
	cmp({}, '()~', '(')
	cmp({a: true, b: true, c: true}, '(a~~b~~c)~', '(a~~b~~c')
	cmp(
		{
			a: undefined,
			b: function() {
				foo()
			},
			c: null,
			d: false,
			t: true,
			e: 0,
			f: 'hello (world)\u203c',
		},
		'(c~_N~d~_F~t~~e~0~f~hello_*Cworld*D\u203c)~',
		'(c~_N~d~_F~t~~e~0~f~hello_*Cworld*D\u203c'
	)
	cmp(
		{'()': {}, c: {'~': '()'}},
		'(*C*D~()c~(*-~**C*D))~',
		'(*C*D~()c~(*-~**C*D'
	)
	cmp({a: [[[1]]]}, '(a~!!!1)~', '(a~!!!1')
	// mix
	cmp(
		{
			a: [[1, 2], [], false, true, {}],
			c: {
				d: 'hello',
				e: {},
				f: [],
				g: true,
				n: null,
			},
			b: [],
		},
		'(a~!!1~2~~!~_F~_T~()~c~(d~hello~e~()f~!~g~~n~_N)b~!)~',
		'(a~!!1~2~~!~_F~_T~()~c~(d~hello~e~()f~!~g~~n~_N)b~!'
	)
	cmp([[{a: [{b: [[1]]}]}]], '!!(a~!(b~!!1))~', '!!(a~!(b~!!1')
})

test('percent-escaped single quotes', () => {
	expect(parse('(a~*%27hello~b~*%27world~)~', {deURI: true})).toEqual({
		a: "'hello",
		b: "'world",
	})
})

test('percent-escaped percent-escaped single quotes', () => {
	expect(parse('(a~*%2527hello~b~*%2525252527world~)~', {deURI: true})).toEqual(
		{
			a: "'hello",
			b: "'world",
		}
	)
})

test('tryParse', () => {
	expect(tryParse('_N~')).toBe(null)
	expect(tryParse('%5FN', 5, {deURI: true})).toBe(null)
	expect(tryParse('1~', 2)).toBe(1)
	expect(tryParse('_')).toBe(undefined)
	expect(tryParse('_', 0)).toBe(0)
	expect(tryParse('12323NOTANUMBER', 0)).toBe(0)
})

test('parse performance', () => {
	const n = Date.now()
	const v = {
		a: [[1, 2], [], false, {}, true],
		b: [],
		c: {d: 'hello', e: {}, f: [], g: true, n: null},
	}
	const s = stringify(v)
	const count = 10000
	for (let i = 0; i < count; i++) {
		parse(s, {deURI: true})
	}
	const ms = Date.now() - n
	console.log(`v2: ${count} parsed in ${ms}ms, ${ms / count}ms/item`)
	expect(ms < 300).toBe(true)
})

test('stringify performance', () => {
	const n = Date.now()
	const v = {
		a: [[1, 2], [], false, {}, true],
		b: [],
		c: {d: 'hello', e: {}, f: [], g: true, n: null},
	}
	const count = 10000
	for (let i = 0; i < count; i++) {
		stringify(v)
	}
	const ms = Date.now() - n
	console.log(`v2: ${count} stringified in ${ms}ms, ${ms / count}ms/item`)
	expect(ms < 300).toBe(true)
})

test('.toJSON()', () => {
	const o = {
		s: 'hi',
		toJSON() {
			return this.s
		},
	}
	expect(stringify(o)).toBe('hi~')
})

test('never JSON bareword', () => {
	expect(stringify('true')).toEqual('true~')
	expect(stringify('true', {short: true})).toEqual('*true')
	expect(stringify('false')).toEqual('false~')
	expect(stringify('false', {short: true})).toEqual('*false')
	expect(stringify('null')).toEqual('null~')
	expect(stringify('null', {short: true})).toEqual('*null')
})
