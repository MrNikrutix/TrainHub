<script setup lang="ts">
import { ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Tag from 'primevue/tag';
import Toolbar from 'primevue/toolbar';
// import IconField from 'primevue/iconfield';
// import InputIcon from 'primevue/inputicon';
import { useExercises, type Exercise } from '../composables/useExercises';

const { exercises, addExercise, updateExercise, deleteExercise: removeExercise } = useExercises();

const exerciseDialog = ref(false);
const deleteExerciseDialog = ref(false);
const exercise = ref<Exercise>({} as Exercise);
const submitted = ref(false);

const openNew = () => {
    exercise.value = {} as Exercise;
    submitted.value = false;
    exerciseDialog.value = true;
};

const hideDialog = () => {
    exerciseDialog.value = false;
    submitted.value = false;
};

const saveExercise = async () => {
    submitted.value = true;

    if (exercise.value.name?.trim()) {
        if (exercise.value.id) {
            await updateExercise(exercise.value);
        } else {
            // New exercise
            // Note: addExercise in composable expects Omit<Exercise, 'id'>, but our local ref type is Exercise (possibly partial id)
            // In a real app we'd adhere strictly to types, here we can just cast or pass.
             const { id, ...rest } = exercise.value;
             await addExercise(rest as any);
        }

        exerciseDialog.value = false;
        exercise.value = {} as Exercise;
    }
};

const editExercise = (prod: Exercise) => {
    exercise.value = { ...prod };
    exerciseDialog.value = true;
};

const confirmDeleteExercise = (prod: Exercise) => {
    exercise.value = prod;
    deleteExerciseDialog.value = true;
};

const deleteExercise = async () => {
    await removeExercise(exercise.value.id);
    deleteExerciseDialog.value = false;
    exercise.value = {} as Exercise;
};

// Helper for tags input (comma separated for simplicity in MVP)
const tagsInput = ref('');
const updateTags = () => {
    exercise.value.tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
}
// Sync tags into input when editing

</script>

<template>
    <div class="card">
        <Toolbar class="mb-4">
            <template #start>
                <Button label="Nowe ćwiczenie" icon="pi pi-plus" class="mr-2" @click="openNew" />
            </template>
        </Toolbar>

        <DataTable :value="exercises" tableStyle="min-width: 50rem">
            <Column field="name" header="Nazwa" sortable></Column>
            <Column field="instructions" header="Instrukcje"></Column>
            <Column field="enrichment" header="Enrichment"></Column>
            <Column header="Tagi">
                <template #body="slotProps">
                    <div class="flex gap-1 flex-wrap">
                        <Tag v-for="tag in slotProps.data.tags" :key="tag" :value="tag" severity="info" />
                    </div>
                </template>
            </Column>
            <Column field="videoUrl" header="Video">
                <template #body="slotProps">
                     <a v-if="slotProps.data.videoUrl" :href="slotProps.data.videoUrl" target="_blank" class="text-primary hover:underline">Link</a>
                     <span v-else>-</span>
                </template>
            </Column>
            <Column :exportable="false" style="min-width:8rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editExercise(slotProps.data); tagsInput = slotProps.data.tags.join(', ')" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteExercise(slotProps.data)" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="exerciseDialog" :style="{width: '450px'}" header="Szczegóły ćwiczenia" :modal="true" class="p-fluid">
            <div class="field mb-3">
                <label for="name" class="font-bold mb-2 block">Nazwa</label>
                <InputText id="name" v-model.trim="exercise.name" required="true" autofocus :class="{'p-invalid': submitted && !exercise.name}" class="w-full" />
                <small class="p-error text-red-500" v-if="submitted && !exercise.name">Nazwa jest wymagana.</small>
            </div>
            <div class="field mb-3">
                <label for="instructions" class="font-bold mb-2 block">Instrukcje</label>
                <Textarea id="instructions" v-model="exercise.instructions" required="true" rows="3" cols="20" class="w-full" />
            </div>
            <div class="field mb-3">
                <label for="enrichment" class="font-bold mb-2 block">Enrichment (opcjonalne)</label>
                <Textarea id="enrichment" v-model="exercise.enrichment" rows="2" cols="20" class="w-full" />
            </div>
            <div class="field mb-3">
                <label for="tags" class="font-bold mb-2 block">Tagi (po przecinku)</label>
                <InputText id="tags" v-model="tagsInput" @input="updateTags" class="w-full" placeholder="np. nogi, siła" />
            </div>
            <div class="field mb-3">
                <label for="videoUrl" class="font-bold mb-2 block">Video URL (opcjonalne)</label>
                <InputText id="videoUrl" v-model="exercise.videoUrl" class="w-full" />
            </div>

            <template #footer>
                <Button label="Anuluj" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Zapisz" icon="pi pi-check" text @click="saveExercise" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteExerciseDialog" :style="{width: '450px'}" header="Potwierdzenie" :modal="true">
            <div class="confirmation-content flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="exercise">Czy na pewno chcesz usunąć <b>{{exercise.name}}</b>?</span>
            </div>
            <template #footer>
                <Button label="Nie" icon="pi pi-times" text @click="deleteExerciseDialog = false" />
                <Button label="Tak" icon="pi pi-check" text severity="danger" @click="deleteExercise" />
            </template>
        </Dialog>
    </div>
</template>
