<script>
  let video_source = $state(null);
  let loading = $state(false);
  const webcam_video = async () => {
    try {
      loading = true;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      video_source.srcObject = stream;
      video_source.play();
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