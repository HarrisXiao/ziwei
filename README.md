# Ziwei

微信小程序 + Node.js API 后端。当前工程已整理成三条一致的开发/部署链路：

- 本地开发：小程序连本机 `http://127.0.0.1:4000`
- GitHub 同步：本地提交推送到 `HarrisXiao/ziwei`
- 服务器部署：当前已部署到 `43.106.24.49`，后续可用 GitHub Actions 通过 SSH 触发服务器拉取代码并重启后端

## 目录

- `miniprogram/`：微信小程序源码
- `backend/`：Node.js API 服务
- `backend/src/storage.js`：JSON / PostgreSQL 双模式存储
- `deploy/`：CentOS 初始化、systemd、Nginx、部署脚本
- `.github/workflows/backend-deploy.yml`：GitHub Actions 部署流程
- `docker-compose.yml`：本地 PostgreSQL + API 联调环境

## 本地启动

本地建议安装 Node.js 20+。

最轻量的开发方式，使用 JSON 文件作为本地数据：

```bash
cd backend
npm ci
HOST=0.0.0.0 PORT=4000 npm start
```

更接近服务器的开发方式，使用 Docker Compose 启动 PostgreSQL 和 API：

```bash
cp .env.example .env
docker compose up --build
```

后端健康检查：

```bash
curl http://127.0.0.1:4000/health
```

## 微信开发者工具

1. 导入项目目录：`/Users/harrisxiao/Documents/ziwei`
2. 小程序根目录保持 `miniprogram/`
3. 本地调试时关闭“校验合法域名、web-view、TLS 版本以及 HTTPS 证书”
4. 本地 API 默认候选地址在 `miniprogram/config.js`

开发环境默认会尝试：

- `http://127.0.0.1:4000`
- `http://localhost:4000`

如果要临时指定 API 地址，可以在开发者工具 Storage 中设置：

```text
key: ziwei_api_base
value: https://api.pppfdsfs.top
```

正式版/体验版会使用 `https://api.pppfdsfs.top`，对应配置在 `miniprogram/config.js` 的 `DEFAULT_REMOTE_API_BASE`。

## 后端接口验证

后端内置烟雾测试，会启动一个临时 API 服务并验证：

- `/health`
- `/api/home`
- 创建本命盘
- 创建 1970 年前出生日期的命盘
- 创建年度运势
- 创建关系合盘
- 读取档案、今日运势、历史记录和命盘详情

运行：

```bash
cd backend
npm test
```

## GitHub 同步

推荐工作流：

```text
本地 Mac -> git push -> GitHub -> GitHub Actions -> 远程服务器
```

GitHub Actions 会先执行后端烟雾测试，成功后再部署。

需要在 GitHub 仓库配置 Secrets：

- `DEPLOY_HOST`：服务器公网 IP 或域名
- `DEPLOY_USER`：SSH 用户，默认可用 `root`
- `DEPLOY_PORT`：SSH 端口，默认 `22`
- `DEPLOY_SSH_KEY`：SSH 私钥

当前服务器 IP 已确认为 `43.106.24.49`。密码不要写进仓库，也不要写进 GitHub Actions；自动部署建议使用 SSH key。

## 服务器首次初始化

服务器系统为 CentOS 时，可以用：

```bash
export DB_PASSWORD='change-this-password'
export API_DOMAIN='api.pppfdsfs.top'
bash deploy/bootstrap-centos.sh
```

脚本会完成：

- 安装 Git、Node.js 20、Nginx、PostgreSQL
- 初始化 PostgreSQL 数据库和用户
- 克隆仓库到 `/opt/ziwei`
- 写入 `/etc/ziwei/backend.env`
- 安装并启动 `ziwei-backend` systemd 服务
- 如配置了 `API_DOMAIN`，生成 Nginx 反向代理配置
- 调用 `/health` 做启动验证

首次跑完后建议再配置 HTTPS 证书，例如 Certbot：

```bash
certbot --nginx -d api.pppfdsfs.top
```

## 服务器后续部署

服务器上手动部署：

```bash
bash /opt/ziwei/deploy/deploy-backend.sh
```

脚本默认使用 `git merge --ff-only`，如果服务器有手工改动会失败，以免覆盖未提交内容。确定要强制和 GitHub 对齐时再使用：

```bash
FORCE_RESET=1 bash /opt/ziwei/deploy/deploy-backend.sh
```

查看服务状态：

```bash
systemctl status ziwei-backend
journalctl -u ziwei-backend -f
curl http://127.0.0.1:4000/health
```

备份 PostgreSQL：

```bash
bash /opt/ziwei/deploy/backup-postgres.sh
```

