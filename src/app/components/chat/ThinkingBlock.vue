<script setup lang="ts">
import { ref } from 'vue';
import type { ThinkingStep } from '../../composables/useChatAI';

const props = defineProps<{
    steps: ThinkingStep[];
    isReasoning?: boolean;
}>();

const isExpanded = ref(true);

const toggleExpand = () => {
    isExpanded.value = !isExpanded.value;
};

const statusIcon = (status: string) => {
    switch (status) {
        case 'running': return 'pi pi-spin pi-spinner text-blue-500';
        case 'completed': return 'pi pi-check-circle text-green-500';
        case 'error': return 'pi pi-times-circle text-red-500';
        default: return 'pi pi-circle text-500';
    }
};
</script>

<template>
    <div class="thinking-block my-2 border-1 surface-border border-round surface-card overflow-hidden">
        <!-- Header -->
        <div 
            class="flex align-items-center justify-content-between p-3 cursor-pointer hover:surface-hover transition-colors"
            @click="toggleExpand"
        >
            <div class="flex align-items-center gap-2">
                <i v-if="props.isReasoning" class="pi pi-bolt text-purple-500"></i>
                <i v-else class="pi pi-cog text-orange-500"></i>
                <span class="text-sm font-medium text-color">
                    {{ props.isReasoning ? 'Proces myślowy' : 'Działania asystenta' }}
                </span>
                <span class="text-xs text-color-secondary ml-2">({{ props.steps.length }} kroki)</span>
            </div>
            <i class="pi pi-chevron-down text-color-secondary transition-transform duration-200" :class="{ 'rotate-180': isExpanded }"></i>
        </div>

        <!-- Body -->
        <div v-show="isExpanded" class="border-top-1 surface-border p-3 surface-ground">
            <div class="flex flex-column gap-2">
                <div 
                    v-for="step in props.steps" 
                    :key="step.id"
                    class="flex align-items-start gap-2 text-sm"
                >
                    <div class="mt-1 flex-shrink-0">
                        <i :class="statusIcon(step.status)"></i>
                    </div>
                    <div class="flex-grow-1 min-w-0">
                        <div class="font-medium text-color">
                            {{ step.title }}
                        </div>
                        <div v-if="step.details" class="mt-1 text-color-secondary text-xs font-mono surface-card p-2 border-round border-1 surface-border overflow-x-auto white-space-pre-wrap">
                            {{ step.details }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.thinking-block {
    font-family: var(--font-family);
}
</style>
