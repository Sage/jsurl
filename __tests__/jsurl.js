const {stringify, parse, tryParse} = require('../v1')

// test macro, both directions
const cmp = (v, s) => {
	// regular
	expect(stringify(v)).toBe(s)
	// roundtrip
	expect(stringify(parse(s))).toBe(s)
}

// basic values
test('basics', () => {
	cmp(undefined, undefined)
	cmp(function() {
		foo()
	}, undefined)
	cmp(null, '~null')
	cmp(false, '~false')
	cmp(true, '~true')
	cmp(0, '~0')
	cmp(1, '~1')
	cmp(-1.5, '~-1.5')
	cmp('hello world\u203c', "~'hello*20world**203c")
	cmp(
		' !"#$%&\'()*+,-./09:;<=>?@AZ[\\]^_`az{|}~',
		"~'*20*21*22*23!*25*26*27*28*29*2a*2b*2c-.*2f09*3a*3b*3c*3d*3e*3f*40AZ*5b*5c*5d*5e_*60az*7b*7c*7d*7e"
	)
	// JSON.stringify converts special numeric values to null
	cmp(NaN, '~null')
	cmp(Infinity, '~null')
	cmp(-Infinity, '~null')

	// arrays
	cmp([], '~(~)')
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
		"~(~null~null~null~false~0~'hello*20world**203c)"
	)

	// objects
	cmp({}, '~()')
	cmp(
		{
			a: undefined,
			b: function() {
				foo()
			},
			c: null,
			d: false,
			e: 0,
			f: 'hello world\u203c',
		},
		"~(c~null~d~false~e~0~f~'hello*20world**203c)"
	)

	// mix
	cmp(
		{
			a: [[1, 2], [], {}],
			b: [],
			c: {
				d: 'hello',
				e: {},
				f: [],
			},
		},
		"~(a~(~(~1~2)~(~)~())~b~(~)~c~(d~'hello~e~()~f~(~)))"
	)
})

test('percent-escaped single quotes', () => {
	expect(parse('~(a~%27hello~b~%27world)')).toEqual({
		a: 'hello',
		b: 'world',
	})
})

test('percent-escaped percent-escaped single quotes', () => {
	expect(parse('~(a~%2527hello~b~%2525252527world)')).toEqual({
		a: 'hello',
		b: 'world',
	})
})

test('tryParse', () => {
	expect(tryParse('~null')).toBe(null)
	expect(tryParse('~1', 2)).toBe(1)
	expect(tryParse('1')).toBe(undefined)
	expect(tryParse('1', 0)).toBe(0)
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
		parse(s)
	}
	const ms = Date.now() - n
	console.log(`${count} parsed in ${ms}ms, ${ms / count}ms/item`)
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
	console.log(`${count} stringified in ${ms}ms, ${ms / count}ms/item`)
	expect(ms < 300).toBe(true)
})
