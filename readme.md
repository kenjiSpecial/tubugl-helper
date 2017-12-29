# tubugl-helper

[![NPM version][npm-image]][npm-url] 

helper tool for [tubugl](https://github.com/kenjiSpecial/tubugl)

## install

To install it with npm:

```sh
npm install tubugl-helper
```

To install it with yarn:

```sh
yarn add tubugl-helper
```

## usage

### Grid Helper

```js
import { GridHelper } from 'tubugl-helper';

// ----------------
// ----------------

let gridHelper = new GridHelper(gl, 1000, 1000, 20, 20);

// ----------------
// ----------------

gridHelper.render(camera);
```

### Normal Helper
```js
import { NormalHelper } from 'tubugl-helper';

// ----------------
// ----------------

let normalHelper = new NormalHelper(gl, roundingCube);

// ----------------
// ----------------

normalHelper.render(camera);
```

## examples

https://kenjispecial.github.io/tubugl-helper/

### example with grid helper

https://kenjispecial.github.io/tubugl-helper/app00/index.html

### example with normal helper

https://kenjispecial.github.io/tubugl-helper/app01/index.html

## Running the examples locally

you need to install [parcel](https://github.com/parcel-bundler/parcel) to run examples locally

install node modules locally

```sh
yarn
yarn run
```

## TODO


[npm-image]: https://img.shields.io/npm/v/tubugl-helper.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/tubugl-helper 
