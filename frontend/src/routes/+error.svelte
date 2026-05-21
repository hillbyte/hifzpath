<script>
  import { page } from '$app/stores';

  let { error } = $props();
</script>

<svelte:head>
  <title>Error — HifzPath</title>
</svelte:head>

<div class="error-page">
  <div class="error-icon">☽</div>
  <h2>Something went wrong</h2>
  <p>{error?.message || 'An unexpected error occurred. Please try again.'}</p>
  <div style="display: flex; gap: 12px;">
    <a href="/" class="btn btn-primary">Go Home</a>
    <button class="btn btn-outline" onclick={() => window.location.reload()}>Retry</button>
  </div>
</div>
