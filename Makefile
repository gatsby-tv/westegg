APP_NAME ?= `grep '"name":' package.json | cut -d '"' -f4`
APP_VERSION ?= `grep '"version":' package.json | cut -d '"' -f4`
BUILD ?= `git rev-parse --short HEAD`

build:
	docker build -t $(APP_NAME) .

push:
	docker tag $(APP_NAME) gatsbytv/$(APP_NAME):latest
	docker tag $(APP_NAME) gatsbytv/$(APP_NAME):$(APP_VERSION)-$(BUILD)
	docker push --all-tags gatsbytv/$(APP_NAME)
