<script lang="ts">
  import { onMount } from 'svelte';
  import { whiteboardStore } from '$lib/stores/whiteboard';
  import { Button } from '$lib/components/ui/button';

  let state = $state($whiteboardStore);
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let isDrawing = $state(false);
  let lastX = $state(0);
  let lastY = $state(0);
  let hasUnsavedChanges = $state(false);
  let currentTool = $state<'brush' | 'eraser'>('brush');
  let brushSize = $state(3);
  let drawingHistory: ImageData[] = $state([]);
  let historyStep = $state(-1);

  $effect(() => {
    state = $whiteboardStore;
  });

  onMount(() => {
    if (canvas) {
      ctx = canvas.getContext('2d');
      if (ctx) {
        // Set canvas size to large drawing area (1920x1080)
        canvas.width = 1920;
        canvas.height = 1080;

        // Set initial canvas background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Load existing sketch if any
        const existingSketch = state.currentSession?.sketches.find(
          s => s.participantId === state.currentParticipant?.id
        );

        if (existingSketch?.snapshot) {
          try {
            const img = new Image();
            img.onload = () => {
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                saveHistory();
              }
            };
            img.src = existingSketch.thumbnail || '';
          } catch (err) {
            console.error('Failed to load sketch:', err);
          }
        } else {
          saveHistory();
        }
      }
    }

    return () => {
      // Cleanup
    };
  });

  function saveHistory() {
    if (!ctx || !canvas) return;

    // Remove any future history if we're not at the end
    if (historyStep < drawingHistory.length - 1) {
      drawingHistory = drawingHistory.slice(0, historyStep + 1);
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    drawingHistory = [...drawingHistory, imageData];
    historyStep = drawingHistory.length - 1;

    // Limit history to 50 steps
    if (drawingHistory.length > 50) {
      drawingHistory = drawingHistory.slice(-50);
      historyStep = drawingHistory.length - 1;
    }
  }

  function startDrawing(e: MouseEvent) {
    if (!ctx) return;
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
  }

  function draw(e: MouseEvent) {
    if (!isDrawing || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);

    if (currentTool === 'brush') {
      ctx.strokeStyle = state.currentParticipant?.color || '#000000';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = brushSize * 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    ctx.stroke();

    lastX = x;
    lastY = y;
    hasUnsavedChanges = true;
  }

  function stopDrawing() {
    if (isDrawing) {
      isDrawing = false;
      saveHistory();
    }
  }

  async function handleSave() {
    if (!canvas || !ctx) return;

    try {
      // Save as data URL
      const dataUrl = canvas.toDataURL('image/png');

      // Create snapshot (just store the image)
      const snapshot = JSON.stringify({
        version: 1,
        image: dataUrl,
        timestamp: Date.now()
      });

      await whiteboardStore.saveSketch(snapshot, dataUrl);
      hasUnsavedChanges = false;
    } catch (err) {
      console.error('Failed to save sketch:', err);
      alert('Failed to save sketch. Please try again.');
    }
  }

  function handleClear() {
    if (!ctx || !canvas) return;
    if (confirm('Are you sure you want to clear your sketch?')) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      hasUnsavedChanges = true;
      saveHistory();
    }
  }

  function handleUndo() {
    if (!ctx || !canvas) return;
    if (historyStep > 0) {
      historyStep--;
      const imageData = drawingHistory[historyStep];
      ctx.putImageData(imageData, 0, 0);
      hasUnsavedChanges = true;
    }
  }

  function handleRedo() {
    if (!ctx || !canvas) return;
    if (historyStep < drawingHistory.length - 1) {
      historyStep++;
      const imageData = drawingHistory[historyStep];
      ctx.putImageData(imageData, 0, 0);
      hasUnsavedChanges = true;
    }
  }
</script>

<div class="bg-white rounded-lg shadow-sm overflow-hidden">
  <!-- Toolbar -->
  <div class="flex items-center justify-between p-4 border-b bg-slate-50">
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium">Your Sketch</span>
      {#if hasUnsavedChanges}
        <span class="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">Unsaved</span>
      {/if}
    </div>

    <div class="flex items-center gap-2">
      <!-- Tool Selection -->
      <div class="flex gap-1 mr-4">
        <Button
          size="sm"
          variant={currentTool === 'brush' ? 'default' : 'outline'}
          onclick={() => currentTool = 'brush'}
        >
          🖌️ Brush
        </Button>
        <Button
          size="sm"
          variant={currentTool === 'eraser' ? 'default' : 'outline'}
          onclick={() => currentTool = 'eraser'}
        >
          🧹 Eraser
        </Button>
      </div>

      <!-- Size Slider -->
      <div class="flex items-center gap-2 mr-4">
        <span class="text-xs">Size:</span>
        <input
          type="range"
          min="1"
          max="20"
          bind:value={brushSize}
          class="w-20"
        />
        <span class="text-xs w-6">{brushSize}</span>
      </div>

      <Button size="sm" variant="outline" onclick={handleUndo} disabled={historyStep <= 0}>
        ↶ Undo
      </Button>
      <Button size="sm" variant="outline" onclick={handleRedo} disabled={historyStep >= drawingHistory.length - 1}>
        ↷ Redo
      </Button>
      <Button size="sm" variant="outline" onclick={handleClear}>
        Clear
      </Button>
      <Button size="sm" onclick={handleSave} disabled={!hasUnsavedChanges}>
        Save Sketch
      </Button>
    </div>
  </div>

  <!-- Canvas - Scrollable Container -->
  <div class="w-full overflow-auto border-2 border-slate-200" style="max-height: calc(100vh - 300px);">
    <canvas
      bind:this={canvas}
      class="cursor-crosshair block"
      style="width: 1920px; height: 1080px;"
      onmousedown={startDrawing}
      onmousemove={draw}
      onmouseup={stopDrawing}
      onmouseleave={stopDrawing}
    ></canvas>
  </div>

  <!-- Instructions -->
  <div class="p-4 bg-slate-50 border-t text-sm text-slate-600">
    <p>
      <strong>Instructions:</strong> Draw your sketch using the brush tool. Use the eraser to correct mistakes.
      The canvas is <strong>1920×1080 pixels</strong> - scroll to explore the full drawing area.
      Save your progress regularly. The session will end when the timer reaches zero.
    </p>
  </div>
</div>
