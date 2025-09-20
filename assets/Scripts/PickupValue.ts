// PickupValue.ts
import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PickupValue')
export class PickupValue extends Component {
    @property(Label) valueLabel: Label = null;
    @property value: number = 1;

    start() {
        if (this.valueLabel) this.valueLabel.string = String(Math.floor(this.value));
    }
}
