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
test(cmp, undefined, '-U~')
test(cmp, function () { foo(); }, '-U~')
test(cmp, null, '-N~')
test(cmp, false, '-F~')
test(cmp, true, '~')
test(cmp, 0, '0~')
test(cmp, 1, '1~')
test(cmp, -1.5, '-1.5~')
test(cmp, 'hello world\u203c', 'hello_world\u203c~')
test(cmp, ' !"#$%&\'()*+,-./09:;<=>?@AZ[\\]^_`az{|}~', "*_!\"#*S*.&*\"()***P,-./09:;<=>?@AZ[\\]^*_`az{|}*-~")
// JSON.stringify converts special numeric values to null
test(cmp, NaN, '-N~')
test(cmp, Infinity, '-N~')
test(cmp, -Infinity, '-N~')
test(cmp, new Date(1456898746898), '-D2016-03-02T06:05:46.898Z~')
test(cmp, new Date('2017-04-01'), '-D2017-04-01~')

// arrays
test(cmp, [], '.~')
test(cmp,
	[
		undefined, function () {
			foo()
		},
		null, false, 0, 'hello world\u203c'
	],
	".-U~-U~-N~-F~0~hello_world\u203c~"
)

// objects
test(cmp, {}, '_~')
test(cmp, {
	a: undefined,
	b: function () {
		foo()
	},
	c: null,
	d: false,
	t: true,
	e: 0,
	f: 'hello world\u203c'
}, "_c~-N~d~-F~t~~e~0~f~hello_world\u203c~")

// mix
test(cmp, {
	a: [
		[1, 2],
		[],
		false,
		{},
		true,
	],
	b: [],
	c: {
		d: 'hello',
		e: {},
		f: [],
		g: true,
		n: null,
	}
}, '_a~..1~2~~.~-F~_~-T~~b~.~c~_d~hello~e~_~f~.~g~~n~-N~')

test('percent-escaped single quotes', t => {
	t.deepEqual(JSURL.parse('_a~*%27hello~b~*%27world~'), {
		a: '\'hello',
		b: '\'world',
	})
})

test('percent-escaped percent-escaped single quotes', t => {
	t.deepEqual(JSURL.parse('_a~*%2527hello~b~*%2525252527world~'), {
		a: '\'hello',
		b: '\'world'
	})
})

test('tryParse', t => {
	t.is(JSURL.tryParse('-N~'), null)
	t.is(JSURL.tryParse('1~', 2), 1)
	t.is(JSURL.tryParse('1'), undefined)
	t.is(JSURL.tryParse('1', 0), 0)
})
