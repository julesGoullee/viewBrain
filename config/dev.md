### Build image:
docker build -t view-brain:latest .

### Run image:
docker run --rm -it \
    --name view-brain \
    --volume $(pwd)/data:/usr/src/app/data \
    --env-file .env \
    view-brain:latest
    
### TODO:
- Create script follower/unfollow best user on specific tag
- Create video moving on scale parameter
