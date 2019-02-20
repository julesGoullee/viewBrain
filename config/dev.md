### Build image:
docker build -t view-brain:latest .

### Run image:
docker run --rm -it \
    --name view-brain \
    --volume $(pwd)/data:/usr/src/app/data \
    --env-file .env \
    view-brain:latest

out_random_scale-18_units-85_depth-7.jpg
out_random_scale-19_units-228_depth-7.jpg
out_random_scale-19_units-291_depth-5.jpg
out_random_scale-19_units-311_depth-8.jpg
out_random_scale-22_units-182_depth-7.jpg
out_random_scale-27_units-133_depth-7.jpg
out_random_scale-29_units-152_depth-7.jpg
out_random_scale-34_units-112_depth-4.jpg
out_random_scale-44_units-31_depth-8.jpg
out_random_scale-54_units-56_depth-6.jpg
out_random_scale-58_units-17_depth-3.jpg
out_random_scale-58_units-98_depth-3.jpg
out_random_scale-72_units-28_depth-4.jpg
out_random_scale-72_units-30_depth-5.jpg
out_random_scale-76_units-58_depth-5.jpg
out_random_scale-89_units-21_depth-4.jpg
out_random_scale-95_units-186_depth-4.jpg
out_random_scale-120_units-103_depth-4.jpg
out_random_scale-128_units-103_depth-4.jpg
out_random_scale-135_units-35_depth-5.jpg
out_random_scale-139_units-69_depth-4.jpg
out_random_scale-154_units-138_depth-4.jpg
out_random_scale-178_units-86_depth-4.jpg
out_random_scale-179_units-112_depth-4.jpg
out_random_scale-198_units-245_depth-3.jpg
out_random_scale-200_units-26_depth-3.jpg
