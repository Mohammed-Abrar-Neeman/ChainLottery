# ChainLottery Deployment Guide

This guide explains how to deploy both the **frontend** (Vite/React) and **backend** (Express admin server) to a new server (e.g., Ubuntu VPS).

---

## 1. Copy Project Files to Server

**A. Zip and Upload (from your local machine):**

```
# In your project root
zip -r chainlottery.zip client admin-server
scp chainlottery.zip username@server_ip:/home/username/
```

**B. SSH into your server and unzip:**

```
ssh username@server_ip
cd /home/username
unzip chainlottery.zip
```

---

## 2. Backend Setup (admin-server)

```
cd /home/username/admin-server
npm install
```

**Start with PM2:**
```
npm install -g pm2  # if not already installed
pm2 start admin-server.js --name chainlottery-backend
pm2 save
pm2 startup
```

- The backend will run on port **3001** by default.
- API endpoint: `http://your_server_ip:3001/api/config`

---

## 3. Frontend Setup (client)

```
cd /home/username/client
npm install
npm run build
```

**Serve the production build with PM2 and `serve`:**
```
npm install -g serve  # if not already installed
pm2 start serve --name chainlottery-frontend -- -s dist -l 5000
pm2 save
pm2 startup
```

- The frontend will be available at: `http://your_server_ip:5000`

---

## 4. Managing the Services

- **List all PM2 processes:**
  ```
  pm2 list
  ```
- **Restart a process:**
  ```
  pm2 restart chainlottery-frontend
  pm2 restart chainlottery-backend
  ```
- **Stop a process:**
  ```
  pm2 stop chainlottery-frontend
  pm2 stop chainlottery-backend
  ```
- **View logs:**
  ```
  pm2 logs chainlottery-frontend
  pm2 logs chainlottery-backend
  ```

---

## 5. Notes
- Make sure ports **3001** (backend) and **5000** (frontend) are open in your firewall/security group.
- You can change the PM2 process names as you like.
- For production, consider using a reverse proxy (Nginx) to serve the frontend and proxy API requests to the backend.

---

**That's it! Your ChainLottery project should now be running on your server.** 