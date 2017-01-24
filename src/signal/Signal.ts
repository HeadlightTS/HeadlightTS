import { BASE_TYPES } from '../baseTypes';
import { ISignalLike, TSignalHandler, TEventGroup } from './interface.d';
import { Receiver } from '../receiver/Receiver';


export class Signal<T> {
    private _eventStorage: Map<Receiver, Array<TEventGroup<T>>> = new Map();


    public dispatch(data: T): void {
        this._eventStorage.forEach((groups, receiver) => {
            groups.forEach((eventGroup, index) => {
                eventGroup.handler.call(receiver, data);

                if (eventGroup.once) {
                    this.off({
                        handler: eventGroup.handler,
                        receiver: receiver
                    });
                }
            });
        });
    }

    public on(handler: TSignalHandler<T>, receiver: Receiver): void {
        const group = this._getEventGroups(receiver);

        group.push({
            handler: handler,
            once: false
        });
    }

    public once(handler: TSignalHandler<T>, receiver: Receiver): void {
        const group = this._getEventGroups(receiver);

        group.push({
            handler: handler,
            once: true
        });
    }

    public off(options: {
        handler?: TSignalHandler<T>,
        receiver?: Receiver
    } = {}): void {
        if (!options.handler && !options.receiver) {
            this._resetEventStorage();    
        }

        if (options.receiver) {
            if (!options.handler) {
                this._eventStorage.delete(options.receiver);
                
                return;
            }

            const groups = this._eventStorage.get(options.receiver);

            if (!Array.isArray(groups)) {
                return;
            }

            if (Signal._removeEventGroupByHandler(groups, options.handler)) {
                options.receiver.stopReceiving({
                    signal: this
                });
            }
        } else {
            this._eventStorage.forEach((groups, receiver) => {
                if (Signal._removeEventGroupByHandler(groups, options.handler)) {
                    receiver.stopReceiving({
                        signal: this
                    });
                }
            });
        }
    }

    public hasReceiver(receiver: Receiver): boolean {
        return this._eventStorage.has(receiver);
    }

    private _resetEventStorage(): void {
        this._eventStorage.forEach((eventGroups, receiver) => {
            receiver.stopReceiving({
                signal: this
            });
        });

        this._eventStorage.clear();
    }


    private _getEventGroups(receiver: Receiver): Array<TEventGroup<T>> {
        if (!this._eventStorage.has(receiver)) {
            this._eventStorage.set(receiver, []);
        }

        return this._eventStorage.get(receiver);
    }

    private static _removeEventGroupByHandler<T>(groups: Array<TEventGroup<T>>, handler: TSignalHandler<T>): boolean {
        for (let i = groups.length; i--; ) {
            if (groups[i].handler === handler) {
                groups.splice(i, 1);
            }
        }

        return !groups.length;
    }
}

