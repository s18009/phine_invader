//グローバル展開
phina.globalize();
const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 640;
Cookies.set('name', 'value');
const hiscore = Cookies.get('pizzamanz_cookie');
let myscore = 0;
const ASSETS = {
    "image": {
        "buro": "./assets/image/buropiyo.png",
        "mero": "./assets/image/meropiyo.png",
        "mika": "./assets/image/mikapiyo.png",
        "nasu": "./assets/image/nasupiyo.png",
        "take": "./assets/image/takepiyo.png",
        "toma": "./assets/image/tomapiyo.png"
    }
};
const ENEMY_ASSETS = [
    "buro", "mero", "mika", "nasu", "take"
];


phina.define('MainScene', {
    superClass: 'DisplayScene',
    init: function () {
        this.superInit({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        });
        // X/Yそれぞれ40分割したグリッドで置き換え
        this.gridX = Grid(SCREEN_WIDTH, 40);
        this.gridY = Grid(SCREEN_HEIGHT, 40);
        this.backgroundColor = 'black';
        this.time = 0;
        this.interval = 2000;
        this.player = Player(
            this.gridX.center(), this.gridY.span(37)).addChildTo(this);
        this.missileGroup = DisplayElement().addChildTo(this);

        // 複数の敵を登録する対象
        this.enemyGroup = EnemyGroup().addChildTo(this);
        for (let i = 0; i < 3; i++) {
            for (let x = 0; x < 10; x++) {
                this.random = Math.floor(Math.random()*5);
                Enemy(this.gridX.span(x * 3), this.gridY.span(i * 5), 3, ENEMY_ASSETS[this.random]).addChildTo(this.enemyGroup);
            }
        }

        if (hiscore > myscore  || undefined === hiscore) {
            phina.define("ResultScene", {
                superClass: 'ResultScene',
                init: function () {
                    this.superInit({
                        score: myscore,
                        message: "ゲームオーバ",
                        width: SCREEN_WIDTH,
                        height: SCREEN_HEIGHT,
                    });
                    myscore = 0;
                },
            });
        }
    },

    update: function (app) {
        this.time += app.deltaTime;
        // ミサイルと弾の当たり判定
        if (this.player.bullet != null && this.player.parent != null) {
            this.missileGroup.children.some(missile => {
                if (missile.hitTestElement(this.player.bullet)) {
                    missile.flare('hit');
                    this.player.bullet.flare('hit');
                }
            })
        }
        // 弾と敵の当たり判定
        if (this.player.bullet != null) {
            this.enemyGroup.children.some(enemy => {
                if (enemy.hitTestElement(this.player.bullet)) {
                    // 直接それぞれのメソッドを呼ばずにイベントで対応させる。
                    myscore += 150;
                    enemy.flare('hit');
                    this.player.bullet.flare('hit');
                    return true;
                }
            })
        }
        // ミサイルとプレイヤーの当たり判定
        this.missileGroup.children.some(missile => {
            if (missile.hitTestElement(this.player)) {
                missile.flare('hit');
                this.player.flare('hit');
                this.exit();
                return true;
            }
        });

        if (this.enemyGroup.children.length <= 0) {
            if (hiscore < myscore || undefined === hiscore) {
                Cookies.set('pizzamanz_cookie', myscore);
            }
            console.log(myscore);
            console.log(hiscore);
            this.exit();
        }

    },
});

phina.define('Player', {
    superClass: 'Sprite',
    init: function (x, y) {
        this.superInit('toma', 64, 64);
        this.setFrameIndex(10, 64, 64);
        this.x = x;
        this.y = y;
        this.SPEED = 5;
        this.bullet = null;
    },

    update: function (app) {
        const key = app.keyboard;

        if (key.getKey('left')) {
            this.x -= this.SPEED;
            if (this.left < 0) {
                this.left = 0;
            }
        }
        if (key.getKey('right')) {
            this.x += this.SPEED;
            if (this.right > SCREEN_WIDTH) {
                this.right = SCREEN_WIDTH;
            }
        }

        // 弾は同時に1発しか発射できない仕様なので、bulletがnullのときにスペースキー押されていたら発射
        if (this.bullet == null && key.getKey('space')) {
            this.bullet = Bullet(this.x, this.top).addChildTo(this.parent);
        }

        // すでにbulletが無効(isInvalid==true)ならnullにする
        if (this.bullet != null && this.bullet.isInvalid) {
            this.bullet = null;
        }
    },

    onhit: function () {
        this.remove();
    }

});

