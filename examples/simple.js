var JSURL = require('jsurl');

var obj = {
	name: "John Doe",
	age: 42,
	children: ["Mary", "Bill"]
};

console.log("JSON    =" + JSON.stringify(obj));
console.log("JSURL   =" + JSURL.stringify(obj));
console.log("JSON+URL=" + encodeURIComponent(JSON.stringify(obj)));
console.log("RTRIP   =" + JSON.stringify(JSURL.parse(JSURL.stringify(obj))));