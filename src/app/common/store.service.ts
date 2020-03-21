import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import {
  delayWhen,
  map,
  retryWhen,
  shareReplay,
  tap,
  filter
} from 'rxjs/operators';
import { Course } from '../model/course';
import { createHttpObservable } from './util';
import { fromPromise } from 'rxjs/internal-compatibility';

@Injectable({ providedIn: 'root' })
export class Store {
  private subject = new BehaviorSubject<Course[]>([]);
  courses$: Observable<Course[]> = this.subject.asObservable();

  init() {
    const http$ = createHttpObservable('/api/courses');

    http$
      .pipe(
        tap(() => console.log('HTTP request executed')),
        map(res => Object.values(res['payload'])),
        retryWhen(errors => errors.pipe(delayWhen(() => timer(2000))))
      )
      .subscribe(courses => this.subject.next(courses));
  }

  selectBeginnerCourses() {
    return this.filterByCategory('BEGINNER');
  }

  selectAdvancedCourses() {
    return this.filterByCategory('ADVANCED');
  }

  selectCourseById(courseId: number) {
    return this.courses$.pipe(
      map(courses => courses.find(course => course.id === courseId)),
      filter(course => !!course)
    );
  }

  filterByCategory(category: string) {
    return this.courses$.pipe(
      map(courses => courses.filter(course => course.category === category))
    );
  }

  saveCourse(courseId: number, changes): Observable<any> {
    const courses = this.subject.getValue();
    const courseIndex = courses.findIndex(course => course.id === courseId);

    const newCourses = courses.slice(0);
    newCourses[courseIndex] = {
      ...courses[courseIndex],
      ...changes
    };

    this.subject.next(newCourses);

    return fromPromise(
      fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify(changes),
        headers: {
          'content-type': 'application/json'
        }
      })
    );
  }
}
