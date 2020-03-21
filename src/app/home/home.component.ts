import { Component, OnInit } from '@angular/core';
import { Course } from '../model/course';
import { interval, Observable, of, timer, noop, throwError } from 'rxjs';
import {
  catchError,
  delayWhen,
  map,
  retryWhen,
  shareReplay,
  tap,
  finalize
} from 'rxjs/operators';
import { createHttpObservable } from '../common/util';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  beginnerCourses$: Observable<Course[]>;
  advancedCourses$: Observable<Course[]>;

  constructor() {}

  ngOnInit() {
    const http$ = createHttpObservable('/api/courses');

    const courses$: Observable<Course[]> = http$.pipe(
      // best to handle errors as soon as possible in pipe to avoid executing logic in pipe
      // if all possible

      // also, if shareReplay is involved, to avoid running error handler twice,
      // make sure that error handler comes before shareReplay

      // catch and rethrow:
      // catchError(err => {
      //   console.log('error occured:', err);
      //   return throwError(err);
      // }),
      // finalize can be executed one (if before shareReplay), twice (if after shareReplay)
      // clean up logic goes into finalize (runs both, in case of complete and error)
      // finalize(() => {
      //   console.log('finalize was executed');
      // }),
      tap(res => {
        console.log('[tap]', res);
      }),
      map(res => Object.values<Course>(res['payload'])),
      shareReplay(),
      // retries immediatelly:
      // retryWhen(errors => errors)
      // retry after 2 seconds AFTER EACH error via delayWhen
      // (note: delay() delays entire stream, where delayWhen delays each value emitted by the stream)
      retryWhen(
        errors => errors.pipe(delayWhen(() => timer(2000)))
        // provide a replacement observable if outer observable fails
        // catchError(err =>
        //   of([
        //     {
        //       id: 0,
        //       description: 'RxJs In Practice Course',
        //       iconUrl:
        //         'https://s3-us-west-1.amazonaws.com/angular-university/course-images/rxjs-in-practice-course.png',
        //       courseListIcon:
        //         'https://angular-academy.s3.amazonaws.com/main-logo/main-page-logo-small-hat.png',
        //       longDescription:
        //         'Understand the RxJs Observable pattern, learn the RxJs Operators via practical examples',
        //       category: 'BEGINNER',
        //       lessonsCount: 10
        //     }
        //   ])
      )
    );

    this.beginnerCourses$ = courses$.pipe(
      map(courses => courses.filter(course => course.category === 'BEGINNER'))
    );

    this.advancedCourses$ = courses$.pipe(
      map(courses => courses.filter(course => course.category === 'ADVANCED'))
    );
  }
}
