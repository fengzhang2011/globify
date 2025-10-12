<script>
  import OKRSystem from '$components/OKRSystem.svelte';
  import OKRKanban from '$components/OKRKanban.svelte';
  import OKRTimeline from '$components/OKRTimeline.svelte';
  import Kanban from '$components/Kanban.svelte';
</script>

<div class="app-container">
  <div class="app-header">
    <h1>🎯 OKR Management System</h1>
    <p>Integrated Objectives and Key Results tracking with tasks and timeline</p>
  </div>

  <div class="main-layout">
    <!-- OKR Chart - Full Width Top -->
    <div class="okr-section">
      <OKRSystem />
    </div>

    <!-- Bottom Row: Kanban and Timeline Side by Side -->
    <div class="bottom-row">
      <div class="kanban-section">
        <OKRKanban />
      </div>
      
      <div class="timeline-section">
        <OKRTimeline />
      </div>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }

  .app-container {
    min-height: 100vh;
    background: #f1f5f9;
  }

  .app-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .app-header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    font-weight: 700;
  }

  .app-header p {
    margin: 0;
    font-size: 1rem;
    opacity: 0.9;
  }

  .main-layout {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .okr-section {
    width: 100%;
    min-height: 500px;
  }

  .bottom-row {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 1.5rem;
  }

  .kanban-section {
    min-height: 400px;
  }

  .timeline-section {
    min-height: 400px;
  }

  @media (max-width: 1400px) {
    .bottom-row {
      grid-template-columns: 1fr;
    }
  }
</style>