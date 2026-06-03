include Makefile

build-backend:
	mkdir -p ${BIN_DIR}
	go build -ldflags="$(LDFLAGS) -s -w" -v -o ${BIN_DIR}/${APP_NAME} ./cmd
build-front:
	make ui	


run:
	DAGU_HOME=data \
	DAGU_DEBUG=true \
	go run -v ./cmd start-all

.PHONY: deploy
deploy:
	cd ../SuConfig/linux/asus && make docker-dagu
