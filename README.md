# Week 7 Final Project – Docker Compose & Azure VM

## Overview

This project demonstrates a full-stack application deployed via Docker Compose to an Azure Virtual Machine. It includes:

- A frontend and backend (Node.js and react).
- Docker Compose configuration with volumes, custom networks, and `.env` variables.
- CI/CD pipeline using GitHub Actions.
- Deployment to a remote Azure VM.
- Healthchecks and persistent data volumes.
- Automated or manual deployment pipeline (optional: Slack notifications).

---

## 1. Architecture Diagram

![Architecture Diagram](image.png)

**Key elements shown:**

- Frontend and Backend services
- Docker Volumes for data persistence
- Custom Docker Network
- Use of environment variables via `.env`
- CI/CD pipeline
- Azure VM hosting both services

---

## 2. Project Structure

```
project/
├── .github/
│   └── workflows/
│       ├── backend-test.yml
│       └── deploy-to-azure.yml
│       └── deploy-VM.yml
│       └── docker-build-backend.yml
│       └── docker-build-frontend.yml
│       └── frontend-test.yml
│       └── notify-backend.yml
│       └── notify-frontend.yml
├── backend/
│   ├── .dockerignore
│   ├── .gitignore
│   ├── Dockerfile
│   ├── User.js
│   ├── eslint.config.js
│   ├── index.js
│   ├── package-lock.json
│   ├── package.json
│   └── users.test.js
├── frontend/
│   └── (React app files)
├── .gitignore
├── README.md
├── docker-compose.yml
├── package-lock.json
```

---

## 3. Build Application

We built a full-stack app using **Node.js** for the backend and **React** for the frontend.  
Each service has its own `Dockerfile`:

### Backend Dockerfile (`backend/Dockerfile`)

```dockerfile
FROM node:18-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "run", "dev"]
```

- Uses `node:18-slim` base image.
- Installs `curl` for healthcheck support.
- Runs the development server on port `8080`.

---

### Frontend Dockerfile (`frontend/Dockerfile`)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN apk add --no-cache curl

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

- Uses `node:18-alpine` for a small image.
- Installs dependencies via `package.json`.
- Adds `curl` for healthcheck support.
- Runs the app on port `3000`.

---

> Both services include **Docker healthchecks** in `docker-compose.yml`,  
> and are connected via a custom Docker network (`appnet`).

---

## 3. Docker Compose Configuration

### docker-compose.yml Highlights

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "${BACKEND_PORT}:${BACKEND_PORT}"
    env_file:
      - .env
    depends_on:
      - mongo
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${BACKEND_PORT}"]
      interval: 30s
      timeout: 5s
      retries: 3
    restart: unless-stopped
    networks:
      - appnet

  frontend:
    build: ./frontend
    ports:
      - "${FRONTEND_PORT}:${FRONTEND_PORT}"
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${FRONTEND_PORT}"]
      interval: 20s
      timeout: 5s
      retries: 5
      start_period: 40s
    restart: unless-stopped
    networks:
      - appnet

  mongo:
    image: mongo
    ports:
      - "${MONGO_PORT}:${MONGO_PORT}"
    env_file:
      - .env
    volumes:
      - mongo-data:/data/db
    networks:
      - appnet

volumes:
  mongo-data:


networks:
  appnet:
    driver: bridge
```

---

## 🔐 4. .env File

```env
FRONTEND_PORT=3000
BACKEND_PORT=8080
MONGO_HOST=mongo
MONGO_PORT=27017
MONGO_DB=testdb
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=admin123
```

**Why use `.env`?**

- Keeps sensitive info out of source code
- Easier config for different environments
- Automatically loaded by Docker Compose

---

## 5. Azure VM Setup & Deployment

### Manual Deployment Steps

### 1. Create Azure VM  
- Set up a **Linux VM (Ubuntu recommended, free-tier if available)** via Azure Portal.
- **Ensure SSH access is enabled** (port 22 should be open).
- Copy the **public IP address** of the VM for remote connection.

### 2. Connect to the VM via SSH  
To connect, use the following command:

```bash
ssh azureuser@<public-ip>
```

If authentication fails, verify that:
- You are using the correct **username** (default on Ubuntu VMs is usually `azureuser`).
- You have **uploaded your SSH key** in Azure Portal during VM creation.
- Your **local SSH key** matches the VM's public key (`~/.ssh/id_rsa.pub`).

If you're using **password-based authentication**, Azure might require additional configurations. You can check authentication settings in Azure Portal under *VM > Networking > SSH settings*.

### 3. Install Docker & Docker Compose  
If Docker isn't installed, run:

```bash
sudo apt update
sudo apt install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Verify installation:

