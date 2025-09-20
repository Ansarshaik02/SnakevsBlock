// Pickup.ts
import { _decorator, Component } from 'cc';
const { ccclass } = _decorator;

@ccclass('Pickup')
export class Pickup extends Component {
    // pickup logic handled by LevelSpawner (manual collisions),
    // this component simply holds pickup value (PickupValue) and sprite.
}
