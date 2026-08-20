# ========================================================
# Stage 1: Build & Compile Rust Backend
# ========================================================
FROM rust:1.80-bookworm AS builder

WORKDIR /usr/src/perdana

# Install dependencies needed for compilation
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Copy workspace configuration & source files
COPY Cargo.toml Cargo.lock ./
COPY packages/entity ./packages/entity
COPY apps/backend ./apps/backend

# Build release binary
RUN cargo build --release --bin backend

# ========================================================
# Stage 2: Minimal Production Runtime Image
# ========================================================
FROM debian:bookworm-slim AS runner

WORKDIR /app

# Install runtime SSL certificates & OpenSSL
RUN apt-get update && apt-get install -y ca-certificates libssl3 tzdata && rm -rf /var/lib/apt/lists/*

# Set Indonesian timezone (WIB)
ENV TZ=Asia/Jakarta

# Copy compiled binary from builder
COPY --from=builder /usr/src/perdana/target/release/backend /app/backend

# Expose port
EXPOSE 8800

# Set default environment
ENV RUST_LOG=info
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=8800

# Run the backend binary
CMD ["/app/backend"]
