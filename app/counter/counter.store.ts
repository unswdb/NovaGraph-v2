import { action, makeObservable, observable } from "mobx";

export default class CounterStore {
  count = 0;

  constructor() {
    makeObservable(this, {
      count: observable,
      increment: action,
    });
  }

  increment() {
    this.count += 1;
  }
}
