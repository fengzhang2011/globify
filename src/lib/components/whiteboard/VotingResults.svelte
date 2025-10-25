<script lang="ts">
  import type { Sketch } from '$lib/services/whiteboard-db';
  import { Card } from '$lib/components/ui/card';

  interface Props {
    sketches: Sketch[];
  }

  let { sketches }: Props = $props();

  // Sort sketches by vote count (descending)
  let rankedSketches = $derived(
    [...sketches].sort((a, b) => b.votes.length - a.votes.length)
  );

  let maxVotes = $derived(
    rankedSketches.length > 0 ? rankedSketches[0].votes.length : 0
  );

  function getRank(index: number, votes: number, prevVotes: number | null): number {
    if (prevVotes === null || votes < prevVotes) {
      return index + 1;
    }
    return getRank(index - 1, votes, rankedSketches[index - 1]?.votes.length || null);
  }

  function getMedalEmoji(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  }
</script>

<div class="space-y-6">
  <Card class="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
    <h2 class="text-3xl font-bold mb-2">Voting Complete!</h2>
    <p class="text-purple-100">Here are the results ranked by votes</p>
  </Card>

  <div class="grid gap-4">
    {#each rankedSketches as sketch, index}
      {@const rank = getRank(index, sketch.votes.length, index > 0 ? rankedSketches[index - 1].votes.length : null)}
      {@const medal = getMedalEmoji(rank)}
      {@const isTopThree = rank <= 3}

      <Card class="overflow-hidden {isTopThree ? 'ring-2 ring-purple-400' : ''}">
        <div class="flex gap-4 p-4">
          <!-- Rank -->
          <div class="flex-shrink-0 w-20 flex flex-col items-center justify-center">
            {#if medal}
              <div class="text-4xl mb-1">{medal}</div>
            {:else}
              <div class="text-3xl font-bold text-slate-400">#{rank}</div>
            {/if}
            <div class="text-xs text-slate-600 text-center">
              {sketch.votes.length} {sketch.votes.length === 1 ? 'vote' : 'votes'}
            </div>
          </div>

          <!-- Thumbnail -->
          <div class="flex-shrink-0 w-48 aspect-video bg-slate-100 rounded-lg overflow-hidden">
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
          </div>

          <!-- Info -->
          <div class="flex-1 flex flex-col justify-center">
            <h3 class="text-xl font-bold mb-1">{sketch.participantName}</h3>
            <p class="text-sm text-slate-600 mb-2">
              Created: {new Date(sketch.createdAt).toLocaleString()}
            </p>

            {#if sketch.votes.length > 0}
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                <span class="text-sm font-medium text-purple-600">
                  {sketch.votes.length} {sketch.votes.length === 1 ? 'participant' : 'participants'} voted for this
                </span>
              </div>
            {/if}
          </div>

          <!-- Progress Bar -->
          <div class="flex-shrink-0 w-24 flex flex-col justify-center">
            <div class="h-4 bg-slate-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style="width: {maxVotes > 0 ? (sketch.votes.length / maxVotes) * 100 : 0}%"
              ></div>
            </div>
            <p class="text-xs text-slate-600 text-center mt-1">
              {maxVotes > 0 ? Math.round((sketch.votes.length / maxVotes) * 100) : 0}%
            </p>
          </div>
        </div>
      </Card>
    {/each}
  </div>

  {#if rankedSketches.length === 0}
    <Card class="p-12 text-center">
      <p class="text-slate-500">No sketches to display</p>
    </Card>
  {/if}

  <!-- Summary Stats -->
  <Card class="p-6 bg-slate-50">
    <h3 class="text-lg font-bold mb-4">Session Summary</h3>
    <div class="grid grid-cols-3 gap-4 text-center">
      <div>
        <div class="text-3xl font-bold text-purple-600">{sketches.length}</div>
        <div class="text-sm text-slate-600">Total Sketches</div>
      </div>
      <div>
        <div class="text-3xl font-bold text-pink-600">
          {sketches.reduce((sum, s) => sum + s.votes.length, 0)}
        </div>
        <div class="text-sm text-slate-600">Total Votes</div>
      </div>
      <div>
        <div class="text-3xl font-bold text-purple-600">
          {maxVotes}
        </div>
        <div class="text-sm text-slate-600">Most Votes</div>
      </div>
    </div>
  </Card>
</div>
