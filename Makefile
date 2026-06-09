.PHONY: install run dev build up down logs test test-cov lint format clean

install:
	npm install

run:
	npm run start

dev:
	npm run start:dev

build:
	npm run build

up:
	docker compose up --build -d
	@echo ""
	@echo "API running at  http://localhost:3000"
	@echo "Swagger UI at   http://localhost:3000/docs"
	@echo "Health check at http://localhost:3000/health"

down:
	docker compose down

logs:
	docker compose logs -f api

test:
	npm run test

test-cov:
	npm run test:cov

test-e2e:
	npm run test:e2e

lint:
	npm run lint

format:
	npm run format

clean:
	rm -rf dist node_modules coverage
