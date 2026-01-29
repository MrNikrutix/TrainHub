<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import ToggleButton from 'primevue/togglebutton';
import { useExercises } from '../composables/useExercises';
import { useActiveWorkout } from '../composables/useActiveWorkout';
import { useTrainingPlans, type TrainingPlan, type TrainingExercise } from '../composables/useTrainingPlans';
import { useRouter } from 'vue-router';

const router = useRouter();
const { startWorkout } = useActiveWorkout();
const { plans, createPlan: createNewPlan, deletePlan: removePlan, updatePlan } = useTrainingPlans();

// --- Shared State ---
const { exercises, addExercise } = useExercises();

// --- State ---
const activePlanId = ref<string | null>(null);
const currentPlan = ref<TrainingPlan | null>(null);

const showAddExerciseDialog = ref(false);
const activeSectionId = ref<string | null>(null);

// New/Select Exercise Form
const selectedExerciseId = ref<string | null>(null);
const newExerciseName = ref('');
const newExerciseInstructions = ref('');
const newExerciseTags = ref('');
const isCreatingNew = ref(false);

// --- Actions ---
const selectPlan = (plan: TrainingPlan) => {
    // Clone deeply to avoid editing list directly before save (mock)
    currentPlan.value = JSON.parse(JSON.stringify(plan));
    activePlanId.value = plan.id;
};

const startSession = () => {
    if (currentPlan.value) {
        startWorkout(currentPlan.value);
        router.push('/timer');
    }
}

const createPlan = async () => {
    const newPlan = await createNewPlan();
    selectPlan(newPlan);
};

const savePlan = async () => {
    if (currentPlan.value) {
        await updatePlan(JSON.parse(JSON.stringify(currentPlan.value)));
        // alert('Plan zapisany!');
    }
};

const deletePlan = async (id: string) => {
    await removePlan(id);
    if (activePlanId.value === id) {
        currentPlan.value = null;
        activePlanId.value = null;
    }
};

const addSection = () => {
    if (currentPlan.value) {
        currentPlan.value.sections.push({
            id: Math.random().toString(36).substr(2, 9),
            name: 'Nowa Sekcja',
            exercises: []
        });
    }
};

const removeSection = (sectionIndex: number) => {
    if (currentPlan.value) {
        currentPlan.value.sections.splice(sectionIndex, 1);
    }
};

const moveSection = (index: number, direction: -1 | 1) => {
    if (!currentPlan.value) return;
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < currentPlan.value.sections.length) {
        const temp = currentPlan.value.sections[index];
        currentPlan.value.sections[index] = currentPlan.value.sections[newIndex];
        currentPlan.value.sections[newIndex] = temp;
    }
}

const openAddExercise = (sectionId: string) => {
    activeSectionId.value = sectionId;
    selectedExerciseId.value = null;
    newExerciseName.value = '';
    newExerciseInstructions.value = '';
    newExerciseTags.value = '';
    isCreatingNew.value = false;
    showAddExerciseDialog.value = true;
};

const confirmAddExercise = async () => {
    if (!currentPlan.value || !activeSectionId.value) return;

    let exId = selectedExerciseId.value;
    let exName = '';

    if (isCreatingNew.value) {
        if (!newExerciseName.value.trim()) return;
        // Create new in detailed DB
        const newEx = await addExercise({
             name: newExerciseName.value,
             instructions: newExerciseInstructions.value,
             enrichment: '',
             tags: newExerciseTags.value.split(',').map(t => t.trim()).filter(t => t),
             videoUrl: ''
        });
        exId = newEx.id;
        exName = newEx.name;
    } else {
        if (!exId) return;
        const existing = exercises.value.find(e => e.id === exId);
        if (existing) exName = existing.name;
    }

    // Add to section
    const section = currentPlan.value.sections.find(s => s.id === activeSectionId.value);
    if (section) {
        section.exercises.push({
            instanceId: Math.random().toString(36).substr(2, 9),
            exerciseId: exId!,
            name: exName,
            sets: 3,
            value: 10,
            isTime: false,
            rest: 60
        });
    }

    showAddExerciseDialog.value = false;
};

const removeExerciseFromSection = (sectionId: string, exInstanceId: string) => {
    if (!currentPlan.value) return;
    const section = currentPlan.value.sections.find(s => s.id === sectionId);
    if (section) {
        section.exercises = section.exercises.filter(e => e.instanceId !== exInstanceId);
    }
};

// Simple Drag and Drop for Exercises (Swapping/Reordering within section logic could be complex without library)
// For MVP, implementing Move Up/Down arrows for exercises
const moveExercise = (sectionId: string, index: number, direction: -1 | 1) => {
    const section = currentPlan.value?.sections.find(s => s.id === sectionId);
    if (section) {
         const newIndex = index + direction;
         if (newIndex >= 0 && newIndex < section.exercises.length) {
            const temp = section.exercises[index];
            section.exercises[index] = section.exercises[newIndex];
            section.exercises[newIndex] = temp;
         }
    }
};

