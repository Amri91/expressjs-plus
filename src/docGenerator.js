/**
 * Created by Amri on 11/11/2016.
 */
'use strict';
const jsdoc2md = require('jsdoc-to-markdown');
const fs = require('fs');
const path = require('path');

/* input and output paths */
const inputFile = 'src/index.js';
const outputFile = 'readme.md';

jsdoc2md.render({ files: inputFile }).then((res) => {
    fs.writeFileSync(outputFile, res);
});