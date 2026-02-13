import type { ThemeSidebarMulti } from 'vuepress-theme-plume';

export default {
    '/learn/': [
        {
            text: '葵蕾謠',
            collapsed: false, // VuePress 2.x 中的 `collapsable` 替换为 `collapsed`
            items: [
            '/learn/',  // README.md 对应路径
            '/learn/1.md', 
            '/learn/2.md',
            '/learn/3.md',
            '/learn/5.md',
            ],
        },
    ],
} as ThemeSidebarMulti;
