## JSURL

JSURL is an alternative to JSON + URL encoding (or JSON + base64 encoding). 
It makes it handy to pass complex values via URL query parameters.

JSURL has been designed to be:

* Compact: its output is much more compact than JSON + URL encoding (except in pathological cases). 
  It is even often slightly more compact than regular JSON!
* Readable: its output is much more readable than JSON + URL encoding.
* Foolproof: its output only contains characters that are unaffected by URL encoding/decoding. 
  There is no risk of missing a URL encoding/decoding pass, or of messing up a JSURL string by applying 
  an extra URL encoding or decoding pass.
* Easy to generate and parse

## Syntax

Think of it as JSON with the following changes:

* Curly braces (`{` and `}`) replaced by parentheses (`(` and `)`)
* Square brackets (`[` and `]`) replaced by `(~` and `)`
* Property names unquoted (but escaped -- see below).
* String values prefixed by a single quote (`'`) and escaped
* All other JSON punctuation (colon `:` and comma `,`) replaced by tildes (`~`)
* An extra tilde (`~`) at the very beginning.

Property names and string values are escaped as follows:

* Letters, digits, underscore (`_`), hyphen (`-`) and dot (`.`) are preserved.
* Dollar sign (`$`) is replaced by exclamation mark (`!`)
* Other characters with UNICODE value <= `0xff` are encoded as `*XX`
* Characters with UNICODE value > `0xff` are encoded as `**XXXX`

## Examples

JSON:

``` json
{"name":"John Doe","age":42,"children":["Mary","Bill"]}
```

JSON + URL encoding:

```
%7B%22name%22%3A%22John%20Doe%22%2C%22age%22%3A42%2C%22children%22%3A%5B%22Mary%22%2C%22Bill%22%5D%7D
```

JSURL:

``` jsurl
~(name~'John*20Doe~age~42~children~(~'Mary~'Bill))
```

## API

``` javascript
var JSURL = require("jsurl");

str = JSURL.stringify(obj);
obj = JSURL.parse(str);

// return def instead of throwing on error
obj = JSURL.tryParse(str[, def]);
```

# Installation

The easiest way to install `jsurl` is with NPM:

```sh
npm install jsurl
```

## License

This work is licensed under the [MIT license](http://en.wikipedia.org/wiki/MIT_License).
