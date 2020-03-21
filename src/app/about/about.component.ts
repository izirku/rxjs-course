import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {
  concat,
  fromEvent,
  interval,
  noop,
  observable,
  Observable,
  of,
  timer,
  merge,
  Subject,
  BehaviorSubject,
  AsyncSubject,
  ReplaySubject
} from 'rxjs';
import { delayWhen, filter, map, take, timeout } from 'rxjs/operators';
import { createHttpObservable } from '../common/util';

@Component({
  selector: 'about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {
  ngOnInit() {
    // const subject = new Subject();
    // const subject = new BehaviorSubject(0);

    // AsyncSubject is ideal for long running tasks where we only care for the last value:
    // const subject = new AsyncSubject();

    const subject = new ReplaySubject();

    // it's ok to share series1$ with other parts of application, as
    // it doesn't have .next, .error, .complete, etc...
    const series$ = subject.asObservable();

    series$.subscribe(val => console.log('early sub:', val));

    subject.next(1);
    subject.next(2);
    subject.next(3);

    // async subject, if completed here, late sub will still receive 3
    // replay subject, if completed here, late sub will still receive 1,2,3
    // subject.complete();

    setTimeout(() => {
      series$.subscribe(val => console.log('late sub:', val));
      // subject.next(4);
      // async subject, if completed here, both subs will receive 4
      // subject.complete();
    }, 3000);
  }
}
