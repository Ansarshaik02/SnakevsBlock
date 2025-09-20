// Block.ts
import { _decorator, Component, Label, Node } from 'cc';
import { GameManager } from './GameManager';
import { Snake } from './snake';
const { ccclass, property } = _decorator;

@ccclass('Block')
export class Block extends Component {
    @property(Label) label: Label = null;
    @property blockValue: number = 5;

    start() {
        if (this.label) {
            this.label.string = String(Math.floor(this.blockValue));
        }
    }

    // Called manually by LevelSpawner when checking collisions
    onHitBySnake(snake: Snake) {
        console.log(`Block hit: value=${this.blockValue}, snake length=${snake.segments.length}`);

        if (this.blockValue > snake.segments.length - 1) {
            GameManager.instance.gameOver();
            return;
        }

        // shrink snake & increase score
        snake.decreaseLength(this.blockValue);
        GameManager.instance.addScore(this.blockValue);

        // remove block
        this.node.destroy();
    }
}
