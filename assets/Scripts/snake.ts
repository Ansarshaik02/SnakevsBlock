// snake.ts
import { _decorator, Component, Node, Prefab, instantiate, Vec3, input, Input, Label, UITransform } from 'cc';
import { GameManager, GameState } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('Snake')
export class Snake extends Component {
    @property(Node) head: Node = null;
    @property(Prefab) segmentPrefab: Prefab = null;
    @property(Label) lengthLabel: Label = null;
    @property(Node) canvasNode: Node = null;

    public segments: Node[] = [];
    private positions: Vec3[] = [];
    private spacing: number = 36;
    private targetPos: Vec3 = new Vec3(0, 0, 0);  
    private headSmooth: number = 12;              

    private _localPlaying = false;

    start() {
        this.segments = [];
        if (!this.head) {
            console.warn('Snake: head not assigned!');
            return;
        }

        // start head a bit above bottom
        let startY = -220;
        if (this.canvasNode) {
            const ui = this.canvasNode.getComponent(UITransform);
            if (ui) startY = -ui.height / 2 + 120;
        }
        this.head.setPosition(new Vec3(0, startY, 0));
        this.targetPos.set(0, startY, 0); //  initial target = start pos

        this.segments.push(this.head);

        // prime history with head position so trailing is smooth
        for (let i = 0; i < 300; i++) this.positions.push(this.head.worldPosition.clone());

        this.updateLengthLabel();

        // touch/mouse input
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
    }

    update(dt: number) {
        if (!GameManager.instance || GameManager.instance.state !== GameState.Playing) return;

        // Smoothly move head toward target (X & Y)
        const pos = this.head.position.clone();
        pos.x += (this.targetPos.x - pos.x) * Math.min(1, this.headSmooth * dt);
        pos.y += (this.targetPos.y - pos.y) * Math.min(1, this.headSmooth * dt);
        this.head.setPosition(pos);

        // record head world position
        this.positions.unshift(this.head.worldPosition.clone());
        if (this.positions.length > 2000) this.positions.pop();

        // update body segments
        for (let i = 1; i < this.segments.length; i++) {
            const desiredDistance = this.spacing * i;
            const samplePos = this.getPositionAtDistance(desiredDistance);
            if (samplePos) {
                this.segments[i].setWorldPosition(samplePos);
            }
        }

        this.updateLengthLabel();
    }

    addSegments(amount: number) {
        if (!this.segmentPrefab) {
            console.warn('segmentPrefab not assigned');
            return;
        }

        for (let i = 0; i < amount; i++) {
            const s = instantiate(this.segmentPrefab);
            this.node.addChild(s);

            const last = this.segments[this.segments.length - 1];
            const tailPos = last.worldPosition.clone();
            s.setWorldPosition(tailPos);

            this.segments.push(s);

            for (let j = 0; j < 30; j++) {
                this.positions.push(tailPos.clone());
            }
        }

        this.updateLengthLabel();
    }

    decreaseLength(amount: number) {
        for (let i = 0; i < amount; i++) {
            if (this.segments.length > 1) {
                const seg = this.segments.pop();
                seg.destroy();
            } else {
                if (GameManager.instance) GameManager.instance.gameOver();
                else this._localPlaying = false;
                break;
            }
        }
        this.updateLengthLabel();
    }

    updateLengthLabel() {
        if (this.lengthLabel) {
            this.lengthLabel.string = String(this.segments.length);
        }
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
    }

    // Convert screen input to local canvas target
    private updateTargetFromScreen(screenX: number, screenY: number) {
        if (!this.canvasNode) return;

        const ui = this.canvasNode.getComponent(UITransform);
        if (!ui) return;

        const halfW = ui.width / 2;
        const halfH = ui.height / 2;

        const localX = screenX - halfW;
        const localY = screenY - halfH;

        this.targetPos.set(localX, localY, 0);
    }

    onTouchMove(event: any) {
        if (GameManager.instance && GameManager.instance.state === GameState.Ready) {
            GameManager.instance.startGame();
        } else if (!GameManager.instance) {
            this._localPlaying = true;
        }

        const loc = event.getUILocation();
        this.updateTargetFromScreen(loc.x, loc.y);
    }

    onMouseMove(event: any) {
        const loc = event.getUILocation();
        this.updateTargetFromScreen(loc.x, loc.y);
    }

    // --- helper to get smoothed trailing positions ---
    private getPositionAtDistance(distance: number): Vec3 | null {
        if (this.positions.length < 2) return null;

        let accumulated = 0;
        for (let i = 0; i < this.positions.length - 1; i++) {
            const a = this.positions[i];
            const b = this.positions[i + 1];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const segLen = Math.sqrt(dx * dx + dy * dy);

            if (accumulated + segLen >= distance) {
                const remain = distance - accumulated;
                const t = remain / segLen;
                const x = a.x + (b.x - a.x) * t;
                const y = a.y + (b.y - a.y) * t;
                return new Vec3(x, y, 0);
            }
            accumulated += segLen;
        }
        return this.positions[this.positions.length - 1].clone();
    }
}
