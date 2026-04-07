import { Centrifuge } from 'centrifuge';

const CENTRIFUGO_URL = process.env.NEXT_PUBLIC_CENTRIFUGO_URL || 'ws://localhost/connection/websocket';

export function createCentrifuge(): Centrifuge {
    return new Centrifuge(CENTRIFUGO_URL, {});
}
