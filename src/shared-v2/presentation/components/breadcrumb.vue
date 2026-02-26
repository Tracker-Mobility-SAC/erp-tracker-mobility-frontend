<script setup>
// ===========================
// IMPORTS
// ===========================
// Importación de Vue Router para navegación programática
import { useRouter } from 'vue-router'

// ===========================
// COMPOSABLES
// ===========================
// Inicialización de Vue Router
const router = useRouter()

// ===========================
// PROPS
// ===========================
// Definición de propiedades: items del breadcrumb con validación de estructura
const props = defineProps({
  items: {
    type: Array,
    required: true,
    validator: (value) => {
      return value.every(item => 
        typeof item.title === 'string'
      )
    }
  }
})

// ===========================
// METHODS - NAVIGATION
// ===========================
// Método para manejar navegación: soporta name-based routing y rutas tradicionales
const handleClick = (item) => {
  if (item.name) {
    router.push({ name: item.name, params: item.params || {} })
  } else if (item.to) {
    router.push(item.to)
  }
}
</script>

<template>
  <nav class="pt-0 pb-2" aria-label="breadcrumb">
    <ol class="flex align-items-center list-none p-0 m-0 gap-2">
      <li
        v-for="(item, index) in props.items"
        :key="index"
        class="flex align-items-center gap-2"
      >
        <span
          v-if="index === props.items.length - 1"
          class="breadcrumb-current"
        >
          {{ item.title }}
        </span>
        <span
          v-else
          class="breadcrumb-link"
          @click="handleClick(item)"
        >
          {{ item.title }}
        </span>
        <i
          v-if="index < props.items.length - 1"
          class="pi pi-chevron-right breadcrumb-divider text-xs"
        ></i>
      </li>
    </ol>
  </nav>
</template>
