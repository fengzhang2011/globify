<script lang="ts">
  import { onMount } from 'svelte';
  import { whiteboardStore } from '$lib/stores/whiteboard';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Card } from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import SimpleCanvas from '$lib/components/whiteboard/SimpleCanvas.svelte';
  import Gallery from '$lib/components/whiteboard/Gallery.svelte';
  import VotingResults from '$lib/components/whiteboard/VotingResults.svelte';
  import { goto } from '$app/navigation';

  let state = $state($whiteboardStore);
  let view = $state<'home' | 'session'>('home');

  // Form states
  let showCreateDialog = $state(false);
  let showJoinDialog = $state(false);

  let createForm = $state({
    hostName: '',
    sessionName: '',
    drawingDuration: 300, // 5 minutes default
    votesPerParticipant: 3,
  });

  let joinForm = $state({
    code: '',
    participantName: '',
  });

  let error = $state('');
  let timeRemaining = $state(0);
  let timerInterval: number | null = null;

  // Subscribe to store
  $effect(() => {
    state = $whiteboardStore;
  });

  onMount(async () => {
    await whiteboardStore.init();

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  });

  // Timer for drawing phase
  $effect(() => {
    if (state.currentSession?.status === 'drawing' && state.currentSession.drawingEndsAt) {
      if (timerInterval) clearInterval(timerInterval);

      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((state.currentSession!.drawingEndsAt! - now) / 1000));
        timeRemaining = remaining;

        if (remaining === 0 && timerInterval) {
          clearInterval(timerInterval);
          if (state.currentParticipant?.isHost) {
            whiteboardStore.endDrawing();
          }
        }
      };

      updateTimer();
      timerInterval = setInterval(updateTimer, 1000) as unknown as number;
    } else if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  });

  // Format time
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async function handleCreateSession() {
    error = '';
    try {
      if (!createForm.hostName.trim() || !createForm.sessionName.trim()) {
        error = 'Please fill in all fields';
        return;
      }

      await whiteboardStore.createSession(
        createForm.hostName.trim(),
        createForm.sessionName.trim(),
        createForm.drawingDuration,
        createForm.votesPerParticipant
      );

      showCreateDialog = false;
      view = 'session';
      createForm = { hostName: '', sessionName: '', drawingDuration: 300, votesPerParticipant: 3 };
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create session';
    }
  }

  async function handleJoinSession() {
    error = '';
    try {
      if (!joinForm.code.trim() || !joinForm.participantName.trim()) {
        error = 'Please fill in all fields';
        return;
      }

      await whiteboardStore.joinSession(joinForm.code.trim(), joinForm.participantName.trim());

      showJoinDialog = false;
      view = 'session';
      joinForm = { code: '', participantName: '' };
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to join session';
    }
  }

  async function handleLeaveSession() {
    await whiteboardStore.leaveSession();
    view = 'home';
  }

  async function handleStartDrawing() {
    try {
      await whiteboardStore.startDrawing();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to start drawing';
    }
  }

  async function handleStartVoting() {
    try {
      await whiteboardStore.startVoting();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to start voting';
    }
  }

  async function handleEndVoting() {
    try {
      await whiteboardStore.endVoting();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to end voting';
    }
  }

  async function handleResumeSession(session: any, participant: any) {
    try {
      await whiteboardStore.resumeSession(session.id, participant.id);
      view = 'session';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to resume session';
      alert(error);
    }
  }

  async function handleViewSession(session: any) {
    try {
      // Find if user was a participant in this session
      const myParticipant = session.participants.find((p: any) =>
        p.name === state.currentParticipant?.name || p.id === state.currentParticipant?.id
      );

      if (myParticipant) {
        // Resume as existing participant
        await whiteboardStore.resumeSession(session.id, myParticipant.id);
      } else {
        // View as observer (load session without participant)
        await whiteboardStore.loadSession(session.id);
      }
      view = 'session';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to view session';
      alert(error);
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
  {#if view === 'home'}
    <!-- Home View -->
    <!-- Header -->
    <div class="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <Button variant="ghost" size="icon" onclick={() => goto('/')}>
              ←
            </Button>
            <div>
              <h1 class="text-2xl font-bold text-slate-900">Sketch Design</h1>
              <p class="text-sm text-slate-600">Collaborative whiteboard sessions for teams</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="max-w-4xl mx-auto pt-12">
      <div class="grid md:grid-cols-2 gap-6 mb-12">
        <Card class="p-8 hover:shadow-lg transition-shadow">
          <h2 class="text-2xl font-bold mb-4">Create Session</h2>
          <p class="text-slate-600 mb-6">
            Start a new silent sketch session and invite your team
          </p>
          <Button onclick={() => showCreateDialog = true} class="w-full">
            Create New Session
          </Button>
        </Card>

        <Card class="p-8 hover:shadow-lg transition-shadow">
          <h2 class="text-2xl font-bold mb-4">Join Session</h2>
          <p class="text-slate-600 mb-6">
            Enter a session code to join an existing session
          </p>
          <Button onclick={() => showJoinDialog = true} variant="outline" class="w-full">
            Join with Code
          </Button>
        </Card>
      </div>

      <!-- Recent Sessions -->
      {#if state.sessions.length > 0}
        <div class="mt-8">
          <h2 class="text-2xl font-bold mb-4">Recent Sessions</h2>
          <div class="grid gap-4">
            {#each state.sessions.slice(-5).reverse() as session}
              {@const myParticipant = session.participants.find(p =>
                p.name === state.currentParticipant?.name || p.id === state.currentParticipant?.id
              )}
              {@const statusColor =
                session.status === 'waiting' ? 'bg-blue-100 text-blue-700' :
                session.status === 'drawing' ? 'bg-green-100 text-green-700' :
                session.status === 'gallery' ? 'bg-purple-100 text-purple-700' :
                session.status === 'voting' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-700'
              }

              <Card class="p-4">
                <div class="flex justify-between items-start gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <h3 class="font-semibold text-lg">{session.name}</h3>
                      <span class="px-2 py-1 text-xs rounded {statusColor} uppercase">
                        {session.status}
                      </span>
                    </div>
                    <p class="text-sm text-slate-600 mb-2">
                      Code: <span class="font-mono font-bold">{session.code}</span> •
                      {session.participants.length} participant{session.participants.length !== 1 ? 's' : ''} •
                      {session.sketches.length} sketch{session.sketches.length !== 1 ? 'es' : ''}
                    </p>
                    <p class="text-xs text-slate-500">
                      Created: {new Date(session.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div class="flex gap-2">
                    <!-- View button - always visible -->
                    <Button
                      size="sm"
                      variant="outline"
                      onclick={() => handleViewSession(session)}
                    >
                      View
                    </Button>

                    <!-- Resume/Join buttons - only for active sessions -->
                    {#if myParticipant && session.status !== 'completed'}
                      <Button
                        size="sm"
                        onclick={() => handleResumeSession(session, myParticipant)}
                      >
                        Resume
                      </Button>
                    {:else if session.status !== 'completed'}
                      <Button
                        size="sm"
                        variant="outline"
                        onclick={() => {
                          showJoinDialog = true;
                          joinForm.code = session.code;
                        }}
                      >
                        Join
                      </Button>
                    {/if}

                    <Button
                      size="sm"
                      variant="destructive"
                      onclick={() => whiteboardStore.deleteSession(session.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            {/each}
          </div>
        </div>
      {/if}
    </div>

  {:else if view === 'session' && state.currentSession}
    <!-- Session View -->
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center">
            <Button variant="ghost" size="icon" onclick={() => view = "home"}>
            ←
            </Button>
            <div>
              <h2 class="text-2xl font-bold">{state.currentSession.name}</h2>
              <p class="text-sm text-slate-600">
                Code: <span class="font-mono font-bold text-lg">{state.currentSession.code}</span>
                {#if state.currentParticipant?.isHost}
                  <span class="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">HOST</span>
                {/if}
              </p>
            </div>
          </div>

          <!-- Participants -->
          <div class="flex gap-2 mt-4 flex-wrap">
            {#each state.currentSession.participants as participant}
              <div
                class="flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                style="background-color: {participant.color}20; border: 2px solid {participant.color}"
              >
                <div class="w-2 h-2 rounded-full" style="background-color: {participant.color}"></div>
                <span>{participant.name}</span>
                {#if participant.isHost}
                  <span class="text-xs">👑</span>
                {/if}
              </div>
            {/each}
          </div>
            
          <div class="flex items-center gap-4">
            {#if state.currentSession.status === 'drawing'}
              <div class="text-right">
                <div class="text-2xl font-bold font-mono text-purple-600">
                  {formatTime(timeRemaining)}
                </div>
                <div class="text-xs text-slate-600">Time Remaining</div>
              </div>
            {/if}

            <Button variant="outline" onclick={handleLeaveSession}>
              Leave Session
            </Button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      {#if state.currentSession.status === 'waiting'}
        <Card class="p-12 text-center">
          <h3 class="text-2xl font-bold mb-4">Waiting for participants...</h3>
          <p class="text-slate-600 mb-6">
            Share the code <span class="font-mono font-bold text-2xl">{state.currentSession.code}</span> with your team
          </p>
          <p class="text-sm text-slate-500 mb-8">
            {state.currentSession.participants.length} participant(s) joined
          </p>

          {#if state.currentParticipant?.isHost}
            <Button onclick={handleStartDrawing} size="lg">
              Start Drawing Session
            </Button>
          {:else}
            <p class="text-slate-600">Waiting for host to start...</p>
          {/if}
        </Card>

      {:else if state.currentSession.status === 'drawing'}
        <!-- Show info if participant just joined -->
        {#if !state.currentSession.sketches.find(s => s.participantId === state.currentParticipant?.id)}
          <Card class="p-4 mb-4 bg-blue-50 border-blue-200">
            <p class="text-sm text-blue-700">
              ℹ️ You joined after the session started. You can still participate! Draw your sketch and save it before the time runs out.
            </p>
          </Card>
        {/if}

        <!-- Host Controls for Drawing Phase -->
        {#if state.currentParticipant?.isHost}
          <Card class="p-4 mb-4 bg-slate-50">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-sm font-medium">
                  {state.currentSession.sketches.length} / {state.currentSession.participants.length} sketches submitted
                </p>
                <p class="text-xs text-slate-600 mt-1">
                  You can end drawing early or wait for the timer
                </p>
              </div>
              <Button onclick={async () => await whiteboardStore.endDrawing()} variant="outline">
                End Drawing Early
              </Button>
            </div>
          </Card>
        {/if}

        <SimpleCanvas />

      {:else if state.currentSession.status === 'gallery'}
        <div>
          <Card class="p-6 mb-4">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-xl font-bold">Gallery View</h3>
                <p class="text-sm text-slate-600">Review all sketches before voting</p>
              </div>
              {#if state.currentParticipant?.isHost}
                <Button onclick={handleStartVoting}>
                  Start Voting
                </Button>
              {:else}
                <p class="text-slate-600">Waiting for host to start voting...</p>
              {/if}
            </div>
          </Card>
          <Gallery sketches={state.currentSession.sketches} readonly={true} />
        </div>

      {:else if state.currentSession.status === 'voting'}
        <div>
          <Card class="p-6 mb-4">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-xl font-bold">Vote for Your Favorites</h3>
                <p class="text-sm text-slate-600">
                  Select up to {state.currentSession.votesPerParticipant} sketches
                </p>
              </div>
              {#if state.currentParticipant?.isHost}
                <Button onclick={handleEndVoting}>
                  End Voting
                </Button>
              {/if}
            </div>
          </Card>
          <Gallery
            sketches={state.currentSession.sketches}
            readonly={false}
            maxVotes={state.currentSession.votesPerParticipant}
          />
        </div>

      {:else if state.currentSession.status === 'completed'}
        <VotingResults sketches={state.currentSession.sketches} />
      {/if}
    </div>
  {/if}
</div>

<!-- Create Session Dialog -->
<Dialog.Root bind:open={showCreateDialog}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>Create New Session</Dialog.Title>
      <Dialog.Description>
        Set up a new silent sketch session for your team
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      {#if error}
        <div class="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
      {/if}

      <div>
        <Label for="hostName">Your Name</Label>
        <Input
          id="hostName"
          bind:value={createForm.hostName}
          placeholder="Enter your name"
        />
      </div>

      <div>
        <Label for="sessionName">Session Name</Label>
        <Input
          id="sessionName"
          bind:value={createForm.sessionName}
          placeholder="e.g., Team Brainstorm"
        />
      </div>

      <div>
        <Label for="duration">Drawing Duration (minutes)</Label>
        <Input
          id="duration"
          type="number"
          bind:value={createForm.drawingDuration}
          min="1"
          max="60"
          step="1"
          onchange={(e) => createForm.drawingDuration = parseInt(e.currentTarget.value) * 60}
        />
      </div>

      <div>
        <Label for="votes">Votes Per Participant</Label>
        <Input
          id="votes"
          type="number"
          bind:value={createForm.votesPerParticipant}
          min="1"
          max="10"
        />
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => showCreateDialog = false}>Cancel</Button>
      <Button onclick={handleCreateSession}>Create Session</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Join Session Dialog -->
<Dialog.Root bind:open={showJoinDialog}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>Join Session</Dialog.Title>
      <Dialog.Description>
        Enter the session code and your name to join
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      {#if error}
        <div class="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
      {/if}

      <div>
        <Label for="code">Session Code</Label>
        <Input
          id="code"
          bind:value={joinForm.code}
          placeholder="ABC123"
          class="font-mono text-lg uppercase"
          oninput={(e) => joinForm.code = e.currentTarget.value.toUpperCase()}
        />
      </div>

      <div>
        <Label for="participantName">Your Name</Label>
        <Input
          id="participantName"
          bind:value={joinForm.participantName}
          placeholder="Enter your name"
        />
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => showJoinDialog = false}>Cancel</Button>
      <Button onclick={handleJoinSession}>Join Session</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
