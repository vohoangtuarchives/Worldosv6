FROM rust:latest
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates pkg-config protobuf-compiler && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN cargo build --release -p worldos-grpc --bin worldos-engine
EXPOSE 50051
EXPOSE 50052
ENV GRPC_ADDR=0.0.0.0:50051
ENV HTTP_ADDR=0.0.0.0:50052
CMD ["./target/release/worldos-engine"]
