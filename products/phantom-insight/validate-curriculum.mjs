#!/usr/bin/env node
/**
 * Phantom Insight curriculum integrity check.
 * Run from this directory with: node validate-curriculum.mjs
 * Uses only Node.js built-ins; exits non-zero when the curriculum is invalid.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(here, 'socrates-curriculum.json');
const errors = [];
const requiredStrings = ['id', 'title', 'objective', 'explanation', 'activity', 'check'];

let data;
try {
  data = JSON.parse(await readFile(file, 'utf8'));
} catch (error) {
  console.error(`FAIL: cannot read/parse socrates-curriculum.json: ${error.message}`);
  process.exit(1);
}

if (!data || typeof data !== 'object') errors.push('Root must be a JSON object.');
if (data.schemaVersion !== '1.0.0') errors.push('schemaVersion must be 1.0.0.');
if (!Array.isArray(data.courses) || data.courses.length === 0) errors.push('courses must be a non-empty array.');
if (!Array.isArray(data.teachingContract?.epistemicLabels) || data.teachingContract.epistemicLabels.length === 0) {
  errors.push('teachingContract.epistemicLabels must be a non-empty array.');
}

const ids = new Set();
let lessonCount = 0;
for (const [courseIndex, course] of (data.courses || []).entries()) {
  if (!course || typeof course !== 'object') {
    errors.push(`Course ${courseIndex + 1} must be an object.`);
    continue;
  }
  if (typeof course.id !== 'string' || !course.id.trim()) errors.push(`Course ${courseIndex + 1} has no id.`);
  if (typeof course.title !== 'string' || !course.title.trim()) errors.push(`Course ${course.id || courseIndex + 1} has no title.`);
  if (!Array.isArray(course.lessons) || course.lessons.length === 0) {
    errors.push(`Course ${course.id || courseIndex + 1} must contain at least one lesson.`);
    continue;
  }
  for (const [lessonIndex, lesson] of course.lessons.entries()) {
    lessonCount++;
    const label = `Lesson ${course.id || courseIndex + 1}/${lessonIndex + 1}`;
    for (const field of requiredStrings) {
      if (typeof lesson?.[field] !== 'string' || !lesson[field].trim()) errors.push(`${label}: ${field} must be a non-empty string.`);
    }
    if (typeof lesson?.id === 'string' && lesson.id.trim()) {
      if (ids.has(lesson.id)) errors.push(`Duplicate lesson id: ${lesson.id}.`);
      ids.add(lesson.id);
    }
    if (!Array.isArray(lesson?.questions) || lesson.questions.length === 0 || lesson.questions.some(q => typeof q !== 'string' || !q.trim())) {
      errors.push(`${label}: questions must contain at least one non-empty string.`);
    }
    if (lesson?.vocabulary !== undefined && (!Array.isArray(lesson.vocabulary) || lesson.vocabulary.some(v => typeof v !== 'string' || !v.trim()))) {
      errors.push(`${label}: vocabulary must be an array of non-empty strings when supplied.`);
    }
  }
}

if (lessonCount === 0) errors.push('Curriculum contains no lessons.');
if (errors.length) {
  console.error(`Curriculum validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}

console.log(`PASS: curriculum structure is valid; ${data.courses.length} courses, ${lessonCount} lessons, ${ids.size} unique lesson IDs.`);
