# Importing[⬆](../README.md#contents)

```javascript
const ExcelJS = require('exceljs');
```

## ES5 Imports[⬆](../README.md#contents)

To use the ES5 transpiled code, for example for node.js versions older than 10, use the dist/es5 path.

```javascript
const ExcelJS = require('exceljs/dist/es5');
```

**Note:** The ES5 build has an implicit dependency on a number of polyfills which are no longer
 explicitly added by exceljs.
 You will need to add "core-js" and "regenerator-runtime" to your dependencies and
 include the following requires in your code before the exceljs import:

```javascript
// polyfills required by exceljs
require('core-js/modules/es.promise');
require('core-js/modules/es.string.includes');
require('core-js/modules/es.object.assign');
require('core-js/modules/es.object.keys');
require('core-js/modules/es.symbol');
require('core-js/modules/es.symbol.async-iterator');
require('regenerator-runtime/runtime');

const ExcelJS = require('exceljs/dist/es5');
```

For IE 11, you'll also need a polyfill to support unicode regex patterns. For example,

```js
const rewritePattern = require('regexpu-core');
const {generateRegexpuOptions} = require('@babel/helper-create-regexp-features-plugin/lib/util');

const {RegExp} = global;
try {
  new RegExp('a', 'u');
} catch (err) {
  global.RegExp = function(pattern, flags) {
    if (flags && flags.includes('u')) {
      return new RegExp(rewritePattern(pattern, flags, generateRegexpuOptions({flags, pattern})));
    }
    return new RegExp(pattern, flags);
  };
  global.RegExp.prototype = RegExp.prototype;
}
```

## Browserify[⬆](../README.md#contents)

ExcelJS publishes two browserified bundles inside the dist/ folder:

One with implicit dependencies on core-js polyfills...
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.26.0/polyfill.js"></script>
<script src="exceljs.js"></script>
```

And one without...
```html
<script src="--your-project's-pollyfills-here--"></script>
<script src="exceljs.bare.js"></script>
```
