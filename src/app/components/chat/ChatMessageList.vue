<script setup lang="ts">
import { ref, onMounted, onUpdated, nextTick, watch } from 'vue';
import { marked } from 'marked';
import ThinkingBlock from './ThinkingBlock.vue';
import type { UiChatMessage } from '../../composables/useChatAI';

const props = defineProps<{
    messages: UiChatMessage[];
}>();

const container = ref<HTMLElement | null>(null);

const scrollToBottom = async () => {
    await nextTick();
    if (container.value) {
        container.value.scrollTop = container.value.scrollHeight;
    }
};

onMounted(scrollToBottom);

// Watch for changes to scroll
watch(() => props.messages.length, scrollToBottom);
watch(() => props.messages[props.messages.length - 1]?.content, scrollToBottom); // deep watch not needed, just length or last msg content updates

const renderMarkdown = (text: string) => {
    return marked.parse(text || "");
};
</script>

<template>
    <div class="flex-grow-1 overflow-y-auto p-4 flex flex-column gap-4" ref="container">
        <!-- Spacer -->
        <div class="h-1rem"></div>
        
        <div v-for="(msg, index) in props.messages" :key="index" class="w-full">
            <!-- System Messages -->
            <div v-if="msg.role === 'system'" class="flex justify-content-center my-2">
                 <!-- Hidden or debug only -->
            </div>

            <!-- User/Assistant Messages -->
            <div v-else class="flex gap-3" :class="{ 'justify-content-end': msg.role === 'user' }">
                
                <!-- Assistant Avatar -->
                <div v-if="msg.role === 'assistant'" class="flex-shrink-0 mt-1">
                    <div class="w-2rem h-2rem border-circle bg-primary-100 flex align-items-center justify-content-center text-primary shadow-1">
                        <i class="pi pi-bolt"></i>
                    </div>
                </div>

                <div class="flex flex-column gap-2 max-w-30rem" style="min-width: 0;">
                    
                    <!-- Thinking/Steps Block -->
                    <ThinkingBlock 
                        v-if="msg.steps && msg.steps.length > 0" 
                        :steps="msg.steps" 
                    />

                    <!-- Message Bubble -->
                    <div 
                        class="p-3 border-round-xl shadow-1 text-sm line-height-3"
                        :class="[
                            msg.role === 'user' 
                                ? 'bg-primary text-white border-round-bottom-right-xs' 
                                : 'surface-card text-color border-round-bottom-left-xs'
                        ]"
                    >
                         <div v-if="msg.role === 'assistant'" class="markdown-body" v-html="renderMarkdown(msg.content)"></div>
                         <div v-else class="white-space-pre-wrap">{{ msg.content }}</div>
                    </div>
                </div>

                <!-- User Avatar -->
                 <div v-if="msg.role === 'user'" class="flex-shrink-0 mt-1">
                    <div class="w-2rem h-2rem border-circle surface-200 flex align-items-center justify-content-center text-600">
                        <i class="pi pi-user"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-if="props.messages.length <= 1" class="flex flex-column align-items-center justify-content-center h-full text-500 opacity-50">
             <i class="pi pi-comments text-5xl mb-3"></i>
             <p>Rozpocznij konwersację...</p>
        </div>
    </div>
</template>

<style>
/* Markdown Styles integrated with PrimeFlex colors */
.markdown-body p { margin-bottom: 0.75em; }
.markdown-body p:last-child { margin-bottom: 0; }
.markdown-body ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 0.75em; }
.markdown-body ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 0.75em; }
.markdown-body code { 
    background: var(--surface-hover); 
    padding: 0.2em 0.4em; 
    border-radius: 4px; 
    font-family: monospace; 
    font-size: 0.9em; 
    color: var(--text-color);
}
.bg-primary .markdown-body code {
    background: rgba(255,255,255,0.2);
    color: white;
}
.markdown-body pre { 
    background: var(--surface-ground); 
    padding: 1em; 
    border-radius: 8px; 
    overflow-x: auto; 
    margin-bottom: 0.75em; 
    border: 1px solid var(--surface-border);
}
.markdown-body pre code { background: none; padding: 0; color: var(--text-color); }
.markdown-body strong { font-weight: 700; }
.markdown-body a { color: var(--primary-color); text-decoration: underline; }
</style>
