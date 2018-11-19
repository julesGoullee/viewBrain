### Build image:
docker build -t view-brain:latest .

### Run image:
docker run --rm -it \
    --volume $(pwd)/data:/usr/src/app/data \
    view-brain:latest
