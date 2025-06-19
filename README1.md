
# Task 1 – Create and Run Multi-Container App with Docker Compose 

### 1. docker-compose.yml

```
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    depends_on:
      - mongo
    networks:
      - appnet

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - appnet

  mongo:
    image: mongo
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: 123
    networks:
      - appnet

networks:
  appnet:
    driver: bridge
```

### 🔧 General Configuration

```yaml
version: '3.8'
```
Specifies the Docker Compose file format version. Version 3.8 is compatible with Docker 18.06+ and supports advanced networking and service options.

🧩 Services

🔙 Backend Service

```
backend:
  build: ./backend
  ports:
    - "3001:3001"
  depends_on:
    - mongo
  networks:
    - appnet
```

- build: Builds the backend image from the ./backend directory.

- ports: Maps port 3001 on the host to port 3001 inside the container.

- depends_on: Ensures MongoDB starts before the backend.

- networks: Connects to the shared appnet network.


🌐 Frontend Service

```
frontend:
  build: ./frontend
  ports:
    - "3000:3000"
  depends_on:
    - backend
  networks:
    - appnet
```

- build: Builds the frontend image from the ./frontend directory.

- ports: Maps port 3000 on the host to port 3000 inside the container.

- depends_on: Ensures the frontend waits for the backend to start.

- networks: Connects to the shared appnet network.


🗄️ MongoDB Service

```
mongo:
  image: mongo
  ports:
    - "27017:27017"
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: 123
  networks:
    - appnet
```

- image: Pulls the official MongoDB image from Docker Hub.

- ports: Maps MongoDB’s default port 27017 to the host.

- environment: Sets root username and password for MongoDB.

- networks: Connects MongoDB to the shared network.


🌐 Network Configuration

```
networks:
  appnet:
    driver: bridge
```

Defines a custom bridge network named appnet for internal communication between services.


| Service    | Description        | Port  | Depends On |
| ---------- | ------------------ | ----- | ---------- |
| `mongo`    | Database (MongoDB) | 27017 | —          |
| `backend`  | API/Logic Layer    | 3001  | `mongo`    |
| `frontend` | User Interface     | 3000  | `backend`  |


🚀 How to Run the App

Start the Application

```
docker-compose up -d --build
```

Verify Running Containers

```
docker-compose ps
```

You should see frontend, backend, and mongo containers listed with Up status.


🔍 Inspect Networking Between Containers
To test if the containers can communicate with each other, use:

```
docker exec -it <container_name> ping <service_name>
```

To stop and remove all containers:
```
docker-compose down
```
