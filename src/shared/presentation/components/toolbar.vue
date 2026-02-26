<script setup>
import { useRouter } from 'vue-router';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  showBackButton: {
    type: Boolean,
    default: true
  },
  backRoute: {
    type: [String, Object],
    default: null
  }
});

const emit = defineEmits(['back']);

const router = useRouter();

const handleBack = () => {
  if (props.backRoute) {
    // Navegar a una ruta específica
    if (typeof props.backRoute === 'string') {
      router.push({ name: props.backRoute });
    } else {
      router.push(props.backRoute);
    }
  } else {
    // Emitir evento o volver atrás en el historial
    emit('back');
    router.back();
  }
};
</script>

<template>
  <div class="flex align-items-center gap-3 px-4 py-3 border-bottom-1 surface-border toolbar-gradient" style="min-height: 60px;">
    <pv-button
      v-if="showBackButton"
      icon="pi pi-arrow-left"
      class="p-button-text p-button-rounded"
      style="color: white;"
      @click="handleBack"
      aria-label="Volver atrás"
    />
    <div class="flex-1 flex flex-column gap-1">
      <h2 class="m-0 text-white text-2xl font-bold">{{ title }}</h2>
      <p v-if="description" class="m-0 text-white text-sm opacity-90">{{ description }}</p>
    </div>
    <slot name="actions"></slot>
  </div>
</template>
