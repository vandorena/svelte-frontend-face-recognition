<script>
  let video_source = $state(null);
  let loading = $state(false);
  let frameCount = 0;

  const capture_frame = () => {
    if (!video_source || video_source.paused || video_source.ended) return;

    frameCount++;

    if (frameCount % 50 === 0 && video_source.videoWidth > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = video_source.videoWidth;
      canvas.height = video_source.videoHeight;
      const canvas_context = canvas.getContext("2d");
      
      if (canvas_context) {
        canvas_context.drawImage(video_source, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg");
        const picture_as_form = new FormData();
        picture_as_form.append("image", base64);
        fetch("?/logFrame", {
          method: "POST",
          body: picture_as_form,
        }).catch(err => console.error("Error sending frame:", err));
      }
    }
    requestAnimationFrame(capture_frame);
  };

  const webcam_video = async () => {
    try {
      loading = true;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      video_source.srcObject = stream;
      video_source.play();
      video_source.onloadeddata = () => {
        requestAnimationFrame(capture_frame);
      };

      loading = false;
    } catch (error) {
      console.log(error);
    }
  };
</script>

<div>
  {#if loading}
    <h1>LOADING</h1>
  {/if}
  <video bind:this={video_source}></video>
  <button onclick={webcam_video}>CLICK</button>
</div>