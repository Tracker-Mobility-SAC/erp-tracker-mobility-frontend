import {createRouter, createWebHistory} from "vue-router";
import LayoutTrackerMobilityComponent from "../public/presentation/views/layout-tracker-mobility.component.vue";
import SignInComponent from "../6.security/presentation/views/sign-in.vue";
import {authenticationGuard} from "../6.security/application/authentication.guard.js";

// Importar rutas de módulos con nueva arquitectura (Bounded Contexts)
import { verifierRoutes } from "../3.verifiers-accounts/presentation/verifier.routes.js";
import { customerRoutes } from "../4.customer-management/presentation/customer.routes.js";
import { verificationOrderRoutes } from "../1.verification-orders/presentation/verification-order.routes.js";
import { verificationReportRoutes } from "../2.home-verification-reports/presentation/verification-report.routes.js";
import { orderRequestRoutes } from "../0.verification-order-requests/presentation/order-request.routes.js";
import { salesTeamRoutes } from "../5.sales-team/presentation/sales-team.routes.js";



const router = createRouter({
    history: createWebHistory(),
    routes: [
        // Ruta de inicio de sesión como primera ruta
        {path: '/sign-in' , name: 'sign-in', component: SignInComponent, meta: { title:'Login'}},

        // Redirección de la raíz al sign-in
        {
            path: '/',
            redirect: '/sign-in'
        },

        // =====================================================================================

        {
            path: '/app',
            component: LayoutTrackerMobilityComponent,
            meta: {
                title: 'Tracker Mobility',
                roles: ['ADMIN', 'MASTER_ADMIN', 'COMPANY_EMPLOYEE', 'GERENTE_VENTAS'] // Todos los roles autorizados
            },
            children: [

                // Ruta por defecto al entrar en /app (redirige según el rol del usuario)
                {
                    path: '',
                    name: 'home',
                    redirect: (to) => {
                        // Obtener el rol específico del usuario desde localStorage
                        const specificRole = localStorage.getItem('role');
                        
                        // Redirigir según el rol específico
                        if (specificRole === 'GERENTE_VENTAS') {
                            return { name: 'sales-team-list' };
                        }
                        
                        if (specificRole === 'VENDEDOR' || specificRole === 'COMPANY_EMPLOYEE') {
                            return { name: 'order-requests-list' };
                        }
                        
                        // ADMIN y otros roles van a verification-orders
                        return { name: 'verification-orders-list' };
                    }
                },

                // ============== Rutas de ADMIN ==============
                //========================================================

                // Órdenes de Verificación (nueva arquitectura - Bounded Context: 1.verification-orders)
                {
                    path: 'admin/verification-orders',
                    name: 'verification-orders-module',
                    children: verificationOrderRoutes,
                    meta: {
                        title: 'Órdenes de Verificación',
                        roles: ['ADMIN', 'MASTER_ADMIN']
                    }
                },

                // Verificadores (nueva arquitectura - Bounded Context: 3.verifiers-accounts)
                {
                    path: 'admin/verifiers',
                    name: 'verifiers-module',
                    children: verifierRoutes,
                    meta: {
                        title: 'Gestión de Verificadores',
                        roles: ['ADMIN', 'MASTER_ADMIN']
                    }
                },

                // Clientes (nueva arquitectura - Bounded Context: 4.customer-management)
                {
                    path: 'admin/clients',
                    name: 'clients-module',
                    children: customerRoutes,
                    meta: {
                        title: 'Gestión de Clientes',
                        roles: ['ADMIN', 'MASTER_ADMIN']
                    }
                },

                // Reportes de verificación (nueva arquitectura - Bounded Context: 2.home-verification-reports)
                {
                    path: 'admin/verification-reports',
                    name: 'verification-reports-module',
                    children: verificationReportRoutes,
                    meta: {
                        title: 'Reportes de Verificación',
                        roles: ['ADMIN', 'MASTER_ADMIN']
                    }
                },

                //========================================================


                // ============== Rutas de GERENTE_VENTAS ==============
                //========================================================

                // Equipo de Ventas (nueva arquitectura - Bounded Context: 5.sales-team)
                {
                    path: 'sales-manager/sales-team',
                    name: 'sales-team-module',
                    children: salesTeamRoutes,
                    meta: {
                        title: 'Equipo de Ventas',
                        roles: ['GERENTE_VENTAS']
                    }
                },

                //========================================================


                // ============== Rutas de COMPANY_EMPLOYEE ==============
                //========================================================

                // Solicitudes de Orden (nueva arquitectura - Bounded Context: 0.verification-order-requests)
                {
                    path: 'applicant-company/order-requests',
                    name: 'order-requests-module',
                    children: orderRequestRoutes,
                    meta: {
                        title: 'Solicitudes de Orden',
                        roles: ['COMPANY_EMPLOYEE']
                    }
                }

                //========================================================

            ]

        },



        // Ruta catch-all DEBE estar al final para no interceptar otras rutas
        {path: '/:pathMatch(.*)*', redirect: '/sign-in'}

    ]
});


// Añadir el guardia de autenticación a las rutas protegidas del enrutador Vue Router
router.beforeEach(authenticationGuard);

// Cambiar el título del documento según la meta-etiqueta 'title' de la ruta
router.beforeEach((to, from, next) => {
    let baseTitle = 'Tracker Mobility';
    document.title = `${baseTitle} | ${to.meta['title']}`;
    next();
})

// =========================================================================
// MANEJO DE ERRORES DE CHUNKS (Lazy Loading)
// =========================================================================
// Detecta cuando un chunk falla al cargar (por deploy durante uso activo)
// y recarga la página automáticamente para obtener los chunks nuevos
router.onError((error, to) => {
    const chunkFailedMessage = /Loading chunk [\d]+ failed|Failed to fetch dynamically imported module/;
    
    if (chunkFailedMessage.test(error.message)) {
        console.warn('🔄 [ROUTER] Chunk loading failed - Nueva versión detectada, recargando aplicación...');
        console.warn('   Ruta destino:', to.fullPath);
        console.warn('   Error:', error.message);
        
        // Guardar ruta destino para restaurar después del reload
        sessionStorage.setItem('routeBeforeReload', to.fullPath);
        
        // Recargar página con la ruta destino (fuerza descarga de chunks nuevos)
        // Esto resuelve automáticamente el problema sin que el usuario vea error
        window.location.href = to.fullPath;
    } else {
        // Otros errores del router se propagan normalmente
        console.error('❌ [ROUTER] Error:', error);
    }
});




export default router;