```bash
docker --version
docker compose version
```

### 4. Copy Project Files to VM  
Transfer your project files using **`scp`**:

```bash
scp -r ./project azureuser@<public-ip>:~/app
```

 **Ensure SSH is working before running this command**.  
 If using an SSH key, you might need `-i ~/.ssh/id_rsa` if not using the default key.

### 5. Deploy the App  

```bash
cd project
sudo docker compose up -d
```

 This starts the application in the background (`-d` = detached mode).  
 Ensure **`docker-compose.yml`** exists inside the `app` directory.

### 6. Expose the Application on Public Port  
By default, Azure virtual machines are protected by **Network Security Groups (NSGs)** that block all **incoming** traffic except for specific allowed ports.  
To access your app (e.g., running on port `8080`) **from the internet**, you need to manually allow inbound traffic to that port.

###  Steps to open ports 8080:

```yaml
1. Go to Azure Portal → your VM → Networking tab.
2. Under Inbound port rules, click + Add inbound port rule.
3. Fill the form as follows:
   - Source: Any  
     → Allows connections from all external IP addresses (can restrict for security).
   - Source port ranges: *  
     → Accepts traffic from any source port (standard).
   - Destination: Any  
     → Refers to any destination IP within the VM (standard).
   - Destination port ranges: 8080  
     → The public port your container is exposed on (e.g., Nginx running on port 8080).
   - Protocol: TCP  
     → Most web traffic uses TCP; this is the common setting for web apps.
   - Action: Allow  
     → Approves traffic instead of denying it.
   - Priority: 1010  
     → Determines rule evaluation order; lower = higher priority. Must be unique.
   - Name: Allow-Web-8080 (or any descriptive name)
4. Click Add to apply the rule.
```

---

### Purpose of Each Field

| Field                    | Meaning                                                                 |
|--------------------------|-------------------------------------------------------------------------|
| `Source`                 | Who is allowed to access. `Any` means anyone on the internet.          |
| `Source port ranges`     | The port the client is using. `*` allows all.                          |
| `Destination`            | Which IP in your VM is the target. `Any` is default.                   |
| `Destination port ranges`| The port you want to open (e.g., `8080`).                              |
| `Protocol`               | Usually `TCP` for web, `UDP` for streaming/games.                      |
| `Action`                 | Whether to `Allow` or `Deny` the connection.                           |
| `Priority`               | Lower numbers are evaluated first. Important if rules conflict.        |
| `Name`                   | Just a label to identify the rule.                                     |

---

### Inbound vs. Outbound – What's the Difference?

| Direction  | Explanation                                                                 |
|------------|-----------------------------------------------------------------------------|
| **Inbound**  | Traffic **coming into** your VM from the internet (e.g., users accessing your app). |
| **Outbound** | Traffic **going out** from your VM to the internet (e.g., your app calling an API). |

- You typically **configure inbound rules** to allow external access.
- **Outbound rules** are usually open by default, unless restricted for security reasons.

### then verify with:

```bash
curl http://<public-ip>:8080
```

### Verify Running Containers

After starting the app, you can check that the containers are running correctly with:

```bash
sudo docker ps
```
![Docker PS](image.png)

---

## 6. CI/CD – GitHub Actions

### CI Flow Overview

The main pipeline is defined in `.github/workflows/ManageUsers CICD.yml` and is triggered on:

- Push to `master`
- Tags matching `v*.*.*`
- Pull requests
- Manual workflow dispatch

It coordinates several sub-workflows:

