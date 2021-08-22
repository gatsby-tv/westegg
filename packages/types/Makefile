APP_NAME ?= `grep '"name":' package.json | cut -d '"' -f4`
APP_VERSION ?= `grep '"version":' package.json | cut -d '"' -f4`
PUBLISHED_VERSION ?= `npm show @gatsby-tv/types version`

.PHONY: build push

build:
	yarn format:check
	yarn build

push:
	@echo Published version: $(PUBLISHED_VERSION)
	@echo Local version: $(APP_VERSION)
# Check if package version is newer than current published
	@if [ "$(PUBLISHED_VERSION)" != "$(APP_VERSION)" ]; then npm publish; fi
