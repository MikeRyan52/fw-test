import 'rxjs/add/operator/switchMapTo';
import { interval } from 'rxjs/observable/interval';
import { App, Component, ActionReducer, view, combineReducers, Effect } from './fw';


const ADD = 'INCREMENT';
const SUBTRACT = 'DECREMENT';
const SET_TIME = 'Set Time';

interface AppState {
  count: number;
  time: number;
}

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

const incrementTimeEffect: Effect<AppState> = (actions$) => actions$
  .ofType(ADD)
  .startWith({ type: ADD })
  .switchMapTo(
    interval(1000)
      .map(increments => ({
        type: SET_TIME,
        payload: increments
      }))
      .startWith({
        type: SET_TIME,
        payload: 0
      })
  );


const Timer = (time: number) => view`
  <span>${time} Seconds since last increment</span>
`

const Counter = (props: { total: number, onAdd: () => void, onSubtract: () => void}) => view`
  <div>
    <span>Current State: ${props.total}</span>
    <button onclick=${props.onSubtract}>Subtract</button>
    <button onclick=${props.onAdd}>Add</button>
  </div>
`;

const CounterApp: Component<AppState> = (state, dispatch) => view`
  <div>
    <h1>My Counter App</h1>

    ${Counter({
      total: state.count,
      onAdd: () => dispatch({ type: ADD }),
      onSubtract: () => dispatch({ type: SUBTRACT })
    })}

    ${Timer(state.time)}
  </div>
`;


App
  .create(reducer)
  .withEffects(incrementTimeEffect)
  .selectElement('my-app')
  .andRender(CounterApp)
  .subscribe();