| Job Name         | Description                                  |
|------------------|----------------------------------------------|
| `backend-test`   | Runs backend tests (`backend-test.yml`)      |
| `frontend-test`  | Runs frontend tests (`frontend-test.yml`)    |
| `deploy`         | Deploys the app to Azure VM (`deploy-VM.yml`)|
| `backend-notify` | Sends Slack notification after backend tests |
| `frontend-notify`| Sends Slack notification after frontend tests|

Each job uses the `uses:` syntax to call reusable workflows and `secrets: inherit` to securely pass credentials and secrets.

---

### Deployment Workflow – `deploy-VM.yml`

This workflow handles automatic deployment to the Azure VM using SSH and `rsync`.

#### Steps:

1. **Checkout Repository**

   Uses the latest codebase from GitHub.

2. **SSH Key Setup**

    Sets up the private key securely and adds the Azure VM host to known_hosts (to avoid interactive SSH prompts like Are you sure you want to continue connecting? during deployment).

   ```bash
   echo "${{ secrets.AZURE_PRIVATE_KEY }}" > ~/.ssh/id_rsa
   chmod 600 ~/.ssh/id_rsa
   ssh-keyscan -p ${{ secrets.REMOTE_PORT }} ${{ secrets.AZURE_HOST }} >> ~/.ssh/known_hosts
   ```

3. **Create `.env` File**

   Dynamically generates the environment file for Docker Compose:

   ```bash
   echo "FRONTEND_PORT=3000" >> .env
   echo "BACKEND_PORT=8080" >> .env
   echo "MONGO_HOST=mongo" >> .env
   echo "MONGO_PORT=27017" >> .env
   echo "MONGO_DB=testdb" >> .env
   echo "MONGO_INITDB_ROOT_USERNAME=admin" >> .env
   echo "MONGO_INITDB_ROOT_PASSWORD=admin123" >> .env
   ```

4. **Sync Files to VM**

   Uses `rsync` over SSH to copy all project files to the Azure VM:

   ```bash
   rsync -avz -e "ssh -p ${{ secrets.REMOTE_PORT }} -i ~/.ssh/id_rsa" ./ ${{ secrets.AZURE_USER }}@${{ secrets.AZURE_HOST }}:/home/${{ secrets.AZURE_USER }}/app/
   ```

5. **Remote Deployment**

   Runs `docker compose up -d` on the VM to start all services:

   ```bash
   ssh -p ${{ secrets.REMOTE_PORT }} -i ~/.ssh/id_rsa ${{ secrets.AZURE_USER }}@${{ secrets.AZURE_HOST }} \
     "cd /home/${{ secrets.AZURE_USER }}/app && sudo docker compose up -d"
   ```

6. **Log Collection**

   Fetches and stores container logs from the VM:

   ```bash
   ssh -p ${{ secrets.REMOTE_PORT }} -i ~/.ssh/id_rsa ${{ secrets.AZURE_USER }}@${{ secrets.AZURE_HOST }} \
     "cd /home/${{ secrets.AZURE_USER }}/app && sudo docker-compose logs" > ./deploy-to-azure-vm.txt
   ```

7. **Upload Logs as Artifact**

   Uploads logs to GitHub for inspection:

   ```yaml
   - name: Upload deployment logs artifact
     uses: actions/upload-artifact@v4
     with:
       name: deploy-to-azure-vm-logs
       path: ./deploy-to-azure-vm.txt
   ```

---

### GitHub Secrets Used

| Secret Name          | Description                            |
|----------------------|----------------------------------------|
| `AZURE_PRIVATE_KEY`  | SSH private key to connect to the VM   |
| `AZURE_HOST`         | Public IP address of the Azure VM      |
| `AZURE_USER`         | VM user (usually `azureuser`)          |
| `REMOTE_PORT`        | SSH port (default: `22`)               |
| `SLACK_WEBHOOK_URL`  | (Optional) Slack notification endpoint |

---

## ✅ Final Submission Checklist

| Requirement | Status |
|-------------|--------|
| draw.io Architecture Diagram | ✅ |
| docker-compose with Volumes & .env | ✅ |
| Healthchecks | ✅ |
| Manual/CI Deployment to Azure | ✅ |
| GitHub Actions Workflow | ✅ |
| Screenshot of Running Containers | ✅ |
| README with full setup instructions | ✅ |