const SupervisedEmitter = require('../');
const SE = new SupervisedEmitter();

const N = 10000;
bench([
  function unsub_same_topic() {
    const SE = new SupervisedEmitter();

    const subscriptions = [];
    for (let i = 0; i < N; i++) {
      subscriptions.push(SE.subscribe('/hello/world', () => { }));
    }

    subscriptions.forEach(subscription => subscription.unsubscribe());
  },

  function unsub_different_topics() {
    const SE = new SupervisedEmitter();

    const subscriptions = [];
    for (let i = 0; i < N; i++) {
      subscriptions.push(SE.subscribe(`/hello/world/${i}/`, () => { }));
    }

    subscriptions.forEach(subscription => subscription.unsubscribe());
  },

  function chained_unsub_same_topic() {
    const SE = new SupervisedEmitter();

    let subscription = SE.subscribe('/hello/world/', () => { });
    for (let i = 0; i < N; i++) {
      subscription = subscription.subscribe('/hello/world/', () => { });
    }

    subscription.unsubscribe();
  },

  function chained_unsub_different_topics() {
    const SE = new SupervisedEmitter();

    let subscription = SE.subscribe('/hello/world/0', () => { });
    for (let i = 1; i < N / 2; i++) {
      subscription = subscription.subscribe(`/hello/world/${i}`, () => { });
    }

    subscription.unsubscribe();
  },
], {
  runs: 10,
  reporter: require('./reporter'),
});
