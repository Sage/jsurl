import test from 'ava'
import {stringify, parse, tryParse} from '../lib/jsurl'

// test macro, both directions
const cmp = (t, v, s) => {
	// regular
	t.is(stringify(v), s)
	// roundtrip
	t.is(stringify(parse(s)), s)
}
cmp.title = (title, v, s) => `${title} ${s}`

// basic values
test(cmp, undefined, undefined)
test(cmp, function () {
	foo()
}, undefined)
test(cmp, null, '~null')
test(cmp, false, '~false')
test(cmp, true, '~true')
test(cmp, 0, '~0')
test(cmp, 1, '~1')
test(cmp, -1.5, '~-1.5')
test(cmp, 'hello world\u203c', "~'hello*20world**203c")
test(cmp, ' !"#$%&\'()*+,-./09:;<=>?@AZ[\\]^_`az{|}~', "~'*20*21*22*23!*25*26*27*28*29*2a*2b*2c-.*2f09*3a*3b*3c*3d*3e*3f*40AZ*5b*5c*5d*5e_*60az*7b*7c*7d*7e")
// JSON.stringify converts special numeric values to null
test(cmp, NaN, '~null')
test(cmp, Infinity, '~null')
test(cmp, -Infinity, '~null')

// arrays
test(cmp, [], '~(~)')
test(cmp, [undefined, function () {
	foo()
},
	null, false, 0, 'hello world\u203c'], "~(~null~null~null~false~0~'hello*20world**203c)")

// objects
test(cmp, {}, '~()')
test(cmp, {
	a: undefined,
	b: function () {
		foo()
	},
	c: null,
	d: false,
	e: 0,
	f: 'hello world\u203c'
}, "~(c~null~d~false~e~0~f~'hello*20world**203c)")

// mix
test(cmp, {
	a: [
		[1, 2],
		[], {}],
	b: [],
	c: {
		d: 'hello',
		e: {},
		f: []
	}
}, "~(a~(~(~1~2)~(~)~())~b~(~)~c~(d~'hello~e~()~f~(~)))")

test('percent-escaped single quotes', t => {
	t.deepEqual(parse('~(a~%27hello~b~%27world)'), {
		a: 'hello',
		b: 'world'
	})
})

test('percent-escaped percent-escaped single quotes', t => {
	t.deepEqual(parse('~(a~%2527hello~b~%2525252527world)'), {
		a: 'hello',
		b: 'world'
	})
})

test('tryParse', t => {
	t.is(tryParse('~null'), null)
	t.is(tryParse('~1', 2), 1)
	t.is(tryParse('1'), undefined)
	t.is(tryParse('1', 0), 0)
})
