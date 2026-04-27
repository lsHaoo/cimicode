#!/bin/bash
cd ~

# PID 文件
PID_FILE="/tmp/cimicode.pid"
LOCK_FILE="/tmp/cimicode.lock"
LOG_FILE="/tmp/cimicode.log"

# 检查锁文件（防止多次重启）
if [ -f "$LOCK_FILE" ]; then
    echo "[$(date)] Another restart is in progress, skipping..." >> "$LOG_FILE"
    exit 1
fi

# 创建锁文件
touch "$LOCK_FILE"

# 日志轮转（保留最近 1000 行）
if [ -f "$LOG_FILE" ]; then
    tail -1000 "$LOG_FILE" > "${LOG_FILE}.old" 2>/dev/null || true
    mv "${LOG_FILE}.old" "$LOG_FILE" 2>/dev/null || true
fi

# 加载环境变量
[ -f ~/.bashrc ] && source ~/.bashrc 2>/dev/null

# 启动服务
echo "[$(date)] Starting cimicode..." >> "$LOG_FILE"

# 先确保旧进程已停止
ps aux | grep '[c]imicode' | awk '{print $1}' | xargs -r kill -9 2>/dev/null
sleep 2

# 启动新进程（环境变量自动继承）
cimicode serve --print-logs --port 8888 --hostname 0.0.0.0 >> "$LOG_FILE" 2>&1 &
PID=$!

# 保存 PID
echo $PID > "$PID_FILE"

# 移除锁文件
rm -f "$LOCK_FILE"

# 等待并检查启动是否成功（检查端口而不是进程）
for i in {1..30}; do
    # 用多种方式检查服务是否启动
    if ps -p "$PID" > /dev/null 2>&1; then
        # 进程存在，检查是否真正在监听端口（需要 netstat 或 ss）
        if command -v ss >/dev/null 2>&1; then
            if ss -ltn | grep -q ":8888"; then
                echo "[$(date)] cimicode started successfully (PID: $PID)" >> "$LOG_FILE"
                exit 0
            fi
        elif command -v netstat >/dev/null 2>&1; then
            if netstat -ltn | grep -q ":8888"; then
                echo "[$(date)] cimicode started successfully (PID: $PID)" >> "$LOG_FILE"
                exit 0
            fi
        else
            # 没有 netstat/ss，尝试简单的端口检查
            if timeout 1 bash -c "echo > /dev/tcp/127.0.0.1/8888" 2>/dev/null; then
                echo "[$(date)] cimicode started successfully (PID: $PID)" >> "$LOG_FILE"
                exit 0
            fi
        fi
    fi
    sleep 1
done

# 启动失败或超时
echo "[$(date)] cimicode start timeout or failed" >> "$LOG_FILE"
ps -p "$PID" > /dev/null 2>&1 && echo "[$(date)] Process $PID is still running but port not ready" >> "$LOG_FILE" || echo "[$(date)] Process $PID is dead" >> "$LOG_FILE"
exit 1