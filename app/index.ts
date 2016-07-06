import 'rxjs/add/operator/switchMapTo';
import { interval } from 'rxjs/observable/interval';
import { App, SmartComponent, ActionReducer, view, combineReducers, Effect, compose } from './fw';


/**
 * Actions
 */
const ADD = 'INCREMENT';
const add = () => ({ type: ADD });

const SUBTRACT = 'DECREMENT';
const subtract = () => ({ type: SUBTRACT });

const SET_TIME = 'SET_TIME';
const setTime = (time: number) => ({ type: SET_TIME, payload: time });

/**
 * App state interface
 */
interface AppState {
  count: number;
  time: number;
}

/**
 * Application reducers
 */
const countReducer: ActionReducer<number> = (state = 0, action) => {
  switch (action.type) {
    case ADD:
      return state + 1;
    case SUBTRACT:
      return state - 1;
    default:
      return state;
  }
};

const timeReducer: ActionReducer<number> = (state = 0, action) => {
  switch (action.type) {
    case SET_TIME:
      return action.payload;
    default:
      return state;
  }
}

const reducer: ActionReducer<AppState> = combineReducers({
  count: countReducer,
  time: timeReducer
});


/**
 * Effects
 */
const incrementTimeEffect: Effect<AppState> = (actions$) => actions$
  .ofType(ADD)
  .startWith(add())
  .switchMapTo(
    interval(1000)
      .startWith(0)
      .map(seconds => setTime(seconds))
  );


/**
 * Presentation Components
 */
const TimeComponent = (time: number) => view`
  <ca-time>${time} Seconds since last increment</ca-time>
`

interface CounterComponentProps {
  total: number;
  onAdd?: (...args: any[]) => void;
  onSubtract?: (...args: any[]) => void;
}

const noop = () => { };

const CounterComponent = ({ total, onSubtract, onAdd}: CounterComponentProps) => view`
  <ca-counter>
    <span>Current State: ${total}</span>
    <button onclick=${onSubtract || noop}>Subtract</button>
    <button onclick=${onAdd || noop}>Add</button>
  </ca-counter>
`;

const SectionComponent = (title: string, children: Element) => view`
  <ca-section>
    <h2>${ title }</h2>

    ${children}
  </ca-section>
`;


/**
 * Smart components
 */
const CounterAppComponent: SmartComponent<AppState> = (state, dispatch) => view`
  <counter-app>
    <h1>My Counter App</h1>

    ${SectionComponent('Count', CounterComponent({
      total: state.count,
      onAdd: compose(dispatch, add),
      onSubtract: compose(dispatch, subtract)
    }))}

    ${SectionComponent('Time', TimeComponent(state.time))}
  </counter-app>
`;


/**
 * Starting the app
 */
App.create(reducer)
  .withEffects(incrementTimeEffect)
  .selectParentElement('body')
  .andRender(CounterAppComponent)
  .subscribe();
