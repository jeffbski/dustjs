#
# Run all tests
#
test:
	node test/server.js

#
# Run the benchmarks
#
bench:
	node benchmark/server.js

#
# Build the docs
#
docs:
	node docs/build.js

#
# Build the parser
#
parser:
	node src/build.js

#
# Build dust.js
#

SRC = lib
VERSION = ${shell cat package.json | grep version | grep -o '[0-9]\.[0-9]\.[0-9a-zA-Z]\+'}
CORE = dist/dust-core-${VERSION}.js
CORE_MIN = dist/dust-core-${VERSION}.min.js
FULL = dist/dust-full-${VERSION}.js
FULL_MIN = dist/dust-full-${VERSION}.min.js

define HEADER
//
// Dust - Asynchronous Templating v${VERSION}
// http://akdubya.github.com/dustjs
//
// Copyright (c) 2010, Aleksander Williams
// Released under the MIT License.
//
// Modifications by Jeff Barczewski
//

endef

export HEADER

dist-core:
	@@mkdir -p dist
	node node_modules/.bin/r.js -o src/dist-core.build.js out=${CORE}.tmp
	@@touch ${CORE}
	@@echo "$$HEADER" > ${CORE}
	@@cat ${CORE}.tmp >> ${CORE}
	@@rm ${CORE}.tmp
	@@echo ${CORE} built

dist-full:
	@@mkdir -p dist
	node node_modules/.bin/r.js -o src/dist-full.build.js out=${FULL}.tmp
	@@touch ${FULL}
	@@echo "$$HEADER" > ${FULL}
	@@cat ${FULL}.tmp >> ${FULL}
	@@rm ${FULL}.tmp
	@@echo ${FULL} built

min-core:
	@@mkdir -p dist
	node node_modules/.bin/r.js -o src/dist-core.build.js out=${CORE_MIN}.tmp optimize=uglify
	@@touch ${CORE_MIN}
	@@echo "$$HEADER" > ${CORE_MIN}
	@@cat ${CORE_MIN}.tmp >> ${CORE_MIN}
	@@rm ${CORE_MIN}.tmp
	@@echo ${CORE_MIN} built

min-full:
	@@mkdir -p dist
	node node_modules/.bin/r.js -o src/dist-full.build.js out=${FULL_MIN}.tmp optimize=uglify
	@@touch ${FULL_MIN}
	@@echo "$$HEADER" > ${FULL_MIN}
	@@cat ${FULL_MIN}.tmp >> ${FULL_MIN}
	@@rm ${FULL_MIN}.tmp
	@@echo ${FULL_MIN} built

min: dust
	@@echo minifying...
	@@echo "$$HEADER" > ${CORE_MIN}
	@@echo "$$HEADER" > ${FULL_MIN}
	@@minmin ${CORE} >> ${CORE_MIN}
	@@minmin ${FULL} >> ${FULL_MIN}

clean:
	git rm dist/*

release: clean docs min
	git add dist/*
	git commit -a -m "release v${VERSION}"
	git tag -a -m "version v${VERSION}" v${VERSION}


.PHONY: test docs bench parser