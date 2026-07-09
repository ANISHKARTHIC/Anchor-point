up-dev:
	sudo docker-compose -f ./deployment/local-docker-compose.yml down --rmi all --volumes --remove-orphans
	sudo docker-compose -f ./deployment/local-docker-compose.yml up --build

up-prod: ## Run the application in Prod mode
	sudo docker-compose -f ./deployment/prod-docker-compose.yml up --build	

help: ## Display this help message
	@awk -F '##' '/^[a-z-]+:[a-z ]+##/ { print "\033[34m"$$1"\033[0m" "\n" $$2 }' Makefile	

lint: ## Lint
	python3 -m black --line-length 120 .

check-lint: ## Check Lint 
	python3 -m black --check --line-length 120 .

testing: ## testing
	pytest

local-remove-images: ## Removes locally present dangling images
	sudo docker rmi -f $(sudo docker images -f "dangling=true" -q);	