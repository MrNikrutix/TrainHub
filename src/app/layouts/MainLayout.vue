<script setup lang="ts">
import { RouterView } from 'vue-router';
import Sidebar from '../components/Sidebar.vue';
</script>

<template>
  <div class="layout-wrapper flex min-h-screen relative overflow-hidden">
    <!-- Ambient Background -->
    <div class="absolute inset-0 bg-no-repeat bg-cover z-0 pointer-events-none" 
         style="background: radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.08), transparent 25%), radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.08), transparent 25%);">
    </div>

    <Sidebar />
    <div class="layout-main-container flex-1 flex flex-column overflow-hidden relative z-1">
        <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7">
            <RouterView />
        </main>
    </div>
  </div>
</template>

<style scoped>
.layout-wrapper {
  width: 100%;
  height: 100vh;
}
</style>
