# =============================================================================
# STAGE 1: BUILD — Compile the Spring Boot app using Maven
# =============================================================================
# maven:3.9-eclipse-temurin-17 = Maven 3.9 + Eclipse Temurin JDK 17 (official OpenJDK build)
# This image has everything needed to build: Java, Maven, git, etc.
FROM maven:3.9-eclipse-temurin-17 AS build

# Set working directory inside the container
WORKDIR /app

# Copy the Maven wrapper first (so Docker can cache the dependency download layer)
# The wrapper (mvnw, mvnw.cmd, .mvn/) lets us build WITHOUT installing Maven on the host
COPY mvnw mvnw.cmd ./
COPY .mvn/ .mvn/

# Copy pom.xml first — this lets Docker cache the dependency download layer
# If pom.xml hasn't changed, Docker reuses the cached layer (HUGE time saver)
COPY pom.xml .

# Download all dependencies (cached unless pom.xml changes)
# -B = batch mode (non-interactive), -DskipTests = skip tests for faster build
RUN ./mvnw -B dependency:go-offline -DskipTests

# Now copy the actual source code
COPY src/ src/

# Build the executable JAR (fat JAR with all dependencies bundled)
# spring-boot-maven-plugin creates target/nexus-backend-0.0.1-SNAPSHOT.jar
RUN ./mvnw -B package -DskipTests


# =============================================================================
# STAGE 2: RUNTIME — Tiny JRE-only image to run the app
# =============================================================================
# eclipse-temurin:17-jre-alpine = JRE 17 (not full JDK) on Alpine Linux
# ~50MB vs ~1GB for the build image — minimal attack surface, fast startup
FROM eclipse-temurin:17-jre-alpine AS runtime

# Create a non-root user for security (containers shouldn't run as root)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy the built JAR from the build stage
# The JAR name matches the artifactId + version from pom.xml
COPY --from=build /app/target/nexus-backend-0.0.1-SNAPSHOT.jar app.jar

# Change ownership to non-root user
RUN chown appuser:appgroup app.jar

# Switch to non-root user
USER appuser

# Expose port 8080 (Spring Boot default) — documentation only, doesn't actually open the port
EXPOSE 8080

# Environment variables with defaults (can be overridden at runtime via docker run -e or docker-compose)
ENV SERVER_PORT=8080 \
    SPRING_PROFILES_ACTIVE=docker

# JVM options for containers — important for memory limits in Docker
# -XX:MaxRAMPercentage=75.0 = use max 75% of container memory for heap
# -Djava.security.egd=file:/dev/./urandom = faster startup entropy
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Entry point — runs the JAR with the JVM options
# Using "exec" form (array) so signals (SIGTERM) are passed to the JVM for graceful shutdown
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]