// Drag & Drop between sections (Mock implementation using Drag Events)
const draggedExercise = ref<{ ex: TrainingExercise, sourceSectionId: string } | null>(null);

const onDragStart = (ex: TrainingExercise, sectionId: string) => {
    draggedExercise.value = { ex, sourceSectionId: sectionId };
};

const onDrop = (targetSectionId: string) => {
    if (draggedExercise.value && currentPlan.value) {
        const { ex, sourceSectionId } = draggedExercise.value;
        if (sourceSectionId === targetSectionId) return; // Reordering handled by buttons/sortable for now

        // Remove from source
        const sourceSec = currentPlan.value.sections.find(s => s.id === sourceSectionId);
        if (sourceSec) {
            sourceSec.exercises = sourceSec.exercises.filter(e => e.instanceId !== ex.instanceId);
        }

        // Add to target
        const targetSec = currentPlan.value.sections.find(s => s.id === targetSectionId);
        if (targetSec) {
            targetSec.exercises.push(ex);
        }

        draggedExercise.value = null;
    }
};

</script>

<template>
    <div class="h-full flex gap-4">
        <!-- Sidebar: List of Plans -->
        <div class="w-16rem flex-shrink-0 flex flex-column gap-2 border-right-1 surface-border pr-3">
            <div class="flex justify-content-between align-items-center mb-2">
                <span class="font-bold text-lg">Twoje Plany</span>
                <Button icon="pi pi-plus" size="small" rounded text @click="createPlan" />
            </div>
            
            <div class="flex flex-column gap-2 overflow-y-auto flex-grow-1">
                <div v-for="plan in plans" :key="plan.id" 
                     class="p-3 surface-card border-round cursor-pointer hover:surface-hover transition-colors border-left-3"
                     :class="activePlanId === plan.id ? 'border-primary surface-hover' : 'border-transparent'"
                     @click="selectPlan(plan)">
                    <div class="font-bold mb-1">{{ plan.name }}</div>
                    <div class="text-xs text-color-secondary">{{ plan.sections.length }} sekcji</div>
                </div>
            </div>
        </div>

        <!-- Main Editor -->
        <div class="flex-grow-1 overflow-y-auto" v-if="currentPlan">
            <div class="flex justify-content-between align-items-center mb-4">
                 <div class="flex align-items-center gap-3">
                     <InputText v-model="currentPlan.name" class="text-xl font-bold border-none shadow-none p-0 w-20rem" placeholder="Nazwa Planu" />
                 </div>
                 <div class="flex gap-2">
                     <Button label="Rozpocznij" icon="pi pi-play" severity="success" @click="startSession" />
                     <Button label="Zapisz" icon="pi pi-check" @click="savePlan" />
                     <Button icon="pi pi-trash" severity="danger" outlined @click="deletePlan(currentPlan.id)" />
                 </div>
            </div>

            <div class="flex flex-column gap-4 pb-8">
                <div v-for="(section, sIndex) in currentPlan.sections" :key="section.id"
                     class="surface-card p-4 border-round shadow-1"
                     @dragover.prevent @drop="onDrop(section.id)">
                    
                    <div class="flex justify-content-between align-items-center mb-3">
                         <div class="flex align-items-center gap-2">
                             <InputText v-model="section.name" class="font-bold border-none shadow-none p-0" placeholder="Nazwa Sekcji" />
                         </div>
                         <div class="flex gap-1">
                             <Button icon="pi pi-arrow-up" text rounded size="small" :disabled="sIndex === 0" @click="moveSection(sIndex, -1)"/>
                             <Button icon="pi pi-arrow-down" text rounded size="small" :disabled="sIndex === currentPlan.sections.length - 1" @click="moveSection(sIndex, 1)"/>
                             <Button icon="pi pi-times" text rounded severity="danger" size="small" @click="removeSection(sIndex)"/>
                         </div>
                    </div>

                    <div class="flex flex-column gap-3 min-h-3rem"> <!-- min-height for drop zone -->
                        <div v-for="(ex, exIndex) in section.exercises" :key="ex.instanceId"
                             class="surface-ground p-3 border-round border-left-3 border-primary"
                             draggable="true" @dragstart="onDragStart(ex, section.id)">
                            
                            <!-- Header: Name & Controls -->
                            <div class="flex justify-content-between align-items-start mb-3">
                                <span class="font-bold">{{ ex.name }}</span>
                                <div class="flex gap-1">
                                    <Button icon="pi pi-arrow-up" text rounded size="small" class="p-0 w-2rem h-2rem" :disabled="exIndex === 0" @click="moveExercise(section.id, exIndex, -1)"/>
                                    <Button icon="pi pi-arrow-down" text rounded size="small" class="p-0 w-2rem h-2rem" :disabled="exIndex === section.exercises.length - 1" @click="moveExercise(section.id, exIndex, 1)"/>
                                    <Button icon="pi pi-trash" text rounded severity="danger" size="small" class="p-0 w-2rem h-2rem" @click="removeExerciseFromSection(section.id, ex.instanceId)"/>
                                </div>
                            </div>

                            <!-- Details Grid -->
                            <div class="grid align-items-center gy-2"> <!-- gy-2 for vertical gap -->
                                <div class="col-12 md:col-3 flex align-items-center gap-2">
                                     <label class="text-sm font-semibold">Sets</label>
                                     <InputNumber v-model="ex.sets" showButtons :min="1" buttonLayout="horizontal" inputClass="w-3rem text-center p-1" class="w-full" />
                                </div>
                                
                                <div class="col-12 md:col-5 flex align-items-center gap-2">
                                     <ToggleButton v-model="ex.isTime" onLabel="Czas (s)" offLabel="Powt." onIcon="pi pi-clock" offIcon="pi pi-hashtag" class="w-6rem text-xs" />
                                     <InputNumber v-model="ex.value" showButtons :min="1" buttonLayout="horizontal" inputClass="w-4rem text-center p-1" />
                                </div>

                                <div class="col-12 md:col-4 flex align-items-center gap-2 justify-content-end">
                                     <label class="text-sm font-semibold">Rest (s)</label>
                                     <InputNumber v-model="ex.rest" showButtons :step="10" :min="0" buttonLayout="horizontal" inputClass="w-3rem text-center p-1" />
                                </div>
                            </div>
                        </div>

                        <div v-if="section.exercises.length === 0" class="text-center text-sm text-color-secondary py-3 border-1 border-dashed surface-border border-round">
                            Przeciągnij tutaj lub dodaj ćwiczenie
                        </div>
                    </div>

                    <div class="mt-3 text-center">
                        <Button label="Dodaj ćwiczenie" icon="pi pi-plus" size="small" text @click="openAddExercise(section.id)" />
                    </div>
                </div>

                <div class="text-center">
                    <Button label="Dodaj Sekcję" icon="pi pi-plus" outlined @click="addSection" />
                </div>
            </div>
        </div>

        <div v-else class="flex-grow-1 flex align-items-center justify-content-center text-color-secondary">
             Wybierz lub utwórz plan z listy po lewej
        </div>

        <!-- Add Exercise Dialog -->
        <Dialog v-model:visible="showAddExerciseDialog" header="Dodaj ćwiczenie" :style="{ width: '400px' }" modal>
             <div class="flex flex-column gap-3">
                 <div class="flex gap-2 mb-2">
                     <Button label="Wybierz z listy" :outlined="isCreatingNew" class="flex-1" @click="isCreatingNew = false" size="small" />
                     <Button label="Utwórz nowe" :outlined="!isCreatingNew" class="flex-1" @click="isCreatingNew = true" size="small" />
                 </div>

                 <div v-if="!isCreatingNew">
                     <label class="block mb-2 font-bold">Znajdź ćwiczenie</label>
                     <Select v-model="selectedExerciseId" :options="exercises" optionLabel="name" optionValue="id" filter showClear placeholder="Wybierz..." class="w-full" />
                 </div>
                 
                 <div v-else>
                     <div class="field mb-3">
                         <label class="block mb-2 font-bold">Nazwa nowego ćwiczenia</label>
                         <InputText v-model="newExerciseName" class="w-full" placeholder="Np. Wyciskanie sztangi" autofocus />
                     </div>
                     <div class="field mb-3">
                         <label class="block mb-2 font-bold">Opis / Instrukcje</label>
                         <Textarea v-model="newExerciseInstructions" class="w-full" rows="2" placeholder="Krótki opis..." />
                     </div>
                     <div class="field mb-3">
                         <label class="block mb-2 font-bold">Tagi</label>
                         <InputText v-model="newExerciseTags" class="w-full" placeholder="np. klatka, siła (po przecinku)" />
                     </div>
                     <small class="block mt-2 text-color-secondary">Zostanie dodane do globalnej bazy ćwiczeń.</small>
                 </div>
             </div>

             <template #footer>
                 <Button label="Anuluj" text @click="showAddExerciseDialog = false" />
                 <Button label="Dodaj" icon="pi pi-check" @click="confirmAddExercise" :disabled="(!isCreatingNew && !selectedExerciseId) || (isCreatingNew && !newExerciseName)" />
             </template>
        </Dialog>
    </div>
</template>

<style scoped>
:deep(.p-inputnumber-button) {
    width: 1.5rem;
}
</style>
