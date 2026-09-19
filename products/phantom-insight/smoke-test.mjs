#!/usr/bin/env node
/**
 * Lightweight static smoke tests for the Insight learner experience.
 * Run from products/phantom-insight with: node smoke-test.mjs
 * Uses only Node.js built-ins. This checks source artifacts, not browser behavior.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const failures = [];
const requireText = (text, pattern, label) => {
  if (!pattern.test(text)) failures.push(`Missing expected ${label}.`);
};

let page = '';
let curriculum;
try {
  page = await readFile(path.join(dir, 'learning.html'), 'utf8');
} catch (e) {
  failures.push(`Cannot read learning.html: ${e.message}`);
}
try {
  curriculum = JSON.parse(await readFile(path.join(dir, 'socrates-curriculum.json'), 'utf8'));
} catch (e) {
  failures.push(`Cannot read/parse socrates-curriculum.json: ${e.message}`);
}

if (page) {
  requireText(page, /<main\b[^>]*id="lesson"/i, 'lesson content container');
  requireText(page, /id="courses"/i, 'course navigation container');
  requireText(page, /fetch\(['"]\.\/socrates-curriculum\.json['"]\)/, 'relative curriculum fetch');
  requireText(page, /localStorage\.setItem\(KEY/, 'local progress persistence');
  requireText(page, /Mark complete/, 'lesson completion control');
  requireText(page, /Save response/, 'response-saving control');
  requireText(page, /aria-current/, 'current lesson accessibility state');
  requireText(page, /catch\(err\)/, 'curriculum load error handling');
}
if (curriculum) {
  if (!Array.isArray(curriculum.courses) || !curriculum.courses.length) {
    failures.push('Curriculum must contain at least one course.');
  } else {
    const lessonIds = new Set();
    for (const course of curriculum.courses) {
      if (!Array.isArray(course.lessons)) {
        failures.push(`Course ${course.id ?? '(unknown)'} has no lessons array.`);
        continue;
      }
      for (const lesson of course.lessons) {
        if (!lesson.id || lessonIds.has(lesson.id)) failures.push(`Missing or duplicate lesson id: ${lesson.id ?? '(empty)'}.`);
        lessonIds.add(lesson.id);
        for (const field of ['title', 'objective', 'explanation', 'activity', 'check']) {
          if (typeof lesson[field] !== 'string' || !lesson[field].trim()) {
            failures.push(`Lesson ${lesson.id}: ${field} must be non-empty text.`);
          }
        }
        if (!Array.isArray(lesson.questions) || !lesson.questions.length) {
          failures.push(`Lesson ${lesson.id}: expected at least one Socratic question.`);
        }
      }
    }
    if (!lessonIds.size) failures.push('Curriculum contains no lesson records.');
  }
}

if (failures.length) {
  console.error(`FAIL: ${failures.length} smoke-test issue(s):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log(`PASS: static learner smoke checks passed (${curriculum.courses.length} courses).`);
