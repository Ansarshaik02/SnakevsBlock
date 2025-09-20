// LevelSpawner.ts
import { _decorator, Component, Node, Prefab, instantiate, Vec3, UITransform } from 'cc';
import { Block } from './Block';
import { PickupValue } from './PickupValue';
import { Snake } from './snake';
import { GameManager, GameState } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('LevelSpawner')
export class LevelSpawner extends Component {
    @property(Prefab) blockPrefab: Prefab = null;
    @property(Prefab) pickupPrefab: Prefab = null;
    @property(Node) canvasNode: Node = null;   
    @property(Node) headNode: Node = null;     
    @property(Prefab) wallPrefab: Prefab = null;

    @property
    spawnInterval: number = 1.2;

    @property
    downwardSpeed: number = 180;

    private spawnTimer: number = 0;
    private spawned: Node[] = [];
    private topY = 600;
    private bottomY = -600;

    start() {
        if (this.canvasNode) {
            const ui = this.canvasNode.getComponent(UITransform);
            if (ui) {
                this.topY = ui.height / 2 + 120;
                this.bottomY = -ui.height / 2 - 200;
            }
        }
        this.spawnTimer = 0;
    }

    update(dt: number) {
        
        if (!GameManager.instance || GameManager.instance.state !== GameState.Playing) return;

        // spawn new rows
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnRow();
        }

