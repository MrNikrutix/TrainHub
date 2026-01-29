<script setup lang="ts">
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import RadioButton from 'primevue/radiobutton';
import Toolbar from 'primevue/toolbar';
import { useConfirm } from "primevue/useconfirm";
import { useExercises } from '../composables/useExercises';
import { useTrainingPlans } from '../composables/useTrainingPlans';
import { useTrainingPrograms, type WeekDay, type Workout, type Week } from '../composables/useTrainingPrograms';

// --- Shared Data ---
const { exercises } = useExercises();
const { plans } = useTrainingPlans();
const { 
    programs, 
    activeProgram, 
    activeProgramId, 
    createProgram, 
    deleteProgram: deleteProgramAction,
    duplicateProgram: duplicateProgramAction,
    addWeek: addWeekAction,
    deleteWeek: deleteWeekAction,
    addWorkout: addWorkoutAction,
    updateWorkout: updateWorkoutAction,
    deleteWorkout: deleteWorkoutAction,
    updateWeekNote: updateWeekNoteAction
} = useTrainingPrograms();

const confirm = useConfirm();

// --- Computed Accessors ---
const weeks = computed(() => activeProgram.value?.weeks || []);
const workouts = computed(() => activeProgram.value?.workouts || []);

const weekDays: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// --- State ---
const showWorkoutDialog = ref(false);
const showNotesDialog = ref(false);
const showProgramDialog = ref(false);
const newProgramName = ref('');

const editingWorkout = ref<Workout>({} as Workout);
const currentWeekIdForNote = ref<string | null>(null);
const currentNote = ref('');

// --- Actions (Programs) ---
const openNewProgram = () => {
    newProgramName.value = '';
    showProgramDialog.value = true;
};

const saveNewProgram = async () => {
    if (newProgramName.value.trim()) {
        await createProgram(newProgramName.value.trim());
        showProgramDialog.value = false;
    }
};

const confirmDeleteProgram = (event: Event) => {
    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: 'Czy na pewno chcesz usunąć ten kalendarz?',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            if (activeProgramId.value) await deleteProgramAction(activeProgramId.value);
        }
    });
};

const onDuplicateProgram = async () => {
    if (activeProgramId.value) {
        await duplicateProgramAction(activeProgramId.value);
    }
};

// --- Actions (Weeks) ---
const addWeek = async () => {
    if (!activeProgram.value || !activeProgramId.value) return;
    await addWeekAction(activeProgramId.value);
};

const deleteWeek = async (id: string) => {
    if (!activeProgram.value) return;
    await deleteWeekAction(id);
};

// --- Actions (Workouts) ---
const openAddWorkout = (weekId: string, day: WeekDay) => {
    editingWorkout.value = {
        id: '', // Empty for new
        weekId,
        programId: activeProgramId.value || '',
        day,
        type: 'exercise', // default
        name: '',
        description: '',
        completed: false
    };
    showWorkoutDialog.value = true;
};

const editWorkout = (workout: Workout) => {
    editingWorkout.value = { ...workout };
    if (!editingWorkout.value.type) editingWorkout.value.type = 'exercise';
    showWorkoutDialog.value = true;
};

const saveWorkout = async () => {
    if (!activeProgram.value || !activeProgramId.value) return;
    
    // Auto-fill name if empty
    if (!editingWorkout.value.name) {
        if (editingWorkout.value.type === 'exercise' && editingWorkout.value.exerciseId) {
            const ex = exercises.value.find(e => e.id === editingWorkout.value.exerciseId);
            if (ex) editingWorkout.value.name = ex.name;
        } else if (editingWorkout.value.type === 'plan' && editingWorkout.value.planId) {
            const p = plans.value.find(pl => pl.id === editingWorkout.value.planId);
            if (p) editingWorkout.value.name = p.name;
        }
    }

    if (editingWorkout.value.name?.trim()) {
        const payload = { ...editingWorkout.value, programId: activeProgramId.value };
        
        if (editingWorkout.value.id) {
            await updateWorkoutAction(payload);
        } else {
             // New
            await addWorkoutAction(payload);
        }
        showWorkoutDialog.value = false;
    }
};

const deleteWorkout = async (id: string) => {
    if (!activeProgram.value) return;
    await deleteWorkoutAction(id);
    showWorkoutDialog.value = false;
};

