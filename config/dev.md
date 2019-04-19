### Build image:
docker build -t view-brain:latest .

### Run image:
docker run --rm -it \
    --name view-brain \
    --volume $(pwd)/data:/usr/src/app/data \
    --env-file .env \
    view-brain:latest
    
### TODO:
- check before follow if already in db
- Create video moving on scale parameter
