<script setup>
import { ref, computed } from 'vue';
import SidebarTrackerMobility from '../components/sidebar-tracker-mobility.component.vue';
import { useAuthenticationStore } from '../../../6.security/application/authentication.store.js';

// Store
const authStore = useAuthenticationStore();

// Estado reactivo del sidebar
const sidebarOpen = ref(true);

// Opciones del menú de navegación
const allMenuItems = [
  // Opciones para COMPANY_EMPLOYEE con VENDEDOR (solo solicitudes)
  { 
    roles: ['COMPANY_EMPLOYEE', 'VENDEDOR'], 
    requiresAll: true,
    label: 'Mis Solicitudes', 
    icon: 'pi pi-fw pi-list', 
    to: `/app/applicant-company/order-requests` 
  },
  
  // Opciones para COMPANY_EMPLOYEE con GERENTE_VENTAS
  { 
    roles: ['COMPANY_EMPLOYEE', 'GERENTE_VENTAS'], 
    requiresAll: true,
    label: 'Mis Solicitudes', 
    icon: 'pi pi-fw pi-list', 
    to: `/app/applicant-company/order-requests` 
  },
  { 
    roles: ['COMPANY_EMPLOYEE', 'GERENTE_VENTAS'], 
    requiresAll: true,
    label: 'Equipo de Ventas', 
    icon: 'pi pi-fw pi-users', 
    to: `/app/sales-manager/sales-team` 
  },
  
  // Opciones para ADMIN
  { 
    roles: ['ADMIN'], 
    requiresAll: false,
    label: 'Órdenes', 
    icon: 'pi pi-fw pi-file-edit', 
    to: `/app/admin/verification-orders` 
  },
  { 
    roles: ['ADMIN'], 
    requiresAll: false,
    label: 'Reportes', 
    icon: 'pi pi-fw pi-chart-bar', 
    to: `/app/admin/verification-reports` 
  },
  { 
    roles: ['ADMIN'], 
    requiresAll: false,
    label: 'Verificadores', 
    icon: 'pi pi-fw pi-users', 
    to: `/app/admin/verifiers` 
  },
  { 
    roles: ['ADMIN'], 
    requiresAll: false,
    label: 'Clientes', 
    icon: 'pi pi-fw pi-user', 
    to: `/app/admin/clients` 
  },
];

// Filtrar menú según los roles del usuario
const menuItems = computed(() => {
  const userRoles = authStore.currentRoles || [];
  
  if (userRoles.length === 0) {
    return [];
  }
  
  return allMenuItems.filter(item => {
    if (item.requiresAll) {
      // Requiere TODOS los roles especificados
      return item.roles.every(role => userRoles.includes(role));
    } else {
      // Requiere AL MENOS UNO de los roles especificados
      return item.roles.some(role => userRoles.includes(role));
    }
  });
});

// Manejadores de eventos
const handleSidebarToggle = (isOpen) => {
  sidebarOpen.value = isOpen;
};
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden" style="background-color: var(--color-background);">
    <!-- Sidebar fijo a la izquierda -->
    <SidebarTrackerMobility
      :items="menuItems"
      @sidebar-toggle="handleSidebarToggle"
    />

    <!-- Contenedor principal -->
    <main class="flex-1 overflow-hidden main-content" :class="{ 'content-expanded': !sidebarOpen }" style="background-color: var(--color-background);">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.main-content {
  margin-left: 260px;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content.content-expanded {
  margin-left: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .main-wrapper {
    margin-left: 0 !important;
  }
}
</style>