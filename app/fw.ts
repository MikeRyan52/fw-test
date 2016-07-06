import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/observeOn';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/merge';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { queue } from 'rxjs/scheduler/queue';
import * as yo from 'yo-yo';

export interface Action {
  type: string;
  payload?: any;
}

export interface ActionReducer<T> {
  (state: T, action: Action): T;
}

export interface Effect<T> {
  (action$: ActionSubject, state$: Observable<T>): Observable<Action>;
}

export interface SmartComponent<T> {
  (state: T, dispatch: Dispatcher): Element;
}

export interface Dispatcher {
  (action: Action): void;
}

export class ActionSubject extends BehaviorSubject<Action> {
  ofType(...types: string[]) {
    return this.filter(action => types.indexOf(action.type) > -1);
  }
}

export const view = yo;

export class App<T> {
  private _effects: Effect<T>[] = [];
  private _selector: string;

  state$: Observable<T>;
  action$: ActionSubject;
  reducer$: BehaviorSubject<ActionReducer<T>>;

  constructor(reducer: ActionReducer<T>) {
    const INITIAL_ACTION: Action = { type: '@@INIT' };
    const INITIAL_STATE: T = reducer(undefined, INITIAL_ACTION);

    this.action$ = new ActionSubject({ type: '@@INIT' });
    this.reducer$ = new BehaviorSubject<ActionReducer<T>>(reducer);
    this.state$ = this.action$
      .observeOn(queue)
      .withLatestFrom(this.reducer$)
      .scan((state, [ action, reducer ]) => reducer(state, action), INITIAL_STATE)
      .startWith(INITIAL_STATE)
      .share();
  }

  static create<T>(reducer: ActionReducer<T>): App<T> {
    return new App(reducer);
  }

  withEffects(...effects: Effect<T>[]) {
    this._effects.push(...effects);

    return this;
  }

  selectParentElement(selector: string) {
    this._selector = selector;

    return this;
  }

  andRender(component: SmartComponent<T>) {
    const dispatch: Dispatcher = (action: Action) => this.action$.next(action);
    const element = document.querySelector(this._selector);
    let rendered = false;

    const render$ = this.state$
      .distinctUntilChanged()
      .map(state => component(state, dispatch))
      .scan((previousElement: Element, nextElement: Element): Element => {
        return yo.update(previousElement, nextElement);
      })
      .do(newElement => {
        if (!rendered) {
          element.appendChild(newElement);
          rendered = true;
        }
      })
      .map<Action>(element => ({ type: 'render', payload: element }));

    const effects$ = Observable.from(this._effects)
      .mergeMap(effect => effect(this.action$, this.state$))
      .do(dispatch)
      .map<Action>(action => ({ type: 'dispatch', payload: action }));


    return Observable.merge(render$, effects$);
  }
}

export function combineReducers(reducers: any): ActionReducer<any> {
  const reducerKeys = Object.keys(reducers);
  const finalReducers = {};

  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i];
    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key];
    }
  }

  const finalReducerKeys = Object.keys(finalReducers);

  return function combination(state = {}, action) {
    let hasChanged = false;
    const nextState = {};
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i];
      const reducer = finalReducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);

      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }
    return hasChanged ? nextState : state;
  };
}


export interface ComposeSignature {
  <A>(): (i: A) => A;
  <A, B>(b: (i: A) => B): (i: A) => B;
  <A, B, C>(c: (i: B) => C, b: (i: A) => B): (i: A) => C;
  <A, B, C, D>(d: (i: C) => D, c: (i: B) => C, b: (i: A) => B): (i: A) => D;
  <A, B, C, D, E>(e: (i: D) => E, d: (i: C) => D, c: (i: B) => C, b: (i: A) => B): (i: A) => E;
  <A, B, C, D, E, F>(f: (i: E) => F, e: (i: D) => E, d: (i: C) => D, c: (i: B) => C, b: (i: A) => B): (i: A) => F;
  (...fns: any[]): (input: any) => any;
}


export const compose: ComposeSignature = (...functions) => {
  return function(arg) {
    if (functions.length === 0) {
      return arg;
    }

    const last = functions[functions.length - 1];
    const rest = functions.slice(0, -1);

    return rest.reduceRight((composed, fn) => fn(composed), last(arg));
  }
}
