# Builder Stage
FROM rust:1.93 AS builder
RUN apt-get update && apt-get install -y protobuf-compiler && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN cargo build --release -p worldos-grpc --bin worldos-engine

# Runtime Stage
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/worldos-engine /app/worldos-engine
EXPOSE 50051 50052
CMD ["./worldos-engine"]
