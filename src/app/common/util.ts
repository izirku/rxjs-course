import { Observable } from 'rxjs';

export function createHttpObservable(url: string): Observable<any> {
  const http$ = Observable.create(observer => {
    const controller = new AbortController();
    const signal = controller.signal;

    fetch(url, { signal })
      .then(resp => {
        if (resp.ok) {
          return resp.json();
        } else {
          observer.error('request failed with status code: ' + resp.status);
        }
      })
      .then(body => {
        observer.next(body);
        observer.complete();
      })
      .catch(err => {
        observer.error(err);
      });

    // observables return a cancelation function (like react hooks...)
    return () => {
      controller.abort();
    };
  });

  return http$;
}
