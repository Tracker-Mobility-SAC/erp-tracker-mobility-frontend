<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthenticationStore } from '../../application/authentication.store.js';
import { SignInRequest } from '../../domain/models/sign-in.request.js';
import { useNotification } from '../../../shared/composables/use-notification.js';

const router = useRouter();
const route  = useRoute();
const store  = useAuthenticationStore();
const { showSuccess, showError, showWarning, showInfo } = useNotification();

// ── Form state ──
const username        = ref('');
const password        = ref('');
const rememberSession = ref(false);
const isLoading       = ref(false);

// ── Actions ──
const onSignIn = async () => {
  if (!username.value || !password.value) {
    showWarning('Por favor, complete todos los campos.', 'Campos requeridos');
    return;
  }

  isLoading.value = true;

  try {
    const request = new SignInRequest(username.value, password.value);
    await store.signIn(request, router);
    showSuccess(`¡Bienvenido de nuevo, ${username.value}!`, 'Inicio de sesión exitoso');
  } catch (error) {
    const msg = error?.message ?? '';
    if (msg.includes('rol') && msg.includes('no tiene permisos')) {
      showError(msg, 'Rol No Autorizado', 7000);
    } else {
      showError(
        'Credenciales incorrectas. Por favor, verifique su usuario y contraseña.',
        'Error de inicio de sesión',
        5000,
      );
    }
  } finally {
    isLoading.value = false;
  }
};

const onForgotPassword = () => {
  showInfo('Funcionalidad en desarrollo.', 'Recuperación de contraseña');
};

// ── Show error toasts coming from query params (guard redirects) ──
onMounted(() => {
  const { error, message } = route.query;

  if (error === 'access-denied') {
    showWarning(message || 'No tienes permisos para acceder a esa sección', 'Acceso Denegado', 5000);
    router.replace({ name: 'sign-in' });
  }

  if (error === 'unauthorized-role') {
    showError(message || 'Su rol no tiene permisos para acceder al sistema', 'Rol No Autorizado', 6000);
    router.replace({ name: 'sign-in' });
  }

  if (error === 'session-expired') {
    showWarning(
      message || 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
      'Sesión Expirada',
      6000,
    );
    router.replace({ name: 'sign-in' });
  }
});
</script>

<template>
  <div
    class="flex h-screen w-screen flex-column align-items-center justify-content-center"
    style="background: var(--color-background);"
  >
    <div class="card flex flex-column w-30rem shadow-6 p-6 border-round-lg">

      <h1 class="font-bold text-center text-primary-dark mb-4">Tracker Mobility</h1>
      <h3 class="text-center font-semibold text-primary-dark mb-2">Acceso al sistema</h3>
      <p class="text-center text-muted mb-4">
        Optimice la verificación domiciliaria con nuestra solución integrada
      </p>

      <form @submit.prevent="onSignIn">
        <div class="p-fluid">

          <!-- Username -->
          <div class="input-group">
            <label for="username" class="form-label form-label-required">Nombre de usuario</label>
            <pv-icon-field>
              <pv-input-icon class="pi pi-user" />
              <pv-input-text
                id="username"
                v-model="username"
                class="w-full"
                autocomplete="username"
                placeholder="Ingrese su nombre de usuario"
                :disabled="isLoading"
              />
            </pv-icon-field>
          </div>

          <!-- Password -->
          <div class="input-group">
            <label for="password" class="form-label form-label-required">Contraseña</label>
            <pv-icon-field>
              <pv-input-icon class="pi pi-lock" />
              <pv-password
                id="password"
                v-model="password"
                class="w-full"
                input-class="w-full"
                autocomplete="current-password"
                :feedback="false"
                toggle-mask
                placeholder="Ingrese su contraseña"
                :disabled="isLoading"
              />
            </pv-icon-field>
          </div>

          <!-- Remember session / Forgot password -->
          <div class="flex justify-content-between align-items-center mb-4">
            <label for="rememberSession" class="flex align-items-center cursor-pointer">
              <pv-checkbox
                inputId="rememberSession"
                v-model="rememberSession"
                binary
                class="mr-2"
              />
              <span class="text-sm text-dark">Recordar sesión</span>
            </label>
            <span
              class="text-sm text-primary-local font-semibold cursor-pointer hover-primary"
              @click="onForgotPassword"
            >
              ¿Olvidó su contraseña?
            </span>
          </div>

          <!-- Submit -->
          <div class="form-actions form-actions-center">
            <pv-button
              type="submit"
              label="Iniciar sesión"
              class="w-full font-semibold btn-primary-dark"
              severity="primary"
              :loading="isLoading"
              :disabled="isLoading"
              icon="pi pi-sign-in"
              icon-pos="left"
            />
          </div>

          <!-- Secure access note -->
          <div class="text-center mt-4 pt-3" style="border-top: 1px solid var(--surface-100);">
            <span class="text-muted helper-text">
              <i class="pi pi-lock mr-1" style="font-size: 0.875rem;" />
              Acceso seguro y encriptado
            </span>
          </div>

        </div>
      </form>
    </div>
  </div>
</template>
