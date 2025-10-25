<script lang="ts">
  import { onMount } from 'svelte';
  import { Tldraw, type Editor } from 'tldraw';
  import { whiteboardStore } from '$lib/stores/whiteboard';
  import { Button } from '$lib/components/ui/button';
  import 'tldraw/tldraw.css';

  let state = $state($whiteboardStore);
  let editor: Editor | null = $state(null);
  let container: HTMLDivElement;
  let hasUnsavedChanges = $state(false);

  $effect(() => {
    state = $whiteboardStore;
  });

  onMount(() => {
    return () => {
      // Cleanup
      if (editor) {
        editor.dispose();
      }
    };
  });

  function handleMount(event: { editor: Editor }) {
    editor = event.editor;

    // Listen for changes
    editor.on('change', () => {
      hasUnsavedChanges = true;
    });

    // Load existing sketch if any
    const existingSketch = state.currentSession?.sketches.find(
      s => s.participantId === state.currentParticipant?.id
    );

    if (existingSketch?.snapshot) {
      try {
        const snapshot = JSON.parse(existingSketch.snapshot);
        editor.store.loadSnapshot(snapshot);
        hasUnsavedChanges = false;
      } catch (err) {
        console.error('Failed to load sketch:', err);
      }
    }
  }

  async function handleSave() {
    if (!editor) return;

    try {
      // Get snapshot
      const snapshot = editor.store.getSnapshot();
      const snapshotString = JSON.stringify(snapshot);

      // Generate thumbnail
      let thumbnail: string | undefined;
      try {
        const shapeIds = editor.getCurrentPageShapeIds();
        if (shapeIds.size > 0) {
          // Use editor.getSvgString() and convert to image
          const svg = await editor.getSvgString([...shapeIds], {
            background: true,
            bounds: editor.getViewportPageBounds(),
            scale: 0.5
          });

          if (svg) {
            thumbnail = await svgToDataUrl(svg.svg);
          }
        }
      } catch (err) {
        console.error('Failed to generate thumbnail:', err);
      }

      await whiteboardStore.saveSketch(snapshotString, thumbnail);
      hasUnsavedChanges = false;
    } catch (err) {
      console.error('Failed to save sketch:', err);
      alert('Failed to save sketch. Please try again.');
    }
  }

  async function svgToDataUrl(svgString: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = reject;

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.src = url;

      // Clean up
      img.addEventListener('load', () => URL.revokeObjectURL(url));
    });
  }

  function handleClear() {
    if (!editor) return;
    if (confirm('Are you sure you want to clear your sketch?')) {
      editor.selectAll();
      editor.deleteShapes(editor.getSelectedShapeIds());
      hasUnsavedChanges = true;
    }
  }

  function handleUndo() {
    if (!editor) return;
    editor.undo();
  }

  function handleRedo() {
    if (!editor) return;
    editor.redo();
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
      <Button size="sm" variant="outline" onclick={handleUndo}>
        Undo
      </Button>
      <Button size="sm" variant="outline" onclick={handleRedo}>
        Redo
      </Button>
      <Button size="sm" variant="outline" onclick={handleClear}>
        Clear
      </Button>
      <Button size="sm" onclick={handleSave} disabled={!hasUnsavedChanges}>
        Save Sketch
      </Button>
    </div>
  </div>

  <!-- Canvas -->
  <div bind:this={container} class="w-full h-[600px]">
    <Tldraw
      onMount={handleMount}
      hideUi={false}
      components={{
        Toolbar: null,
        ActionsMenu: null,
        HelpMenu: null,
        ZoomMenu: null,
        MainMenu: null,
        Minimap: null,
        StylePanel: null,
        PageMenu: null,
        NavigationPanel: null,
        HelperButtons: null,
        DebugPanel: null,
        DebugMenu: null,
        SharePanel: null,
      }}
    />
  </div>

  <!-- Instructions -->
  <div class="p-4 bg-slate-50 border-t text-sm text-slate-600">
    <p>
      <strong>Instructions:</strong> Draw your sketch silently. Use the tools above to undo, redo, or clear.
      Save your progress regularly. The session will end when the timer reaches zero.
    </p>
  </div>
</div>

<style>
  :global(.tldraw__editor) {
    width: 100%;
    height: 100%;
  }
</style>
