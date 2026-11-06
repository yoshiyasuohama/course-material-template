import { defineConfig } from 'vite';
import course from './course/course.ts';
import { coursePlugin } from './template/plugin.ts';

export default defineConfig({
  // 相対パスで出力し、サブパスでも動くようにする
  base: './',
  build: { target: 'es2022' },
  plugins: [coursePlugin(course)],
});