        // move existing objects down
        for (let i = this.spawned.length - 1; i >= 0; i--) {
            const n = this.spawned[i];
            n.translate(new Vec3(0, -this.downwardSpeed * dt, 0));

            if (this.headNode) {
                this.checkCollisionWithHead(n);
            }

            // destroy if below bottom
            if (n.worldPosition.y < this.bottomY) {
                n.destroy();
                this.spawned.splice(i, 1);
            }
        }
    }

    spawnRow() {
    if (!this.canvasNode) return;

    const lanes = 5;
    const ui = this.canvasNode.getComponent(UITransform);
    const canvasWidth = ui ? ui.width : 720;
    const laneSpacing = Math.min(canvasWidth / (lanes + 1), 160);
    const startX = -(laneSpacing * (lanes - 1)) / 2;

    
    const row: number[] = [];

    for (let i = 0; i < lanes; i++) {
        const rand = Math.random();
        if (rand < 0.5 && this.blockPrefab) {
            // block
            const block = instantiate(this.blockPrefab);
            block.setParent(this.canvasNode);

            const blockValue = Math.floor(Math.random() * 15) + 1;
            const blockComp = block.getComponent(Block);
            if (blockComp) {
                blockComp.blockValue = blockValue;
                if (blockComp.label) blockComp.label.string = blockValue.toString();
            }

            block.setPosition(new Vec3(startX + i * laneSpacing, this.topY, 0));
            this.spawned.push(block);
            row[i] = 1;

        } else if (rand < 0.65 && this.pickupPrefab) {
            // pickup
            const pickup = instantiate(this.pickupPrefab);
            pickup.setParent(this.canvasNode);

            const pVal = Math.floor(Math.random() * 5) + 1;
            const pv = pickup.getComponent(PickupValue);
            if (pv) {
                pv.value = pVal;
                if (pv.valueLabel) pv.valueLabel.string = pVal.toString();
            }

            pickup.setPosition(new Vec3(startX + i * laneSpacing, this.topY, 0));
            this.spawned.push(pickup);
            row[i] = 2;

        } else {
            row[i] = 0; // empty
        }
    }

    // Place walls in empty gaps between blocks
    if (this.wallPrefab) {
        for (let i = 0; i < lanes; i++) {
            if (row[i] === 0) {
                const leftBlock = (i > 0 && row[i - 1] === 1);
                const rightBlock = (i < lanes - 1 && row[i + 1] === 1);

                if (leftBlock && rightBlock) {
                    // gap closed by walls
                    const wall = instantiate(this.wallPrefab);
                    wall.setParent(this.canvasNode);
                    wall.setPosition(new Vec3(startX + i * laneSpacing, this.topY, 0));
                    this.spawned.push(wall);
                }
            }
        }
    }
}


    private checkCollisionWithHead(node: Node) {
        if (!this.headNode) return;

        const headWorld = this.headNode.worldPosition;
        const objWorld = node.worldPosition;
        const dx = headWorld.x - objWorld.x;
        const dy = headWorld.y - objWorld.y;
        const distSq = dx * dx + dy * dy;

        let headRadius = 24;
        try {
            const headCircle: any = this.headNode.getComponent && this.headNode.getComponent('cc.CircleCollider2D');
            if (headCircle && headCircle.radius) headRadius = headCircle.radius;
        } catch {}

       
        const pv = node.getComponent(PickupValue);
        if (pv) {
            const pickRadius = 16;
            const threshold = (headRadius + pickRadius) * (headRadius + pickRadius);
            if (distSq <= threshold) {
                const snake = this.findSnake();
                if (snake) {
                    const value = Math.max(1, Math.floor((pv as any).value));
                    console.log('Pickup collected:', value);
                    snake.addSegments(value);
                }
                this.removeSpawned(node);
            }
            return;
        }

       
        const block = node.getComponent(Block);
        if (block) {
            let blockHalf = 28;
            try {
                const ui: any = node.getComponent(UITransform);
                if (ui && ui.contentSize) blockHalf = Math.max(ui.contentSize.width, ui.contentSize.height) / 2;
            } catch {}
            const threshold = (headRadius + blockHalf) * (headRadius + blockHalf);
            if (distSq <= threshold) {
                const snake = this.findSnake();
                if (snake) {
                    // Keep logic inside Block if you have a handler
                    if (typeof (block as any).onHitBySnake === 'function') {
                        (block as any).onHitBySnake(snake);
                    } else {
                        // fallback behavior if no handler
                        const val = Math.floor((block as any).blockValue || 0);
                        if (val > snake.segments.length) {
                            GameManager.instance && GameManager.instance.gameOver();
                        } else {
                            snake.decreaseLength(val);
                            GameManager.instance && GameManager.instance.addScore(val);
                        }
                    }
                }
                this.removeSpawned(node);
            }
            return;
        }

        
        const isWall = (node.getComponent && node.getComponent('Wall')) || (node.name && node.name.toLowerCase().indexOf('wall') >= 0);
        if (isWall) {
            // use bounding-box overlap for wall
            let halfW = 10;
            let halfH = 40;
            try {
                const ui: any = node.getComponent(UITransform);
                if (ui && ui.contentSize) {
                    halfW = ui.contentSize.width / 2;
                    halfH = ui.contentSize.height / 2;
                }
            } catch {}

            // overlap test (box vs circle approx)
            const overlapX = Math.abs(dx) <= (halfW + headRadius);
            const overlapY = Math.abs(dy) <= (halfH + headRadius);

            if (overlapX && overlapY) {
                // collision with wall: push head to nearest safe side and stop crossing.
                // compute safe world X (left or right of wall)
                let safeXWorld: number;
                if (headWorld.x < objWorld.x) {
                    // head is left -> place to left side
                    safeXWorld = objWorld.x - (halfW + headRadius + 6);
                } else {
                    // head is right -> place to right side
                    safeXWorld = objWorld.x + (halfW + headRadius + 6);
                }

                
                this.headNode.setWorldPosition(new Vec3(safeXWorld, headWorld.y, headWorld.z));

               
                const snake = this.findSnake();
                if (snake) {
                    // convert safe world X to canvas-local X used by snake.targetX:
                    if (this.canvasNode) {
                        const canvasWorld = this.canvasNode.worldPosition;
                        const safeLocalX = safeXWorld - canvasWorld.x;
                        try { (snake as any).targetX = safeLocalX; } catch {}
                        // prime snake positions buffer to avoid segment tearing
                        try {
                            const posBuf = (snake as any).positions;
                            if (Array.isArray(posBuf)) {
                                for (let i = 0; i < 8; i++) posBuf.unshift(this.headNode.worldPosition.clone());
                                // limit buffer
                                if (posBuf.length > 2000) posBuf.length = 2000;
                            }
                        } catch {}
                    }
                }
            }

            return;
        }

        
    }

    private removeSpawned(node: Node) {
        node.destroy();
        const idx = this.spawned.indexOf(node);
        if (idx >= 0) this.spawned.splice(idx, 1);
    }

    private findSnake(): Snake | null {
        if (!this.headNode) return null;
        let s = this.headNode.getComponent(Snake);
        if (s) return s;
        if (this.headNode.parent) {
            s = this.headNode.parent.getComponent(Snake);
            if (s) return s;
        }
        return null;
    }
}