phina.define('Bullet', {
    superClass: 'RectangleShape',
    init: function (x, y) {
        this.superInit({
            width: 3,
            height: 15,
            fill: 'white',
            stroke: null,
        });
        this.x = x;
        this.y = y;
        this.isInvalid = false;
        this.SPEED = 7;
    },

    // 弾を画面上から消して無効にするイベントリスナ(なにかに当たった)
    onhit: function () {
        this.remove();
        this.isInvalid = true;
    },
    startLabel: 'splash',

    update: function () {
        this.y -= this.SPEED;
        if (this.bottom < 0) {
            this.flare('hit');
        }
    }
});

phina.define('Enemy', {
    superClass: 'Sprite',
    init: function (x, y, Number,image) {
        this.superInit(image, 64, 64);
        this.setFrameIndex(7, 64, 64);
        this.x = x;
        this.y = y;
        this.number = Number;
    },

    // 敵を画面上から消すイベントリスナ(倒された)
    onhit: function () {
        this.remove();
    },

});

phina.define('Missile', {
    superClass: 'PathShape',
    init: function (x, y) {
        this.superInit({
            // ミサイルの見た目(相対パスで指定)
            paths: [
                {x: 0, y: 0},
                {x: 3, y: 2},
                {x: -3, y: 4},
                {x: 3, y: 6},
                {x: -3, y: 8},
                {x: 3, y: 10},
                {x: -3, y: 12},
                {x: 3, y: 14},
                {x: 0, y: 16},
            ],
            fill: null,
            // ミサイルの色
            stroke: 'orangered',
            lineJoin: 'miter',
            // ミサイルの線の太さ
            strokeWidth: 1,
        });
        this.x = x;
        this.y = y;
        this.width = 6;
        this.height = 16;
        // ミサイルの移動速度
        this.SPEED = 5;
    },
    onhit: function () {
        this.remove();
    },

    update: function () {
        this.y += this.SPEED;
        if (this.top > SCREEN_HEIGHT) {
            this.flare('hit');
        }
    }
});

phina.define('EnemyGroup', {
    superClass: 'DisplayElement',
    init: function () {
        this.superInit();
        this.time = 0;
        this.interval = 2000;
        this.direction = 1;
    },

    update: function (app) {
        // deltaTimeを加算していって経過時間を計る
        this.time += app.deltaTime;
        const scene = this.parent;
        let right = 0;
        let left = scene.gridX.columns;

        if (this.time / this.interval >= 1) {
            this.shot();
        }

        if (this.time / this.interval >= 1) {
            this.children.forEach(enemy => {
                enemy.moveBy(scene.gridX.unit() * this.direction, 0);

                // 全体の右端のポジションを計算
                right = Math.max(right, enemy.x / scene.gridX.unit());
                // 全体の左端のポジションを計算
                left = Math.min(left, enemy.x / scene.gridX.unit());
            });
            this.time -= this.interval;
        }

        // 移動の向きを変更するタイミング
        if (this.direction > 0 && right >= 38
            || this.direction < 0 && left <= 2) {
            this.direction = -this.direction
        }
    },

    shot: function () {
        //敵の弾を生成
        var enemyshot = {};
        var enemys = [];
        this.random = Math.floor(Math.random()*this.children.length);
        this.children.forEach(enemy => {
            const position = enemy.position;
            Missile(position.x, position.y).addChildTo(this.parent.missileGroup);
        });
    },
});

phina.main(() => {
    const app = GameApp({
        startLabel: 'splash',
        title: "インベーダー",
        fps: 60,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        assets: ASSETS,
    });

    app.run();
});