const onExerciseSelect = () => {
    if (editingWorkout.value.type === 'exercise') {
        const ex = exercises.value.find(e => e.id === editingWorkout.value.exerciseId);
        if (ex) editingWorkout.value.name = ex.name;
    }
}

const onPlanSelect = () => {
    if (editingWorkout.value.type === 'plan') {
         const p = plans.value.find(pl => pl.id === editingWorkout.value.planId);
         if (p) {
             editingWorkout.value.name = p.name;
             editingWorkout.value.description = `${p.sections.length} Sekcji`;
         }
    }
}

// --- Notes ---
const openNotes = (week: Week) => {
    currentWeekIdForNote.value = week.id;
    currentNote.value = week.notes;
    showNotesDialog.value = true;
};

const saveNotes = async () => {
    if (!activeProgram.value) return;
    if (currentWeekIdForNote.value) {
        await updateWeekNoteAction(currentWeekIdForNote.value, currentNote.value);
    }
    showNotesDialog.value = false;
};

const toggleComplete = async (workout: Workout) => {
    const updated = { ...workout, completed: !workout.completed };
    await updateWorkoutAction(updated);
};

// --- Helpers ---
// Use memoization/computed if performance issues, but filter is fine for small lists
const getWorkoutsFor = (weekId: string, day: WeekDay) => {
    return workouts.value.filter((w: Workout) => w.weekId === weekId && w.day === day);
};

const dayLabels: Record<WeekDay, string> = {
    'Monday': 'Poniedziałek',
    'Tuesday': 'Wtorek',
    'Wednesday': 'Środa',
    'Thursday': 'Czwartek',
    'Friday': 'Piątek',
    'Saturday': 'Sobota',
    'Sunday': 'Niedziela'
};

// --- D&D ---
const draggedWorkout = ref<Workout | null>(null);

const onDragStart = (event: DragEvent, workout: Workout) => {
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.dropEffect = 'move';
    }
    draggedWorkout.value = workout;
};

const onDrop = async (_event: DragEvent, weekId: string, day: WeekDay) => {
    if (draggedWorkout.value) {
        if (draggedWorkout.value.weekId !== weekId || draggedWorkout.value.day !== day) {
             draggedWorkout.value.weekId = weekId;
             draggedWorkout.value.day = day;
             await updateWorkoutAction(draggedWorkout.value);
        }
        draggedWorkout.value = null;
    }
};
</script>

