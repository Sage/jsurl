import test from 'ava'
import JSURL from '../lib/jsurl2'

// test macro, both directions
const cmp = (t, v, s) => {
	// regular
	t.is(JSURL.stringify(v), s)
	// roundtrip
	t.is(JSURL.stringify(JSURL.parse(s)), s)
}
cmp.title = (title, v, s) => `${title} ${s}`

// basic values
test(cmp, undefined, '_U~')
test(cmp, function () { foo(); }, '_U~')
test(cmp, null, '_N~')
test(cmp, false, '_F~')
test(cmp, true, '~')
test(cmp, 0, '0~')
test(cmp, 1, '1~')
test(cmp, -1.5, '-1.5~')
test(cmp, 'hello world\u203c', 'hello_world\u203c~')
test(cmp, ' !"#$%&\'()*+,-./09:;<=>?@AZ[\\]^_`az{|}~', '*_!"#*S*.&*"()***P,-./09:;<=>?@AZ[\\]^*_`az{|}*-~')
// JSON.stringify converts special numeric values to null
test(cmp, NaN, '_N~')
test(cmp, Infinity, '_N~')
test(cmp, -Infinity, '_N~')
test(cmp, new Date(1456898746898), '_D2016-03-02T06:05:46.898Z~')
test(cmp, new Date('2017-04-01'), '_D2017-04-01~')

// arrays
test(cmp, [], '!~')
test(cmp,
	[
		undefined, function () {
			foo()
		},
		null, false, 0, 'hello world\u203c'
	],
	'!_U~_U~_N~_F~0~hello_world\u203c~'
)

// objects
test(cmp, {}, '()~')
test(cmp, {
	a: undefined,
	b: function () {
		foo()
	},
	c: null,
	d: false,
	t: true,
	e: 0,
	f: 'hello (world)\u203c'
}, '(c~_N~d~_F~t~~e~0~f~hello_(world)\u203c~)~')

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
}, '(a~!!1~2~~!~_F~_T~()~c~(d~hello~e~()f~!~g~~n~_N~)b~!~)~')

test('percent-escaped single quotes', t => {
	t.deepEqual(JSURL.parse('(a~*%27hello~b~*%27world~)~'), {
		a: "'hello",
		b: "'world"
	})
})

test('percent-escaped percent-escaped single quotes', t => {
	t.deepEqual(JSURL.parse('(a~*%2527hello~b~*%2525252527world~)~'), {
		a: "'hello",
		b: "'world"
	})
})

test('tryParse', t => {
	t.is(JSURL.tryParse('_N~'), null)
	t.is(JSURL.tryParse('1~', 2), 1)
	t.is(JSURL.tryParse('1'), undefined)
	t.is(JSURL.tryParse('1', 0), 0)
})
