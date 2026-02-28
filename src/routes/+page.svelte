<script>
  let video_source = $state(null);
  let loading = $state(false);
  let show_video = $state(false);

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