<template>
    <div class="h-full flex flex-column">
        <!-- New Header with Program Selection -->
        <Toolbar class="mb-4 p-2 border-round-xl">
            <template #start>
                 <div class="flex align-items-center gap-2">
                    <i class="pi pi-calendar text-2xl text-primary mr-2"></i>
                    <Select v-model="activeProgramId" :options="programs" optionLabel="name" optionValue="id" 
                              class="w-15rem" placeholder="Wybierz Kalendarz" />
                    <Button icon="pi pi-plus" text rounded v-tooltip="'Nowy Kalendarz'" @click="openNewProgram" />
                    <Button icon="pi pi-clone" text rounded v-tooltip="'Duplikuj Kalendarz'" @click="onDuplicateProgram" :disabled="!activeProgramId"/>
                    <Button icon="pi pi-trash" text rounded severity="danger" v-tooltip="'Usuń Kalendarz'" @click="confirmDeleteProgram" :disabled="!activeProgramId"/>
                 </div>
            </template>
            <template #end>
                 <Button label="Dodaj Tydzień" icon="pi pi-plus" @click="addWeek" :disabled="!activeProgramId" />
            </template>
        </Toolbar>

        <div v-if="!activeProgramId" class="flex flex-column align-items-center justify-content-center flex-grow-1 text-color-secondary">
            <i class="pi pi-calendar-times text-6xl mb-3"></i>
            <div class="text-xl">Brak wybranego kalendarza</div>
            <Button label="Stwórz nowy" class="mt-3" @click="openNewProgram" />
        </div>

        <div v-else class="flex-grow-1 overflow-y-auto">
             <!-- Header Row -->
             <div class="grid m-0 mb-2 hidden md:flex text-center font-bold text-color-secondary border-bottom-1 surface-border pb-2">
                 <div class="col-1 text-left">Tydzień</div>
                 <div v-for="day in weekDays" :key="day" class="col">{{ dayLabels[day] }}</div>
             </div>

             <!-- Weeks List -->
             <div v-for="week in weeks" :key="week.id" class="mb-5">
                <div class="grid m-0 surface-card border-round shadow-1 p-2">
                    <!-- Week Number & Controls -->
                    <div class="col-12 md:col-1 flex md:flex-column align-items-center justify-content-center border-bottom-1 md:border-bottom-none md:border-right-1 surface-border p-3 gap-2">
                         <div class="text-2xl font-bold text-primary">{{ week.position }}</div>
                         <div class="text-xs text-color-secondary">TYDZIEŃ</div>
                         
                         <Button icon="pi pi-file-edit" text rounded severity="secondary" v-tooltip="'Notatki'" @click="openNotes(week)" :badge="week.notes ? '!' : undefined" />
                         <Button icon="pi pi-trash" text rounded severity="danger" v-tooltip="'Usuń tydzień'" @click="deleteWeek(week.id)" />
                    </div>

                    <!-- Days -->
                    <div v-for="day in weekDays" :key="day" 
                         class="col-12 md:col flex flex-column border-bottom-1 md:border-bottom-none md:border-right-1 surface-border p-2 min-h-10rem transition-colors hover:surface-ground group relative"
                         @dragover.prevent @dragenter.prevent @drop="onDrop($event, week.id, day)">
                        
                        <!-- Header: Label + Add Button -->
                        <div class="flex justify-content-between align-items-center mb-2">
                             <span class="font-bold text-sm md:hidden">{{ dayLabels[day] }}</span> <!-- Mobile -->
                             <span class="hidden md:inline"></span> <!-- Spacer for Desktop to keep button right -->
                             <!-- Add Button: Always visible on mobile, opacity on desktop -->
                             <Button icon="pi pi-plus" size="small" rounded text severity="primary" class="md:opacity-0 group-hover:opacity-100 transition-opacity" @click="openAddWorkout(week.id, day)" v-tooltip="'Dodaj Trening'" />
                        </div>

                        <!-- Workouts List -->
                        <div class="flex flex-column gap-2 flex-grow-1 h-full cursor-pointer" @click.self="openAddWorkout(week.id, day)">
                             <div v-for="workout in getWorkoutsFor(week.id, day)" :key="workout.id" 
                                  class="surface-overlay p-2 border-round shadow-1 cursor-move hover:shadow-2 border-left-3 select-none"
                                  :class="{
                                      'border-green-500': workout.completed, 
                                      'border-primary': !workout.completed && workout.type !== 'plan',
                                      'border-purple-500': !workout.completed && workout.type === 'plan',
                                      'opacity-50': workout.completed
                                  }"
                                  draggable="true" @dragstart="onDragStart($event, workout)"
                                  @click.stop="editWorkout(workout)">
                                  
                                  <div class="font-semibold text-sm mb-1 flex justify-content-between align-items-start">
                                      <div class="flex align-items-center gap-2">
                                          <i v-if="workout.type === 'plan'" class="pi pi-book text-purple-500 text-xs"></i>
                                          <span>{{ workout.name }}</span>
                                      </div>
                                      <i v-if="workout.completed" class="pi pi-check-circle text-green-500 text-xs"></i>
                                  </div>
                                  <div class="text-xs text-color-secondary text-overflow-ellipsis overflow-hidden white-space-nowrap">{{ workout.description }}</div>
                             </div>
                             
                             <!-- Empty State Helper (Click to add) -->
                             <div v-if="getWorkoutsFor(week.id, day).length === 0" class="h-full flex align-items-center justify-content-center opacity-0 group-hover:opacity-50 text-xs text-color-secondary cursor-pointer" @click="openAddWorkout(week.id, day)">
                                <i class="pi pi-plus mr-1"></i> Dodaj
                             </div>
                        </div>
                    </div>
                </div>
                
                <!-- Notes Preview -->
                 <div v-if="week.notes" class="mt-2 text-sm text-color-secondary px-3">
                     <i class="pi pi-info-circle mr-1"></i> {{ week.notes }}
                 </div>
             </div>
        </div>

        <!-- Dialogs -->
        <Dialog v-model:visible="showWorkoutDialog" header="Dodaj Aktywność" :style="{ width: '450px' }" modal>
            <div class="field mb-4">
                <label class="block mb-2 font-bold">Rodzaj</label>
                <div class="flex gap-4">
                    <div class="flex align-items-center">
                        <RadioButton v-model="editingWorkout.type" inputId="tEx" name="type" value="exercise" />
                        <label for="tEx" class="ml-2 cursor-pointer">Ćwiczenie</label>
                    </div>
                    <div class="flex align-items-center">
                        <RadioButton v-model="editingWorkout.type" inputId="tPlan" name="type" value="plan" />
                        <label for="tPlan" class="ml-2 cursor-pointer">Plan Treningowy</label>
                    </div>
                </div>
            </div>

            <!-- Single Exercise Mode -->
            <div v-if="editingWorkout.type === 'exercise'" class="field mb-3 animate-fade-in">
                <label for="wEx" class="block mb-2 font-bold">Wybierz z bazy (opcjonalne)</label>
                <Select id="wEx" v-model="editingWorkout.exerciseId" :options="exercises" optionLabel="name" optionValue="id" 
                          placeholder="Wybierz ćwiczenie" class="w-full" showClear filter @change="onExerciseSelect" />
            </div>

            <!-- Plan Mode -->
            <div v-if="editingWorkout.type === 'plan'" class="field mb-3 animate-fade-in">
                <label for="wPlan" class="block mb-2 font-bold">Wybierz Plan</label>
                 <Select id="wPlan" v-model="editingWorkout.planId" :options="plans" optionLabel="name" optionValue="id" 
                          placeholder="Wybierz plan" class="w-full" showClear @change="onPlanSelect" />
            </div>

            <div class="field mb-3">
                <label for="wName" class="block mb-2 font-bold">Nazwa</label>
                <InputText id="wName" v-model="editingWorkout.name" class="w-full" />
            </div>
            <div class="field mb-3">
                <label for="wDesc" class="block mb-2 font-bold">Opis / Notatki</label>
                <Textarea id="wDesc" v-model="editingWorkout.description" class="w-full" rows="3" />
            </div>
            <div class="flex align-items-center gap-2 mb-3">
                <Button :icon="editingWorkout.completed ? 'pi pi-check-circle' : 'pi pi-circle'" 
                        :label="editingWorkout.completed ? 'Ukończono' : 'Oznacz jako ukończone'" 
                        :severity="editingWorkout.completed ? 'success' : 'secondary'"
                        text
                        @click="toggleComplete(editingWorkout)" />
            </div>

            <template #footer>
                <Button v-if="editingWorkout.id && workouts.find(w => w.id === editingWorkout.id)" label="Usuń" icon="pi pi-trash" severity="danger" text @click="deleteWorkout(editingWorkout.id)" />
                <Button label="Anuluj" text @click="showWorkoutDialog = false" />
                <Button label="Zapisz" @click="saveWorkout" />
            </template>
        </Dialog>

        <Dialog v-model:visible="showNotesDialog" header="Notatki Tygodniowe" :style="{ width: '400px' }" modal>
            <div class="field">
                 <Textarea v-model="currentNote" class="w-full" rows="5" placeholder="Cele na ten tydzień..." />
            </div>
             <template #footer>
                <Button label="Anuluj" text @click="showNotesDialog = false" />
                <Button label="Zapisz" @click="saveNotes" />
            </template>
        </Dialog>

        <Dialog v-model:visible="showProgramDialog" header="Nowy Kalendarz" :style="{ width: '400px' }" modal>
            <div class="field">
                <label for="pName" class="block mb-2 font-bold">Nazwa Kalendarza</label>
                <InputText id="pName" v-model="newProgramName" class="w-full" autofocus @keyup.enter="saveNewProgram" />
            </div>
            <template #footer>
                <Button label="Anuluj" text @click="showProgramDialog = false" />
                <Button label="Stwórz" @click="saveNewProgram" />
            </template>
        </Dialog>

        <ConfirmPopup />
    </div>
</template>

<style scoped>
/* Custom grid overrides if PrimeFlex grid class issues occur */
.min-h-10rem {
    min-height: 10rem;
}
</style>
