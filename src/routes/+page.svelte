<script>
  let video_source = $state(null);
  let loading = $state(false);
  let show_video = $state(false);
  let frame_count = 0;
  let animation_frame_id;
  let processing = false;

  const process_frame = async () => {
    if (!show_video) return;

    frame_count++;
    if (frame_count % 30 === 0 && !processing) {
        processing = true;

        const canvas = document.createElement('canvas');
        canvas.width = video_source.videoWidth;
        canvas.height = video_source.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video_source, 0, 0);
        const image_base64 = canvas.toDataURL('image/jpeg');

        try {
            const res = await fetch('/api/face/identify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: image_base64 })
            });

            const data = await res.json();

            if (data.found) {
                if (data.identified) {
                    console.log(`Identified: ${data.name} (Confidence: ${data.confidence})`);
                } else {
                    console.log('Face found but not identified.');
                    const name = prompt('Face detected but not recognized. Please enter your name to register:');
                    if (name) {
                        try {
                            const regRes = await fetch('/api/face/register', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    face_token: data.face_token,
                                    name: name
                                })
                            });
                            const regData = await regRes.json();
                            if (regData.success) {
                                alert(`Registered as ${regData.stored_name}`);
                            } else {
                                alert(`Failed to register: ${regData.error}`);
                            }
                        } catch (err) {
                            console.error('Registration error', err);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Identification error', err);
        } finally {
            processing = false;
        }
    }
    
    animation_frame_id = requestAnimationFrame(process_frame);
  };

  const start_camera = async () => {
    try {
      loading = true;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      video_source.srcObject = stream;
      video_source.play();
      show_video = true;
      loading = false;
      frame_count = 0;
      process_frame();
    } catch (error) {
      console.log(error);
      loading = false;
    }
  };

  const stop_camera = () => {
    if (video_source && video_source.srcObject) {
      const tracks = video_source.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      video_source.srcObject = null;
      show_video = false;
      if (animation_frame_id) {
        cancelAnimationFrame(animation_frame_id);
      }
    }
  };

  const toggle_camera = () => {
    if (show_video) {
        stop_camera();
    } else {
        start_camera();
    }
  };
</script>


<div class="flex flex-col items-center justify-center min-h-screen gap-4">
  {#if loading}
    <h1 class="text-6xl text-green-900 [-webkit-text-stroke:1px_theme('colors.amber.300')] font-cattie">LOADING...</h1>
  {/if}
  
  <div class="relative overflow-hidden">
    <video 
      bind:this={video_source} 
      class={show_video ? "w-full max-w-2xl border-green-900 border-8 rounded-md" : "w-full max-w-2xl"}
      autoplay 
      playsinline
    ></video>
  </div>

  <button 
    onclick={toggle_camera}
    class="text-6xl text-green-900 [-webkit-text-stroke:1px_theme('colors.amber.300')] bg-green-800 px-10 py-4 mb-2 rounded-sm font-kitty-cutes"
  >
    {show_video ? "Stop Camera" : "Start Camera"}
  </button>
</div>
