// GameManager.ts
import { _decorator, Component, Node, director, Label } from 'cc';
const { ccclass, property } = _decorator;

export enum GameState {
    Menu = 0,
    Ready = 1,
    Playing = 2,
    GameOver = 3,
}

@ccclass('GameManager')
export class GameManager extends Component {
    public static instance: GameManager = null;

    @property(Node) menuPanel: Node = null;             
    @property(Label) scoreLabel: Label = null;          
    @property(Label) finalScoreLabel: Label = null;    
    @property(Node) gameOverPanel: Node = null;
    @property(Node) levelSpawner: Node = null;         
    @property({ type: String }) restartSceneName: string = 'scene-002';

    public state: GameState = GameState.Menu;
    private score: number = 0;

    onLoad() {
        GameManager.instance = this;
        this.state = GameState.Menu;
        this.score = 0;

        if (this.menuPanel) this.menuPanel.active = true;
        if (this.gameOverPanel) this.gameOverPanel.active = false;
        if (this.scoreLabel) this.scoreLabel.node.active = false; // hide score at menu

        this.updateScoreUI();
        console.log('GameManager ready (state = Menu)');
    }

    playGame() {
        // called by Play button in MenuPanel
        if (this.menuPanel) this.menuPanel.active = false;
        if (this.scoreLabel) this.scoreLabel.node.active = true;

        this.state = GameState.Ready;
        console.log('GameManager: state changed to Ready (waiting for first touch)');
    }

    startGame() {
        if (this.state !== GameState.Ready) return;
        this.state = GameState.Playing;
        console.log('GameManager: Game started');
    }

    addScore(amount: number) {
        if (this.state !== GameState.Playing) return;
        this.score += amount;
        this.updateScoreUI();
        console.log(`Score +${amount}, total = ${this.score}`);
    }

    private updateScoreUI() {
        if (this.scoreLabel) {
            this.scoreLabel.string = String(this.score);
        }
    }

    gameOver() {
        if (this.state === GameState.GameOver) return;
        this.state = GameState.GameOver;
        console.log('GameManager: GAME OVER, Final Score =', this.score);

        if (this.scoreLabel) this.scoreLabel.node.active = false;

        // Show Game Over UI
        if (this.gameOverPanel) {
            this.gameOverPanel.active = true;
            if (this.finalScoreLabel) {
                this.finalScoreLabel.string = "Your Score: " + this.score;
            }
        }

        // Stop spawner and clear existing blocks/pickups
        if (this.levelSpawner) {
            const comp: any = this.levelSpawner.getComponent('LevelSpawner');
            if (comp) {
                comp.enabled = false;

                if (comp['spawned'] && Array.isArray(comp['spawned'])) {
                    comp['spawned'].forEach((n: Node) => {
                        if (n && n.isValid) n.destroy();
                    });
                    comp['spawned'] = [];
                }
            }
        }

        // Destroy the snake and its segments
        const canvas = this.node.parent;
        if (canvas) {
            const snakeNode = canvas.getChildByName("snake");
            if (snakeNode) {
                snakeNode.destroy();
            }
        }
    }

    restart() {
    console.log("GameManager: Restarting scene...");
    GameManager.instance = null; 

    if (this.restartSceneName && this.restartSceneName.length > 0) {
        director.loadScene(this.restartSceneName, () => {
           
            const gmNode = director.getScene().getChildByName("Canvas")?.getChildByName("GameManager");
            if (gmNode) {
                const gm = gmNode.getComponent(GameManager);
                if (gm) {
                    gm.playGame(); // skip menu and go straight to Ready
                }
            }
        });
    } else {
        console.warn('GameManager.restart: restartSceneName not set.');
    }
}


    onDestroy() {
        if (GameManager.instance === this) {
            GameManager.instance = null;
        }
    }
}
