import type { Plugin } from 'vite';
import { renderCourse } from './render.ts';
import type { Course } from './types.ts';

/**
 * index.html の目印（<!--course:head--> と <!--course:body-->）を、
 * course.ts から組み立てたHTMLに置き換える Vite プラグイン。
 */
export function coursePlugin(course: Course): Plugin {
  return {
    name: 'course-template',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const page = renderCourse(course);
        return html
          .replace(/<html lang="[^"]*">/, `<html lang="${page.lang}">`)
          .replace('<!--course:head-->', page.head)
          .replace('<!--course:body-->', page.body);
      },
    },
  };
}
