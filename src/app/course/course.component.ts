import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Course } from '../model/course';
import {
  debounceTime,
  distinctUntilChanged,
  startWith,
  tap,
  delay,
  map,
  concatMap,
  switchMap,
  withLatestFrom,
  concatAll,
  shareReplay,
  throttle
} from 'rxjs/operators';
import { merge, fromEvent, Observable, concat, interval } from 'rxjs';
import { Lesson } from '../model/lesson';
import { createHttpObservable } from '../common/util';
import { debug, RxJsLoggingLevel, setRxJsLoggingLevel } from '../common/debug';

@Component({
  selector: 'course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.css']
})
export class CourseComponent implements OnInit, AfterViewInit {
  courseId: string;
  course$: Observable<Course>;
  lessons$: Observable<Lesson[]>;

  @ViewChild('searchInput', { static: true }) input: ElementRef;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    setRxJsLoggingLevel(RxJsLoggingLevel.DEBUG);

    this.courseId = this.route.snapshot.params['id'];

    this.course$ = createHttpObservable(`/api/courses/${this.courseId}`).pipe(
      debug(RxJsLoggingLevel.INFO, 'course value')
    );
  }

  ngAfterViewInit() {
    // simplifying, by using startWith():
    this.lessons$ = fromEvent(this.input.nativeElement, 'keyup').pipe(
      map((event: Event) => (<HTMLInputElement>event.target).value),
      // startWith('') will force emit initial stream value with a search
      // term of an empty string, which will effectively fetch all
      // the courses initially before any 'keyup' events would occur
      startWith(''),
      debug(RxJsLoggingLevel.TRACE, 'search'),
      // within 400ms wait for a value to become "stable", i.e.
      // if values are comming in quicker than 400ms, they will never be emitted
      debounceTime(400),
      // with throttle, an initial value of outer observable emitted first, then,
      // throttle takes a fn that returns an observable that when it emmits a value,
      // a value from an outer observable is emmited, otherwise it's dropped
      //   throttle(() => interval(400))
      // same as throttle(() => interval(400))
      //   throttleTime(400),
      distinctUntilChanged(),
      switchMap(search => this.loadLessons(search)),
      debug(RxJsLoggingLevel.DEBUG, 'lessons value')
    );

    // using concat:
    // const initialLessons$ = this.loadLessons();

    // const searchLessons$ = fromEvent(this.input.nativeElement, 'keyup').pipe(
    //   map((event: Event) => (<HTMLInputElement>event.target).value),
    //   debounceTime(400),
    //   distinctUntilChanged(),
    //   switchMap(search => this.loadLessons(search))
    // );

    // this.lessons$ = concat(initialLessons$, searchLessons$);
  }

  loadLessons(search = ''): Observable<Lesson[]> {
    return createHttpObservable(
      `/api/lessons?courseId=${this.courseId}&pageSize=100&filter=${search}`
    ).pipe(map(res => res['payload']));
  }
}
