<script setup lang="ts">
import { ref, nextTick } from 'vue';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';

const props = defineProps<{
    isLoading: boolean;
}>();

const emit = defineEmits<{
    (e: 'send', text: string): void;
}>();

const text = ref("");

const handleSend = () => {
    if (!text.value.trim() || props.isLoading) return;
    emit('send', text.value);
    text.value = "";
};

const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
};
</script>

<template>
    <div class="surface-card border-top-1 surface-border p-3">
        <div class="relative max-w-50rem mx-auto border-1 surface-border border-round-xl shadow-1 surface-ground focus-within:border-primary transition-colors">
            <Textarea 
                v-model="text" 
                autoResize 
                rows="1" 
                placeholder="Zapytaj asystenta..." 
                class="w-full border-none shadow-none bg-transparent p-3 text-base"
                style="max-height: 150px; min-height: 50px; resize: none;"
                @keydown="handleKeydown"
                :disabled="props.isLoading"
            />
            
            <div class="flex align-items-center justify-content-between px-2 pb-2">
                <div class="flex gap-1">
                    <!-- Placeholder buttons -->
                </div>
                <div class="flex align-items-center gap-2">
                    <small class="text-color-secondary hidden md:block mr-2">
                        Enter to send
                    </small>
                    <Button 
                        icon="pi pi-arrow-up" 
                        rounded 
                        :disabled="!text.trim() || props.isLoading"
                        @click="handleSend"
                        class="h-2rem w-2rem"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
