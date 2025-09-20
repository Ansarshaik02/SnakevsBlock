// HeadDebug.ts
import { _decorator, Component, Collider2D, IPhysics2DContact } from 'cc';
const { ccclass } = _decorator;

@ccclass('HeadDebug')
export class HeadDebug extends Component {
  start() {
    const col = this.getComponent(Collider2D);
    if (col) col.on('onBeginContact', this.onBeginContact, this);
    else console.warn('HeadDebug: no Collider2D on head');
  }

  onBeginContact(self: Collider2D, other: Collider2D, contact: IPhysics2DContact) {
    console.log('HeadDebug: head collided with ->', other.node.name);
  }
}