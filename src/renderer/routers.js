import { createRouter, createWebHashHistory} from 'vue-router'

//注册路由
const routes = [
    {
        path: '/',
        name: 'main',
        redirect: '/home',
    },
    {
        path: '/home',
        name: 'home',
        component: () => import('./views/home/index.vue')
    },
    {
        path: '/labelPlatform',
        name: 'labelPlatform',
        component: () => import('./views/LabelPlatform.vue')
    },
    {
        path: '/oneImageInfer',
        name: 'oneImageInfer',
        component: () => import('./views/OneImageInfer.vue')
    }
];
const router = createRouter({
    routes,
    history: createWebHashHistory()
});

export default router;