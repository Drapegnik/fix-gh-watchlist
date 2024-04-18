version-patch:
	npm version patch

version-minor:
	npm version minor

publish:
	npm run build
	cd dist && npm publish --access public