恢复 PostgreSQL 备份：

```bash
bash /opt/ziwei/deploy/restore-postgres.sh /path/to/ziwei-backup.dump
```

## 当前远程状态

`api.pppfdsfs.top` 当前部署在 `43.106.24.49`：

- DNS：`api.pppfdsfs.top -> 43.106.24.49`
- HTTPS：Let's Encrypt 证书已签发并安装
- Nginx：现有自定义 Nginx，新增 `api.pppfdsfs.top` server block，不覆盖 VPN 的 `www.pppfdsfs.top`
- Backend：`ziwei-backend` systemd 服务，监听 `127.0.0.1:4000`
- Storage：PostgreSQL 14，连接串在 `/etc/ziwei/backend.env`

验证命令：

```bash
curl https://api.pppfdsfs.top/health
systemctl status ziwei-backend
systemctl status postgresql-14
```

这台机器同时跑 `v2ray`，短期开发/内测可以共用。正式上线建议迁移到独立服务器，避免 API、数据库、VPN 共用一台机器和同一个 Nginx 入口。

## 迁移到新服务器

迁移路径保持简单：

1. 新服务器安装 Git、Node.js、PostgreSQL、Nginx。
2. 克隆仓库到 `/opt/ziwei`。
3. 写入 `/etc/ziwei/backend.env`，保持 `DATABASE_URL` 指向新 PostgreSQL。
4. 从老服务器备份数据库：

```bash
bash /opt/ziwei/deploy/backup-postgres.sh
```

5. 把生成的 `.dump` 文件复制到新服务器。
6. 在新服务器恢复数据库：

```bash
bash /opt/ziwei/deploy/restore-postgres.sh /path/to/ziwei-backup.dump
```

7. 启动 `ziwei-backend`，配置 Nginx 和 HTTPS。
8. 把 DNS A 记录 `api.pppfdsfs.top` 从旧 IP 改到新 IP。

只要域名不变，小程序端不需要重新改 API 地址。

## 生产架构建议

当前建议的 C 端上线架构：

```text
微信小程序
  -> HTTPS API 域名
  -> Nginx
  -> Node.js API(systemd)
  -> PostgreSQL
```

上线前必须补齐：

- 微信登录/openid/session，并按用户隔离档案和命盘数据
- PostgreSQL 记录表结构从兼容型 JSONB 存储升级为用户表、档案表、命盘表等正式模型
- HTTPS 证书
- 小程序后台 request 合法域名
- PostgreSQL 定时备份
- 服务器防火墙，只开放 SSH、HTTP、HTTPS 和必要的 VPN 端口
- 后端日志监控和异常告警
- 数据库密码、SSH key 等密钥统一放到服务器环境或 GitHub Secrets，不入库

## 重要文件

- [`miniprogram/config.js`](</Users/harrisxiao/Documents/ziwei/miniprogram/config.js>)
- [`backend/src/server.js`](</Users/harrisxiao/Documents/ziwei/backend/src/server.js>)
- [`backend/src/storage.js`](</Users/harrisxiao/Documents/ziwei/backend/src/storage.js>)
- [`deploy/bootstrap-centos.sh`](</Users/harrisxiao/Documents/ziwei/deploy/bootstrap-centos.sh>)
- [`deploy/deploy-backend.sh`](</Users/harrisxiao/Documents/ziwei/deploy/deploy-backend.sh>)
- [`deploy/backup-postgres.sh`](</Users/harrisxiao/Documents/ziwei/deploy/backup-postgres.sh>)
- [`deploy/restore-postgres.sh`](</Users/harrisxiao/Documents/ziwei/deploy/restore-postgres.sh>)
- [`.github/workflows/backend-deploy.yml`](</Users/harrisxiao/Documents/ziwei/.github/workflows/backend-deploy.yml>)

## 当前本地验证记录

已验证：

- Node 语法检查：`backend/src/server.js`、`backend/src/storage.js`、`backend/scripts/smoke.js`
- Shell 语法检查：`deploy/bootstrap-centos.sh`、`deploy/deploy-backend.sh`、`deploy/backup-postgres.sh`
- 后端烟雾测试：JSON 模式通过
- 后端烟雾测试：PostgreSQL 模式通过
- Docker Compose 静态配置：通过
- Docker Compose 实跑：PostgreSQL + API 容器通过，API 容器可写入并读取 PostgreSQL
- 小程序关键 JSON：`project.config.json`、`miniprogram/app.json`、`miniprogram/sitemap.json` 通过
- 远程 HTTPS API：`https://api.pppfdsfs.top/health` 通过
- 远程业务写入：创建 1968 年出生日期命盘、读取档案和历史记录通过
