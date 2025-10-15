<script>
  import * as Drawer from "$lib/components/ui/drawer";
  import OKRSystem from '$components/OKRSystem.svelte';
  import OKRKanban from '$components/OKRKanban.svelte';
  import OKRCalendar from '$components/OKRCalendar.svelte';
  import OKRProjectTimeline from "$components/OKRProjectTimeline.svelte";
  let OKRKanbanOpen = $state(false);
</script>

<div class="app-container">
  <div class="app-header">
    <h1>🎯 OKR Management System</h1>
    <p>Integrated Objectives and Key Results tracking with tasks and timeline</p>
  </div>

  <div class="main-layout">
    <OKRProjectTimeline />
    <!-- OKR Chart - Full Width Top -->
    <div class="okr-section" style="display: flex; gap: 1.5rem;">
      <OKRSystem onOpenOKRKanban={() => OKRKanbanOpen = true} />
      <OKRCalendar />
    </div>

    <Drawer.Root bind:open={OKRKanbanOpen}>
      <Drawer.Content class="bg-gray-100 flex flex-col rounded-t-[10px] h-full mt-24 max-h-[96%] fixed bottom-0 left-0 right-0">
        <Drawer.Header>
          <Drawer.Title>Move Goal</Drawer.Title>
          <Drawer.Description>Set your daily activity goal.</Drawer.Description>
        </Drawer.Header>
        <div class="kanban-section">
          <OKRKanban />
        </div>
      </Drawer.Content>
    </Drawer.Root>
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

  .kanban-section {
    min-height: 400px;
  }
</style>