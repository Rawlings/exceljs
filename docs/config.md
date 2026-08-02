# Config[⬆](../README.md#contents)<!-- Link generated with jump2header -->

ExcelJS now supports dependency injection for the promise library.
 You can restore Bluebird promises by including the following code in your module...

```javascript
ExcelJS.config.setValue('promise', require('bluebird'));
```

Please note: I have tested ExcelJS with bluebird specifically (since up until recently this was the library it used).
 From the tests I have done it will not work with Q.

# Caveats[⬆](../README.md#contents)<!-- Link generated with jump2header -->

## Dist Folder[⬆](../README.md#contents)<!-- Link generated with jump2header -->

Before publishing this module, the source code is transpiled and otherwise processed
before being placed in a dist/ folder.
This README identifies two files - a browserified bundle and minified version.
No other contents of the dist/ folder are guaranteed in any way other than the file
specified as "main" in the package.json


# Known Issues[⬆](../README.md#contents)<!-- Link generated with jump2header -->

## Testing with Puppeteer[⬆](../README.md#contents)<!-- Link generated with jump2header -->

The test suite included in this lib includes a small script executed in a headless browser
to validate the bundled packages. At the time of this writing, it appears that
this test does not play nicely in the Windows Linux subsystem.

For this reason, the browser test can be disabled by the existence of a file named .disable-test-browser

```bash
sudo apt-get install libfontconfig
```

## Splice vs Merge[⬆](../README.md#contents)<!-- Link generated with jump2header -->

If any splice operation affects a merged cell, the merge group will not be moved correctly
