# FCJ Workshop 0

ffmpeg command for generate HLS master for a video

"""
ffmpeg -y -i sintel_trailer-1080p.mp4 \
-loglevel error \
-preset slow -g 48 -sc_threshold 0 \
-map 0:0 \
-s:v:0 640x360 -c:v:0 libx264 -b:v:0 365k \
-map 0:0 \
-s:v:1 960x540 -c:v:1 libx264 -b:v:1 2000k \
-map 0:1 \
-map 0:1 \
-c:a copy \
-var_stream_map "v:0,a:0,name:360p v:1,a:1,name:540p" \
-master_pl_name "master.m3u8" \
-f hls -hls_time 5 -hls_list_size 0 \
-hls_segment_filename "/home/hdthinh1012/dev/self-project/AWS-Workshop-0-HLS-Streaming-BE/streams/sintel_trailer/%v/fileSequence%d.ts" \
/home/hdthinh1012/dev/self-project/AWS-Workshop-0-HLS-Streaming-BE/streams/sintel_trailer/%v/prog_index.m3u8
"""

"""
ffmpeg -y -i sintel_trailer-1080p.mp4 \
-loglevel error \
-c:v libx264 -crf 22 -c:a aac -ar 44100 \
-map 0:0 \
-map 0:1 \
-map 0:0 \
-map 0:1 \
-map 0:0 \
-map 0:1 \
-map 0:0 \
-map 0:1 \
-filter:v:0 scale=-1:360  -maxrate:v:0 600k -b:a:0 500k \
-filter:v:1 scale=-1:480  -maxrate:v:1 1500k -b:a:1 1000k \
-filter:v:2 scale=-1:720  -maxrate:v:0 3000k -b:a:2 2000k \
-filter:v:3 scale=-1:1080 -maxrate:v:2 6000k -b:a:3 2000k \
-var_stream_map "v:0,a:0,name:360p v:1,a:1,name:480p v:2,a:2,name:720p v:3,a:3,name:1080p" \
-preset slow -g 48 -sc_threshold 0 \
-master_pl_name "master.m3u8" \
-f hls -hls_time 5 -hls_list_size 0 \
-hls_segment_filename "/home/hdthinh1012/dev/self-project/AWS-Workshop-0-HLS-Streaming-BE/streams/sintel_trailer/%v/fileSequence%d.ts" \
/home/hdthinh1012/dev/self-project/AWS-Workshop-0-HLS-Streaming-BE/streams/sintel_trailer/%v/prog_index.m3u8
"""

"""
ffmpeg -i "c:/videos/sample.mp4
-map 0:v:0 -map 0:a:0 -map 0:v:0 -map 0:a:0 -map 0:v:0 -map 0:a:0
-c:v libx264 -crf 22 -c:a aac -ar 48000
-filter:v:0 scale=w=480:h=360  -maxrate:v:0 600k -b:a:0 64k 
-filter:v:1 scale=w=640:h=480  -maxrate:v:1 900k -b:a:1 128k 
-filter:v:2 scale=w=1280:h=720 -maxrate:v:2 900k -b:a:2 128k 
-var_stream_map "v:0,a:0,name:360p v:1,a:1,name:480p v:2,a:2,name:720p"
-preset slow -hls_list_size 0 -threads 0 -f hls -hls_playlist_type event -hls_time 3
-hls_flags independent_segments -master_pl_name "name-pl.m3u8"
"c:/videos/encoded/name-%v.m3u8"   
"""