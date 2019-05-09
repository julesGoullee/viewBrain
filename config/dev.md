### Build image:
docker build -t view-brain:latest .

### Run image:
docker run --rm -it \
    --name view-brain \
    --volume $(pwd)/data:/usr/src/app/data \
    --env-file .env \
    view-brain:latest
    
### TODO:
- parse in config number params
- Fix unfollow when already unfollow
- Create video moving on scale parameter
