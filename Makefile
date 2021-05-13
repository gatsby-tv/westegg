APP_NAME ?= `grep '"name":' package.json | cut -d '"' -f4`
APP_VERSION ?= `grep '"version":' package.json | cut -d '"' -f4`
BUILD ?= `git rev-parse --short HEAD`

build:
	docker build -t $(APP_NAME) .

push:
# Latest tag
	docker tag $(APP_NAME) gatsbytv/$(APP_NAME):latest
	docker push gatsbytv/$(APP_NAME):latest
# Versioned tag
	docker tag $(APP_NAME) gatsbytv/$(APP_NAME):$(APP_VERSION)-$(BUILD)
	docker push gatsbytv/$(APP_NAME):$(APP_VERSION)-$(BUILD)
