FROM gitlab.baltic-amadeus.lt:5005/progress/progress-docker/progress-build:12.6.0-centos

# Get build Arguments
ARG DB_NAME

# Define directory structure
RUN mkdir -p /app/database/${DB_NAME} /app/script $WRKDIR/input 

# Copy scripts
COPY ./script /app/script/

ENTRYPOINT ["/bin/sh","-c","/app/script/entrypoint.sh"]
