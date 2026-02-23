<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthenticationStore } from '../../application/authentication.store.js';

const router = useRouter();
const store  = useAuthenticationStore();

const isSignedIn     = computed(() => store.isSignedIn);
const currentUsername = computed(() => store.currentUsername);

const onSignIn  = () => router.push({ name: 'sign-in' });
const onSignOut = () => store.signOut(router);
</script>

<template>
  <div class="flex align-items-center gap-3">
    <template v-if="isSignedIn">
      <span class="text-sm text-dark font-medium">Bienvenido, {{ currentUsername }}</span>
      <pv-button
        text
        severity="secondary"
        icon="pi pi-sign-out"
        label="Cerrar Sesión"
        @click="onSignOut"
      />
    </template>
    <template v-else>
      <pv-button
        text
        severity="primary"
        class="btn-primary-dark"
        icon="pi pi-sign-in"
        label="Iniciar Sesión"
        @click="onSignIn"
      />
    </template>
  </div>
</template>
