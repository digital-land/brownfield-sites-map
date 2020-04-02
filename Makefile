.PHONY: init render

init:
	git submodule update --init --recursive --remote
	npm install

render:
	npm run compile
