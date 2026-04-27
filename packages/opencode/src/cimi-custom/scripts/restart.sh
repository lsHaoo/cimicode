#!/bin/bash

LOG_FILE="/tmp/cimicode.log"
PID_FILE="/tmp/cimicode.pid"

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
START_SCRIPT="$SCRIPT_DIR/start.sh"
STOP_SCRIPT="$SCRIPT_DIR/stop.sh"

echo "[$(date)] =======================================" | tee -a "$LOG_FILE"
echo "[$(date)] Restarting cimicode..." | tee -a "$LOG_FILE"

# 执行停止
bash "$STOP_SCRIPT"
STOP_CODE=$?

# 等待确保完全停止
sleep 3

# 执行启动
bash "$START_SCRIPT"
START_CODE=$?

if [ $START_CODE -eq 0 ]; then
    echo "[$(date)] Restart successful" | tee -a "$LOG_FILE"
    # 读取新 PID
    if [ -f "$PID_FILE" ]; then
        NEW_PID=$(cat "$PID_FILE")
        echo "[$(date)] New PID: $NEW_PID" | tee -a "$LOG_FILE"
    fi
    exit 0
else
    echo "[$(date)] Restart failed" | tee -a "$LOG_FILE"
    exit 1
fi