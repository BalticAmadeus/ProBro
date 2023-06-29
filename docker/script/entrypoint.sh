#!/bin/sh

# Start Database
if [ -s /app/database/${DB_NAME}/${DB_NAME}.lk ]; then
  rm /app/database/${DB_NAME}/${DB_NAME}.lk;
fi

prodb /app/database/${DB_NAME}/${DB_NAME} sports2020

proserve -db /app/database/${DB_NAME}/${DB_NAME}.db -N TCP -S ${DB_PORT} -minport ${DB_MIN_PORT} -maxport ${DB_MAX_PORT}

# Start tailing log files
tail -Fq /app/database/${DB_NAME}/${DB_NAME}.lg
