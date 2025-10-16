<script>
  import { Button } from '$lib/components/ui/button';
  import * as Drawer from "$lib/components/ui/drawer";
  import { goto } from '$app/navigation';
  import OKRSystem from '$components/OKRSystem.svelte';
  import OKRKanban from '$components/OKRKanban.svelte';
  import OKRCalendar from '$components/OKRCalendar.svelte';
  import OKRProjectTimeline from "$components/OKRProjectTimeline.svelte";
  let OKRKanbanOpen = $state(false);
</script>

<div class="app-container">
  <!-- Header -->
  <div class="bg-sky-500/100 border-b border-slate-200 sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" onclick={() => goto('/')}>
            ←
          </Button>
          <div>
            <h1 class="text-2xl font-bold text-slate-900">🎯 OKR Management System</h1>
            <p class="text-sm text-white-800">Integrated Objectives and Key Results tracking with tasks and timeline</p>
          </div>
        </div>
      </div>
    </div>
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
        <!-- <Drawer.Header>
          <Drawer.Title>Move Goal</Drawer.Title>
          <Drawer.Description>Set your daily activity goal.</Drawer.Description>
        </Drawer.Header> -->
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