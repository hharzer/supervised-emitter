"use strict";
/* tslint:disable no-unused-expression */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const delay_1 = __importDefault(require("delay"));
const src_1 = __importDefault(require("../src"));
describe('#supervised-emitter (SE)', () => {
    beforeEach(() => src_1.default.reset());
    it(`should include the following in the context(ctx) to the pipelines:
      - data
      - pubEvent (published event)
      - subEvents (matching subscribers events)
      - end() (to stop the flow of data in the pipeline)`, () => __awaiter(void 0, void 0, void 0, function* () {
        let calls = 0;
        function testCtx(ctx) {
            const { data, pubEvent, subEvents, end, } = ctx;
            calls++;
            chai_1.expect(data).to.be.eql('test');
            chai_1.expect(pubEvent).to.be.eql('hello/se/world');
            chai_1.expect(subEvents).to.have.members(['hello/se/world', 'hello/*/world']);
            chai_1.expect(end).to.be.a('function');
            return data;
        }
        src_1.default.initialize([testCtx]);
        src_1.default
            .subscribe('/hello/se/world', testCtx)
            .subscribe('/hello/*/world', testCtx);
        src_1.default.publish('/hello/se/world', 'test');
        yield delay_1.default(10);
        chai_1.expect(calls).to.be.eql(3);
    }));
    it('should support publish and subscribe even w/o initialization', () => __awaiter(void 0, void 0, void 0, function* () {
        let calls = 0;
        src_1.default.subscribe('foo/bar', () => calls++);
        yield src_1.default.publish('/foo/bar/', 'hello');
        chai_1.expect(calls).to.be.eql(1);
    }));
    it('should ignore leading and trailing seperators (/)', () => __awaiter(void 0, void 0, void 0, function* () {
        let calls = 0;
        src_1.default.subscribe('foo/bar', () => calls++);
        yield src_1.default.publish('/foo/bar/', 'hello');
        chai_1.expect(calls).to.be.eql(1);
    }));
    it('must not consider empty parts in the event', () => __awaiter(void 0, void 0, void 0, function* () {
        let calls = 0;
        src_1.default.subscribe('foo//bar', () => calls++);
        yield src_1.default.publish('/foo/bar/', 'hello');
        chai_1.expect(calls).to.be.eql(1);
    }));
    describe('.initialize()', () => {
        it('should be a singleton', () => {
            src_1.default.initialize();
            chai_1.expect(() => src_1.default.initialize()).to.throw('Can\'t initialize singleton => "SupervisedEmitter", more than once');
        });
        it('should support w/o async middlewares', () => __awaiter(void 0, void 0, void 0, function* () {
            let calls = 0;
            src_1.default.initialize([
                ({ data, pubEvent }) => __awaiter(void 0, void 0, void 0, function* () {
                    calls++;
                    chai_1.expect(pubEvent).to.be.eql('foo/bar');
                    yield delay_1.default(10);
                    return data + 10;
                }),
                ({ data, pubEvent }) => __awaiter(void 0, void 0, void 0, function* () {
                    calls++;
                    chai_1.expect(pubEvent).to.be.eql('foo/bar');
                    chai_1.expect(data).to.be.eql(10);
                    yield delay_1.default(10);
                    return data + 5;
                }),
                ({ data, pubEvent }) => {
                    calls++;
                    chai_1.expect(pubEvent).to.be.eql('foo/bar');
                    chai_1.expect(data).to.be.eql(15);
                    return data + 100;
                },
            ]);
            src_1.default.subscribe('/foo/bar', ({ data }) => {
                calls++;
                chai_1.expect(data).to.be.eql(115);
            });
            src_1.default.publish('/foo/bar', 0);
            yield delay_1.default(50);
            chai_1.expect(calls).to.be.eql(4);
        }));
        it('should allow middlewares to stop / block the flow of events in the system', () => __awaiter(void 0, void 0, void 0, function* () {
            let calls = 0;
            src_1.default.initialize([
                ({ data, pubEvent }) => __awaiter(void 0, void 0, void 0, function* () {
                    calls++;
                    chai_1.expect(data).to.be.eql(0);
                    chai_1.expect(pubEvent).to.be.eql('test');
                    yield delay_1.default(10);
                    return 1;
                }),
                ({ data, pubEvent, end }) => __awaiter(void 0, void 0, void 0, function* () {
                    calls++;
                    chai_1.expect(pubEvent).to.be.eql('test');
                    chai_1.expect(data).to.be.eql(1);
                    yield delay_1.default(10);
                    return end(2);
                }),
                ({ data, pubEvent }) => {
                    calls++;
                    chai_1.expect(pubEvent).to.be.eql('test');
                    chai_1.expect(data).to.be.eql(2);
                    return 3;
                },
            ]);
            src_1.default.subscribe('test', ({ data }) => {
                calls++;
                chai_1.expect(data).to.be.eql(2);
            });
            src_1.default.publish('test', 0);
            yield delay_1.default(50);
            chai_1.expect(calls).to.be.eql(3);
        }));
    });
    describe('.subscribe()', () => {
        it('should be able to subscribe to events / topics', done => {
            const test = 'testing';
            src_1.default.subscribe('foo/', ({ data }) => {
                chai_1.expect(data).to.be.eql(test);
                done();
            });
            src_1.default.publish('/foo/', test);
        });
        it('should pipe handlers when more than one handler is present', done => {
            const test = 0;
            src_1.default.subscribe('/foo/bar', ({ data }) => {
                chai_1.expect(data).to.be.eql(test);
                return data + 1;
            }, ({ data }) => {
                chai_1.expect(data).to.be.eql(test + 1);
                done();
            });
            src_1.default.publish('/foo/bar', test);
        });
        it('should be able to publish / subscribe to topics with glob patterns', () => __awaiter(void 0, void 0, void 0, function* () {
            const test = 'testing';
            let calls = 0;
            let subscription = src_1.default.subscribe('foo/**', ({ data }) => {
                calls++;
                chai_1.expect(data).to.be.eql(test);
            });
            src_1.default.publish('foo/bar', test);
            yield delay_1.default(10);
            chai_1.expect(calls).to.be.eql(1);
            subscription.unsubscribe();
            subscription = src_1.default.subscribe('hello/*/world', ({ data }) => {
                calls++;
                chai_1.expect(data).to.be.eql(test);
            });
            src_1.default.publish('hello/my/world', test);
            yield delay_1.default(10);
            chai_1.expect(calls).to.be.eql(2);
        }));
        it('should support async subscribers and the piped handlers must be executed in the sequence of pipe', () => __awaiter(void 0, void 0, void 0, function* () {
            const orderOfExecution = [];
            const test = 0;
            src_1.default.subscribe('/foo/bar', ({ data }) => __awaiter(void 0, void 0, void 0, function* () {
                orderOfExecution.push(0);
                yield delay_1.default(10);
                chai_1.expect(data).to.be.eql(0);
                return data + 1;
            }), ({ data }) => {
                orderOfExecution.push(1);
                chai_1.expect(data).to.be.eql(1);
                return data + 1;
            }, ({ data }) => {
                orderOfExecution.push(2);
                chai_1.expect(data).to.be.eql(2);
            });
            src_1.default.publish('/foo/bar', test);
            yield delay_1.default(50);
            orderOfExecution.forEach((item, i) => {
                chai_1.expect(item).to.be.eql(i);
            });
        }));
        it('must not affect the ctx in other pipelines if changed in one pipline', () => __awaiter(void 0, void 0, void 0, function* () {
            const test = 0;
            let calls = 0;
            let processing = 0;
            src_1.default.subscribe('/foo/bar', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
                calls++;
                chai_1.expect(processing).to.be.eql(0);
                processing++;
                chai_1.expect(ctx.data).to.be.eql(test);
                ctx.data += 10;
                yield delay_1.default(20);
                processing--;
                return ctx.data;
            }), ({ data }) => {
                calls++;
                processing++;
                chai_1.expect(data).to.be.eql(test + 10);
                processing--;
            });
            src_1.default.subscribe('/foo/bar', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
                calls++;
                chai_1.expect(processing).to.be.eql(1);
                processing++;
                yield delay_1.default(10);
                chai_1.expect(ctx.data).to.be.eql(test);
                processing--;
                chai_1.expect(processing).to.be.eql(1);
            }));
            src_1.default.publish('/foo/bar', test);
            yield delay_1.default(50);
            chai_1.expect(calls).to.be.eql(3);
        }));
        it('should allow modifications for ctx to be passed through the pipeline', () => __awaiter(void 0, void 0, void 0, function* () {
            const test = 'testing';
            let calls = 0;
            src_1.default.subscribe('/foo/bar', ctx => {
                calls++;
                ctx.newProp = 'newProp';
                return ctx.data;
            }, ({ data, newProp }) => {
                calls++;
                chai_1.expect(newProp).to.be.eql('newProp');
                chai_1.expect(data).to.be.eql(test);
            });
            src_1.default.publish('/foo/bar', test);
            yield delay_1.default(10);
            chai_1.expect(calls).to.be.eql(2);
        }));
        it('should allow chaining multiple subscriptions and return an unsubscribe object that unsubsribes from all the chained subscriptions', () => __awaiter(void 0, void 0, void 0, function* () {
            let calls = 0;
            const subscription = src_1.default.subscribe('/another/world', ({ data }) => {
                calls++;
                chai_1.expect(data).to.be.eql('ping');
            })
                .subscribe('/hello/world', ({ data }) => {
                calls++;
                chai_1.expect(data).to.be.eql('hello-world');
            })
                .subscribe('/cat/*/rat', ({ data }) => {
                calls++;
                chai_1.expect(data).to.be.eql('glob');
            });
            src_1.default.publish('another/world', 'ping');
            src_1.default.publish('/hello/world', 'hello-world');
            src_1.default.publish('/cat/bat/rat', 'glob');
            yield delay_1.default(10);
            chai_1.expect(calls).to.be.eql(3);
            subscription.unsubscribe();
            calls = 0;
            src_1.default.publish('another/world', 'ping');
            src_1.default.publish('/hello/world', 'hello-world');
            src_1.default.publish('/cat/bat/rat', 'glob');
            yield delay_1.default(10);
            chai_1.expect(calls).to.be.eql(0);
        }));
        it('should allow any handler to stop the flow of data in the pipeline', () => __awaiter(void 0, void 0, void 0, function* () {
            let calls = 0;
            let completed = false;
            src_1.default
                .subscribe('/hello/world', ({ data }) => __awaiter(void 0, void 0, void 0, function* () {
                calls++;
                chai_1.expect(data).to.be.eql(0);
                yield delay_1.default(10);
                return 1;
            }), ({ data, end }) => __awaiter(void 0, void 0, void 0, function* () {
                calls++;
                chai_1.expect(data).to.be.eql(1);
                yield delay_1.default(10);
                src_1.default.publish('completed', 2);
                return end(2);
            }), ({ data }) => {
                calls++;
                chai_1.expect(data).to.be.eql(2);
                return 3;
            })
                .subscribe('completed', ({ data }) => {
                chai_1.expect(data).to.be.eql(2);
                completed = true;
            });
            src_1.default.publish('/hello/world', 0);
            yield delay_1.default(50);
            chai_1.expect(completed).to.be.true;
            chai_1.expect(calls).to.be.eql(2);
        }));
    });
    describe('.publish()', () => {
        it('should be able to publish data to subscribers', done => {
            const test = 'testing';
            let receivedDataCount = 0;
            src_1.default.subscribe('foo/bar', ({ data }) => {
                receivedDataCount++;
                chai_1.expect(data).to.be.eql(test);
                if (receivedDataCount === 2)
                    done();
            });
            src_1.default.subscribe('foo/bar', ({ data }) => {
                receivedDataCount++;
                chai_1.expect(data).to.be.eql(test);
                if (receivedDataCount === 2)
                    done();
            });
            src_1.default.publish('foo/bar', test);
        });
        it('should allow to publish an event when one is already being processed', () => __awaiter(void 0, void 0, void 0, function* () {
            const test = 'testing';
            let processing = 0;
            src_1.default.subscribe('test1', ({ data }) => __awaiter(void 0, void 0, void 0, function* () {
                processing++;
                yield delay_1.default(50);
                chai_1.expect(data).to.be.eql(test);
                processing--;
            }));
            src_1.default.subscribe('test2', ({ data }) => __awaiter(void 0, void 0, void 0, function* () {
                processing++;
                yield delay_1.default(50);
                chai_1.expect(data).to.be.eql(test);
                processing--;
            }));
            src_1.default.publish('test1', test);
            yield delay_1.default(10);
            chai_1.expect(processing).to.be.eql(1);
            src_1.default.publish('test2', test);
            yield delay_1.default(10);
            chai_1.expect(processing).to.be.eql(2);
            yield delay_1.default(100);
            chai_1.expect(processing).to.be.eql(0);
        }));
        it('should publish events to normal event subscribers after a publish event has already occured', () => __awaiter(void 0, void 0, void 0, function* () {
            let calls = 0;
            src_1.default.subscribe('/hello/*/world', ({ data }) => {
                calls++;
                chai_1.expect(data).to.be.eql('test');
            });
            src_1.default.publish('/hello/se/world', 'test');
            yield delay_1.default(10);
            chai_1.expect(calls).to.be.eql(1);
            calls = 0;
            src_1.default.subscribe('/hello/se/world', () => {
                calls++;
            });
            src_1.default.publish('/hello/se/world', 'test');
            yield delay_1.default(10);
            chai_1.expect(calls).to.be.eql(2);
        }));
        it('should publish events to pattern event after a publish event has already occured', () => __awaiter(void 0, void 0, void 0, function* () {
            let calls = 0;
            src_1.default.subscribe('/hello/se/world', () => {
                calls++;
            });
            src_1.default.publish('/hello/se/world', 'test');
            yield delay_1.default(10);
            chai_1.expect(calls).to.be.eql(1);
            calls = 0;
            src_1.default.subscribe('/hello/*/world', ({ data }) => {
                calls++;
                chai_1.expect(data).to.be.eql('test');
            });
            src_1.default.publish('/hello/se/world', 'test');
            yield delay_1.default(10);
            chai_1.expect(calls).to.be.eql(2);
        }));
        it('should be possible to await on publish events', () => __awaiter(void 0, void 0, void 0, function* () {
            let calls = 0;
            src_1.default.initialize([
                ({ data }) => __awaiter(void 0, void 0, void 0, function* () {
                    yield delay_1.default(10);
                    calls++;
                    chai_1.expect(data).to.be.eql('test');
                    return data;
                }),
            ]);
            src_1.default.subscribe('/hello/se/world', ({ data }) => __awaiter(void 0, void 0, void 0, function* () {
                yield delay_1.default(10);
                calls++;
                chai_1.expect(data).to.be.eql('test');
                return data;
            }), ({ data }) => __awaiter(void 0, void 0, void 0, function* () {
                yield delay_1.default(10);
                calls++;
                chai_1.expect(data).to.be.eql('test');
            }));
            src_1.default.subscribe('/hello/*/world', ({ data }) => __awaiter(void 0, void 0, void 0, function* () {
                yield delay_1.default(10);
                calls++;
                chai_1.expect(data).to.be.eql('test');
                return data;
            }), ({ data }) => __awaiter(void 0, void 0, void 0, function* () {
                yield delay_1.default(10);
                calls++;
                chai_1.expect(data).to.be.eql('test');
            }));
            yield src_1.default.publish('/hello/se/world', 'test');
            chai_1.expect(calls).to.be.eql(5);
        }));
        it('should gracefully handle errors in publish pipeline', () => __awaiter(void 0, void 0, void 0, function* () {
            let calls = 0;
            src_1.default.subscribe('foo/bar', ({ data }) => {
                calls++;
                return data;
            }, () => {
                calls++;
                throw new Error('Failed');
            });
            src_1.default.subscribe('foo/bar', ({ data }) => {
                calls++;
                return data;
            }, () => __awaiter(void 0, void 0, void 0, function* () {
                calls++;
                yield delay_1.default(10);
                throw new Error('failed');
            }));
            yield src_1.default.publish('foo/bar', 'test');
            chai_1.expect(calls).to.be.eql(4);
        }));
    });
    describe('.unsubscribe()', () => {
        it('should be able to unsubscribe from topics', () => __awaiter(void 0, void 0, void 0, function* () {
            const test = 'testing';
            let calls = 0;
            const subscription = src_1.default.subscribe('foo/bar', ({ data }) => {
                calls++;
                chai_1.expect(data).to.be.eql(test);
            });
            src_1.default.publish('foo/bar', test);
            yield delay_1.default(10);
            subscription.unsubscribe();
            src_1.default.publish('foo/bar', test);
            yield delay_1.default(10);
            chai_1.expect(calls).to.be.eql(1);
        }));
        it('should allow subscription to be unsubscribed multiple times', () => __awaiter(void 0, void 0, void 0, function* () {
            const subscription = src_1.default.subscribe('/hello/se/world', () => { });
            subscription.unsubscribe();
            chai_1.expect(() => subscription.unsubscribe()).to.not.throw;
        }));
    });
    describe('.scope()', () => {
        it('should be able to emit scoped events', () => __awaiter(void 0, void 0, void 0, function* () {
            let calls = 0;
            src_1.default.subscribe('/hello/world', () => {
                chai_1.expect(false).to.be.true;
            });
            const scope = src_1.default.getScope();
            src_1.default.subscribe(scope('/hello/world'), ({ data }) => {
                calls++;
                chai_1.expect(data).to.be.eql('testing');
            });
            src_1.default.publish(scope('/hello/world'), 'testing');
            yield delay_1.default(10);
            chai_1.expect(calls).to.be.eql(1);
        }));
    });
    describe('.unScope()', () => {
        it('should match the topic when unscoped', () => {
            const scope = src_1.default.getScope();
            const topic = '/hello/world';
            const scopedTopic = scope('/hello/world');
            chai_1.expect(src_1.default.unScope(scopedTopic)).to.be.eql(topic);
            chai_1.expect(src_1.default.unScope(topic)).to.be.eql(topic);
        });
    });
});
//# sourceMappingURL=supervisedEmitter.js.map