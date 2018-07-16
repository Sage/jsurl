## JSURL

JSURL exists in two flavors: v1 and v2

### JSURL v2

JSURL v2 aims to be a drop-in replacement for JSON encoding with better size and time characteristics.

JSURL v2 has been designed to be

- Fast: our test case actually outperforms native JSON
- Compact: shorter output than JSON and v1
- Readable: more readable than v1 in many cases as well as leaving accented characters unchanged (so they are readable in URLs and embeds)
- URI-ready: It does not encode everything that should be URI-encoded, but it does encode all delimiters of query strings.
  - You can embed it as part of a query string, and normally you won't need to do any URI encoding yourself (browser/http client will take care of that).
  - It will be correctly detected as part of the URI by most auto-URL-from-text implementations.
- embed-ready:
  - embeddable in \<script> tags inside single-quoted JS strings
  - `rich` mode encodes/decodes `Date` objects
- Easy to generate and parse
- Easy upgrade: it can parse JSON as well, and it will never generate valid JSON unless when it's the correct representation

The most important difference with v1 is that it might need extra URI-encoding depending on your needs. You can also pass `{deURI: true}` as an option to `parse()` so it will handle any URI encoding automatically.

Given its speed and size, it is also suited to pass JS values to scripts in HTML, like initial data after Server-Side-Rendering. To do so, embed the result inside a single-quoted string (not double-quoted) and parse that in your script.

Some room has been left in the encoding space for special values. If you enable `rich` on the stringifier, it will encode JS Date objects so that they decode as JS Date objects, and later it might support custom encode/decode of your own object types.

#### v2 syntax

You don't need to know this to use it, but this might be interesting:

v2 uses the allowable characters in URI schemes for multiple purposes depending on the location in the result. Some examples:

- `!` starts an array if it is the first character in a value, but inside a string it is unchanged.
- `~` and `)` are used as end-of-value and end-of-object delimiters, and are illegal inside encoded values.
- `*` starts a string, but can be left out if the first string character is a-z. Inside a string, it escapes special characters.
- whitespace is never legal, so you can strip it before parsing if it can be introduced accidentally

v2 has a `short` mode, which omits the unnecessary ending delimiters. You can use this to save a few more bytes, but you won't be able to spot an encoded value on sight by the ending `~`.

Since browsers may choose to encode any character with URI escaping, and special characters are shown in URLs, no attempt is made to make v2 URI-neutral. Decoding will work no matter how many encodings happened, if you pass the `deURI: true` option to the parser.

### JSURL v1

JSURL v1 is an alternative to JSON + URL encoding (or JSON + base64 encoding).
It makes it handy to pass complex values via URL query parameters.

JSURL v1 has been designed to be:

- Compact: its output is much more compact than JSON + URL encoding (except in pathological cases).
  It is even often slightly more compact than regular JSON!
- Readable: its output is much more readable than JSON + URL encoding.
- Foolproof: its output only contains characters that are unaffected by URL encoding/decoding (but see note)
  There is no risk of missing a URL encoding/decoding pass, or of messing up a JSURL string by applying
  an extra URL encoding or decoding pass.
- Easy to generate and parse

Notes:

- a JSURLv1 encoded value will get its `'` characters URI-encoded by most browsers, due to security concerns that surfaced after v1 was created. v2 does not use `'` for structural encoding.
- a JSURLv1 encoded value at the end of a URL placed in plaintext might not be detected as fully part of the URL by auto-URL-detectors (as used by email clients etc). v2 fixes this by always ending in `~`.

#### v1 Syntax

Think of it as JSON with the following changes:

- Curly braces (`{` and `}`) replaced by parentheses (`(` and `)`)
- Square brackets (`[` and `]`) replaced by `(~` and `)`
- Property names unquoted (but escaped -- see below).
- String values prefixed by a single quote (`'`) and escaped
- All other JSON punctuation (colon `:` and comma `,`) replaced by tildes (`~`)
- An extra tilde (`~`) at the very beginning.

Property names and string values are escaped as follows:

- Letters, digits, underscore (`_`), hyphen (`-`) and dot (`.`) are preserved.
- Dollar sign (`$`) is replaced by exclamation mark (`!`)
- Other characters with UNICODE value <= `0xff` are encoded as `*XX`
- Characters with UNICODE value > `0xff` are encoded as `**XXXX`

## Examples

JSON:

```json
{"name": "John Doé", "age": 42, "user": true, "children": ["Mary", "Bill"]}
```

JSON + URL encoding:

```jsonuri
%7B%22name%22%3A%22John%20Do%C3%22%2C%22age%22%3A42%2C%22user%22%3Atrue%2C%22children%22%3A%5B%22Mary%22%2C%22Bill%22%5D%7D
```

JSURL v1:

```jsurl
~(name~'John*20Do*e9~age~42~user~true~children~(~'Mary~'Bill))
```

JSURL v2:

```jsurl2
(name~John_Doé~age~42~user~~children~!Mary~Bill)~
```

## v2 API

```javascript
var JSURL = require("jsurl");

// Options:
// * `rich`: encode Date so it decodes as Date
// * `short`: remove optional trailing delimiters
str = JSURL.stringify(obj[, options]);

// Options:
// * `deURI`: handle any URI encoding that may still be present
obj = JSURL.parse(str[, options]);

// return def instead of throwing on error; options are like parse
obj = JSURL.tryParse(str[, def][, options]);
```

## v1 API

The old API is still available if you need to decode v1 stringifieds.

```javascript
var JSURL1 = require("jsurl/v1");

str = JSURL1.stringify(obj);
obj = JSURL1.parse(str);

// return def instead of throwing on error
obj = JSURL1.tryParse(str[, def]);
```

# Installation

The easiest way to install `jsurl` is with NPM:

```sh
npm install jsurl
```

## License

This work is licensed under the [MIT license](http://en.wikipedia.org/wiki/MIT_License).
