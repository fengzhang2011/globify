<script lang="ts">
  import type { Sketch } from '$lib/services/whiteboard-db';
  import { whiteboardStore } from '$lib/stores/whiteboard';
  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';

  interface Props {
    sketches: Sketch[];
    readonly: boolean;
    maxVotes?: number;
  }

  let { sketches, readonly = true, maxVotes = 3 }: Props = $props();

  let selectedSketchIds = $state<Set<string>>(new Set());
  let viewingSketch = $state<Sketch | null>(null);
  let state = $state($whiteboardStore);

  $effect(() => {
    state = $whiteboardStore;
  });

  // Load existing votes when component mounts in voting mode
  $effect(() => {
    if (!readonly && state.currentSession && state.currentParticipant) {
      const currentSketch = state.currentSession.sketches.find(
        s => s.participantId === state.currentParticipant!.id
      );

      if (currentSketch) {
        // Find sketches this participant voted for
        const votedSketches = state.currentSession.sketches
          .filter(s => s.votes.includes(state.currentParticipant!.id))
          .map(s => s.id);

        selectedSketchIds = new Set(votedSketches);
      }
    }
  });

  function toggleVote(sketchId: string) {
    if (readonly) return;

    // Don't allow voting for own sketch
    if (state.currentParticipant && sketches.find(s => s.id === sketchId)?.participantId === state.currentParticipant.id) {
      return;
    }

    const newSelection = new Set(selectedSketchIds);

    if (newSelection.has(sketchId)) {
      newSelection.delete(sketchId);
    } else {
      if (newSelection.size >= maxVotes) {
        alert(`You can only vote for ${maxVotes} sketches`);
        return;
      }
      newSelection.add(sketchId);
    }

    selectedSketchIds = newSelection;
  }

  async function submitVotes() {
    try {
      await whiteboardStore.vote(Array.from(selectedSketchIds));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit votes');
    }
  }

  function viewSketch(sketch: Sketch) {
    viewingSketch = sketch;
  }

  function getVoteCount(sketch: Sketch): number {
    return sketch.votes.length;
  }

  function hasVoted(sketch: Sketch): boolean {
    return state.currentParticipant ? sketch.votes.includes(state.currentParticipant.id) : false;
  }

  function isOwnSketch(sketch: Sketch): boolean {
    return state.currentParticipant ? sketch.participantId === state.currentParticipant.id : false;
  }
</script>

<div class="space-y-4">
  {#if !readonly}
    <Card class="p-4 bg-purple-50">
      <div class="flex justify-between items-center">
        <div>
          <p class="text-sm font-medium">
            Selected: {selectedSketchIds.size} / {maxVotes}
          </p>
          <p class="text-xs text-slate-600 mt-1">
            Click on sketches to vote (you cannot vote for your own)
          </p>
        </div>
        <Button onclick={submitVotes} disabled={selectedSketchIds.size === 0}>
          Submit Votes
        </Button>
      </div>
    </Card>
  {/if}

  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {#each sketches as sketch}
      {@const isSelected = selectedSketchIds.has(sketch.id)}
      {@const voteCount = getVoteCount(sketch)}
      {@const hasVotedForThis = hasVoted(sketch)}
      {@const isOwn = isOwnSketch(sketch)}

      <Card
        class="overflow-hidden cursor-pointer transition-all hover:shadow-lg {isSelected ? 'ring-4 ring-purple-500' : ''} {isOwn ? 'opacity-60' : ''}"
        onclick={() => !readonly && toggleVote(sketch.id)}
      >
        <!-- Thumbnail -->
        <div class="aspect-video bg-slate-100 relative group">
          {#if sketch.thumbnail}
            <img
              src={sketch.thumbnail}
              alt="{sketch.participantName}'s sketch"
              class="w-full h-full object-contain"
            />
          {:else}
            <div class="w-full h-full flex items-center justify-center text-slate-400">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          {/if}

          <!-- View button -->
          <button
            onclick={(e) => {
              e.stopPropagation();
              viewSketch(sketch);
            }}
            class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <span class="text-white font-medium">View Full</span>
          </button>

          <!-- Vote indicator -->
          {#if isSelected}
            <div class="absolute top-2 right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white">
              ✓
            </div>
          {/if}

          <!-- Own sketch indicator -->
          {#if isOwn}
            <div class="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
              You
            </div>
          {/if}
        </div>

        <!-- Info -->
        <div class="p-3">
          <p class="font-medium text-sm truncate">{sketch.participantName}</p>
          <div class="flex items-center justify-between mt-1">
            <p class="text-xs text-slate-600">
              {new Date(sketch.createdAt).toLocaleTimeString()}
            </p>
            {#if voteCount > 0}
              <div class="flex items-center gap-1 text-purple-600">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                <span class="text-xs font-medium">{voteCount}</span>
              </div>
            {/if}
          </div>
          {#if hasVotedForThis && !isOwn}
            <p class="text-xs text-purple-600 mt-1">You voted for this</p>
          {/if}
        </div>
      </Card>
    {/each}
  </div>

  {#if sketches.length === 0}
    <Card class="p-12 text-center">
      <p class="text-slate-500">No sketches yet</p>
    </Card>
  {/if}
</div>

<!-- View Dialog -->
{#if viewingSketch}
  <Dialog.Root open={!!viewingSketch} onOpenChange={(open) => !open && (viewingSketch = null)}>
    <Dialog.Content class="max-w-4xl">
      <Dialog.Header>
        <Dialog.Title>{viewingSketch.participantName}'s Sketch</Dialog.Title>
      </Dialog.Header>

      <div class="bg-slate-100 rounded-lg overflow-hidden">
        {#if viewingSketch.thumbnail}
          <img
            src={viewingSketch.thumbnail}
            alt="{viewingSketch.participantName}'s sketch"
            class="w-full h-auto max-h-[70vh] object-contain"
          />
        {:else}
          <div class="w-full h-96 flex items-center justify-center text-slate-400">
            No preview available
          </div>
        {/if}
      </div>

      <div class="flex items-center justify-between mt-4">
        <div>
          <p class="text-sm text-slate-600">
            Created: {new Date(viewingSketch.createdAt).toLocaleString()}
          </p>
          <p class="text-sm text-slate-600">
            Votes: {getVoteCount(viewingSketch)}
          </p>
        </div>
        {#if !readonly && !isOwnSketch(viewingSketch)}
          <Button onclick={() => viewingSketch && toggleVote(viewingSketch.id)}>
            {selectedSketchIds.has(viewingSketch.id) ? 'Remove Vote' : 'Vote for This'}
          </Button>
        {/if}
      </div>
    </Dialog.Content>
  </Dialog.Root>
{/if}
