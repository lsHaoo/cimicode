#!/bin/bash
cd ~

# PID 文件和锁文件
PID_FILE="/tmp/cimicode.pid"
LOCK_FILE="/tmp/cimicode.lock"
LOG_FILE="/tmp/cimicode.log"

echo "[$(date)] Stopping cimicode..." >> "$LOG_FILE"

# 找到并停止所有 cimicode 进程（包括 serve 和 install）
PIDS=$(ps aux | grep '[c]imicode' | awk '{print $1}')
if [ -n "$PIDS" ]; then
    echo "[$(date)] Stopping cimicode processes: $PIDS" >> "$LOG_FILE"
    echo "$PIDS" | xargs -I {} kill {} 2>/dev/null || true

    # 等待优雅退出
    for i in {1..10}; do
        REMAINING=$(ps aux | grep '[c]imicode' | wc -l)
        if [ "$REMAINING" -eq 0 ]; then
            echo "[$(date)] cimicode stopped" >> "$LOG_FILE"
            break
        fi
        sleep 1
    done

    # 如果还在运行，强制杀掉
    REMAINING=$(ps aux | grep '[c]imicode' | awk '{print $1}')
    if [ -n "$REMAINING" ]; then
        echo "[$(date)] Forcing cimicode to stop..." >> "$LOG_FILE"
        echo "$REMAINING" | xargs -I {} kill -9 {} 2>/dev/null || true
    fi
fi

# 清理文件
rm -f "$PID_FILE" "$LOCK_FILE"

echo "[$(date)] Stop complete" >> "$LOG_FILE"