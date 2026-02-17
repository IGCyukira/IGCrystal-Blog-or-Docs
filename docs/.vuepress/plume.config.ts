import { defineThemeConfig } from 'vuepress-theme-plume';
import navbar from './navbar';
import sidebar from './sidebar';

export default defineThemeConfig({
    logo: '/favicon.jpg',
    collections: [
        {
            type: 'post',
            dir: 'blog',
            title: '博客',
            postCover: {
                layout: 'right',
                ratio: '16:9',
                width: 300,
                compact: true
            },
            autoFrontmatter: {
                title: true,
                createTime: true,
                permalink: true,
            },
            profile: {
                avatar: '/favicon.jpg',
                name: 'IGCrystal',
                description: '路很长，梦还在',
                circle: true,
                location: 'Revaea Land',
                layout: 'right',
            },
        },
    ],

    profile: {
        avatar: '/favicon.jpg',
        name: 'IGCrystal Blog',
        description: '兰花草，梅花桩',
    },

    social: [
        { icon: 'github', link: 'https://github.com/IGCrystal' },
        { icon: 'bilibili', link: 'https://space.bilibili.com/523637242' },
        { icon: 'steam', link: 'https://steamcommunity.com/id/IGCrystal' },
        { icon: 'zhihu', link: 'https://www.zhihu.com/people/14-91-60-81' },
        { icon: 'bluesky', link: 'https://bsky.app/profile/igcrystal.icu' },
        { icon: 'telegram', link: 'https://t.me/IGCyukira' },
        { icon: 'youtube', link: 'https://www.youtube.com/@%E8%89%BD%E8%89%BD%E5%8F%AA' },
        { icon: 'xbox', link: 'https://www.xbox.com/zh-cn/play/user/Tenirs606' },
        { icon: 'x', link:'https://x.com/Cedar2352'},
    ],

    navbar,
    sidebar,

    footer: {
        message: `
            Palimpsested by
                <span style="
                    font-size: 16px;
                    display: inline-block;
                    background: linear-gradient(to right, #4facfe, #00f2fe, #f77062, #fe5196);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    transition: background-position 0.5s ease-in-out;
                    background-size: 400%; /* 扩大背景尺寸 */
                    background-position: 0% 50%; /* 初始位置 */
                " 
                onmouseover="this.style.backgroundPosition='100% 50%';" 
                onmouseout="this.style.backgroundPosition='0% 50%';">
                    Ice Glycoside Crystal
                </span>
        `,
        copyright: `
            <span style="
                display: inline-flex; 
                align-items: center; 
                justify-content: center;
                gap: 8px;">
                <a aria-label="Homepage" title="IGCrystal" href="https://blog.IGCrystal.icu" style="display: inline-flex;">
                    <img src="/favicon.jpg" width="20" height="20" />
                </a>
                <span>© 2024 - present 
                    <span style="
                        font-size: 16px;
                        display: inline-block;
                        background: linear-gradient(to right, #4facfe, #00f2fe, #f77062, #fe5196);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        transition: background-position 0.5s ease-in-out;
                        background-size: 400%; /* 扩大背景尺寸 */
                        background-position: 0% 50%; /* 初始位置 */
                    " 
                    onmouseover="this.style.backgroundPosition='100% 50%';" 
                    onmouseout="this.style.backgroundPosition='0% 50%';">
                        冰苷晶 IGCyukira
                    </span>
                </span>
            </span>
        `,
    },
});
