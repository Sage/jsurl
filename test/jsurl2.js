import test from 'ava'
import {stringify, parse, tryParse} from '../lib/jsurl2'

// test macro, both directions
const cmp = (t, v, s, short) => {
	// regular
	t.is(stringify(v), s)
	// roundtrip
	t.is(stringify(parse(s)), s)
	// short
	t.is(stringify(v, {short: true}), short)
	t.is(stringify(parse(short), {short: true}), short)
}
cmp.title = (title, v, s) => `${title} ${s}`

// basic values
test(cmp, undefined, '_U~', '_U')
test(cmp, function () { foo(); }, '_U~', '_U')
test(cmp, null, '_N~', '_N')
test(cmp, false, '_F~', '_F')
test(cmp, true, '~', '')
test(cmp, 0, '0~', '0')
test(cmp, 1, '1~', '1')
test(cmp, -1.5, '-1.5~', '-1.5')
test(cmp, '', '*~', '*')
test(cmp, 'hello world\u203c', 'hello_world\u203c~', 'hello_world\u203c')
test(cmp,
	' !"#$%&\'()*+,-./09:;<=>?@AZ[\\]^_`az{|}~',
	'*_!"#*S*.&*"*C*D***P,-./09:;<=>?@AZ[\\]^*_`az{|}*-~',
	'*_!"#*S*.&*"*C*D***P,-./09:;<=>?@AZ[\\]^*_`az{|}*-'
)
// JSON.stringify converts special numeric values to null
test(cmp, NaN, '_N~', '_N')
test(cmp, Infinity, '_N~', '_N')
test(cmp, -Infinity, '_N~', '_N')
test(cmp, new Date(1456898746898), '_D2016-03-02T06:05:46.898Z~', '_D2016-03-02T06:05:46.898Z')
test(cmp, new Date('2017-04-01'), '_D2017-04-01~', '_D2017-04-01')

// arrays
test(cmp, [], '!~', '!')
test(cmp, [true], '!_T~', '!_T')
test(cmp,
	[
		undefined, function () {
			foo()
		},
		null, false, 0, 'hello world\u203c'
	],
	'!_U~_U~_N~_F~0~hello_world\u203c~',
	'!_U~_U~_N~_F~0~hello_world\u203c'
)

// objects
test(cmp, {}, '()~', '(')
test(cmp, {a: true, b: true, c: true}, '(a~~b~~c)~', '(a~~b~~c')
test(cmp,
	{
		a: undefined,
		b: function () {
			foo()
		},
		c: null,
		d: false,
		t: true,
		e: 0,
		f: 'hello (world)\u203c'
	},
	'(c~_N~d~_F~t~~e~0~f~hello_*Cworld*D\u203c)~',
	'(c~_N~d~_F~t~~e~0~f~hello_*Cworld*D\u203c',
)
test(cmp, {"()": {}, c: {"~": "()"}}, '(*C*D~()c~(*-~**C*D))~', '(*C*D~()c~(*-~**C*D')
test(cmp, {a: [[[1]]]}, '(a~!!!1)~', '(a~!!!1')
// mix
test(cmp, {
	a: [
		[1, 2],
		[],
		false,
		true,
		{},
	],
	c: {
		d: 'hello',
		e: {},
		f: [],
		g: true,
		n: null
	},
	b: [],
}, '(a~!!1~2~~!~_F~_T~()~c~(d~hello~e~()f~!~g~~n~_N)b~!)~', '(a~!!1~2~~!~_F~_T~()~c~(d~hello~e~()f~!~g~~n~_N)b~!')
test(cmp, [[{a: [{b: [[1]]}]}]], '!!(a~!(b~!!1))~', '!!(a~!(b~!!1')

test('percent-escaped single quotes', t => {
	t.deepEqual(parse('(a~*%27hello~b~*%27world~)~', {deURI: true}), {
		a: "'hello",
		b: "'world"
	})
})

test('percent-escaped percent-escaped single quotes', t => {
	t.deepEqual(parse('(a~*%2527hello~b~*%2525252527world~)~', {deURI: true}), {
		a: "'hello",
		b: "'world"
	})
})

test('tryParse', t => {
	t.is(tryParse('_N~'), null)
	t.is(tryParse('1~', 2), 1)
	t.is(tryParse('_'), undefined)
	t.is(tryParse('_', 0), 0)
})

test('parse performance', t => {
	const n = Date.now()
	const v = { a: [ [1, 2], [], false, {}, true ], b: [], c: { d: 'hello', e: {}, f: [], g: true, n: null } }
	const s = stringify(v)
	const count = 10000
	for (let i = 0; i < count; i++) {
		parse(s)
	}
	const ms = Date.now() - n
	console.log(`v2: ${count} parsed in ${ms}ms, ${ms / count}ms/item`)
	t.true(ms < 300)
})

test('stringify performance', t => {
	const n = Date.now()
	const v = { a: [ [1, 2], [], false, {}, true ], b: [], c: { d: 'hello', e: {}, f: [], g: true, n: null } }
	const count = 10000
	for (let i = 0; i < count; i++) {
		stringify(v)
	}
	const ms = Date.now() - n
	console.log(`v2: ${count} stringified in ${ms}ms, ${ms / count}ms/item`)
	t.true(ms < 300)
})

test('.toJSON()', t => {
	const o = {s: 'hi', toJSON() {return this.s}}
	t.is(stringify(o), 'hi~')
})
