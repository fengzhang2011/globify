<script lang="ts">
  import { goto } from '$app/navigation';
  import { Card } from '$lib/components/ui/card';
  import { cn } from '$lib/utils';

  interface App {
    id: string;
    name: string;
    icon: string;
    color: string;
    route: string;
    description: string;
  }

  const apps: App[] = [
    {
      id: 'okr',
      name: 'OKR System',
      icon: '🎯',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      route: '/okr',
      description: 'Objectives and Key Results Management'
    },
    {
      id: 'issues',
      name: 'Issues',
      icon: '📋',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      route: '/issues',
      description: 'Jira-like Issue Tracking System'
    },
    {
      id: 'crm',
      name: 'CRM',
      icon: '💼',
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      route: '/crm',
      description: 'Track Leads and Close Opportunities'
    },
    {
      id: 'sales',
      name: 'Sales',
      icon: '📄',
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      route: '/sales',
      description: 'Quotations and Invoices Management'
    },
    {
      id: 'chat',
      name: 'Chat',
      icon: '💬',
      color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      route: '/chat',
      description: 'Real-time Messaging with MQTT & WebSockets'
    },
    {
      id: 'whiteboard',
      name: 'Sketch Design',
      icon: '🎨',
      color: 'bg-gradient-to-br from-purple-500 to-pink-500',
      route: '/whiteboard',
      description: 'Collaborative Silent Whiteboard Sessions'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: '📊',
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      route: '#',
      description: 'Data Analytics and Insights'
    },
    {
      id: 'team',
      name: 'Team',
      icon: '👥',
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      route: '#',
      description: 'Team Management and Collaboration'
    },
    {
      id: 'calendar',
      name: 'Calendar',
      icon: '📅',
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      route: '#',
      description: 'Schedule and Events'
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: '⚙️',
      color: 'bg-gradient-to-br from-gray-600 to-gray-700',
      route: '#',
      description: 'System Configuration'
    }
  ];

  let hoveredApp = $state<string | null>(null);

  function handleAppClick(app: App) {
    if (app.route !== '#') {
      goto(app.route);
    }
  }
</script>

<svelte:head>
  <title>Octyde - Project Management Suite</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 flex flex-col">
  <!-- Header -->
  <div class="pt-12 pb-8 text-center">
    <h1 class="text-5xl font-bold text-slate-900 mb-3">Octyde</h1>
    <p class="text-lg text-slate-600">Your Complete Project Management Suite</p>
  </div>

  <!-- App Grid -->
  <div class="flex-1 flex items-center justify-center px-8 pb-16">
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl w-full">
      {#each apps as app}
        <button
          class="group relative"
          onclick={() => handleAppClick(app)}
          onmouseenter={() => hoveredApp = app.id}
          onmouseleave={() => hoveredApp = null}
        >
          <Card class={cn(
            "p-8 flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer border-2",
            "hover:scale-105 hover:shadow-2xl hover:border-slate-300",
            hoveredApp === app.id && "scale-105 shadow-2xl border-slate-300"
          )}>
            <!-- App Icon -->
            <div class={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg transition-all",
              app.color,
              hoveredApp === app.id && "scale-110"
            )}>
              {app.icon}
            </div>

            <!-- App Name -->
            <div class="text-center">
              <h3 class="font-semibold text-slate-900 text-lg mb-1">{app.name}</h3>
              <div class="h-5">
              <p class="text-xs text-slate-600 line-clamp-2 transition-opacity" class:opacity-100={hoveredApp === app.id} class:opacity-0={hoveredApp !== app.id}>
                {app.description}
              </p>
            </div>
            </div>
          </Card>

          <!-- Coming Soon Badge (for apps without routes) -->
          {#if app.route === '#'}
            <div class="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-md">
              Soon
            </div>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- Footer -->
  <div class="pb-8 text-center text-sm text-slate-500">
    <p>Powered by SvelteKit & shadcn-svelte</p>
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
