define('physics', ['settings', 'tiles'], function(settings, tiles) {

    var DELTA_RATIO = 20 / 1000;

    var GRAVITY = 50;
    var MAX_SPEED = 50;

    function entityHitGround(entity, y) {
        if (entity.bounce) {
            entity.velY = -1 * entity.bounce * entity.velY;
        } else {
            entity.velY = 0;
        }
        entity.y = y;
        entity.isInContactWithFloor = true;
        if (entity.jumps) {
            entity.canDoubleJump = false;
            entity.didDoubleJump = false;
            entity.jumpEnergy = settings.jump_energy;
        }
    }

    function downardsHitTesting(entity, level, origY) {
        var index;
        var tile;

        var start = Math.max(entity.x | 0, 0);
        var end = Math.min(Math.ceil(entity.x + entity.width), level.width);

        var crossedOne = Math.floor(entity.y) !== Math.floor(origY);
        var testForHalf = Math.ceil(entity.y) - entity.y > 0.5;

        // Test for solid blocks
        if (crossedOne) {
            for (var x = start; x < end; x++) {
                index = level.getLevelIndex(x, Math.ceil(entity.y));
                tile = level.levView[index];
                if (tiles.SOLID.has(tile) || tiles.CLOUD.has(tile)) {
                    entityHitGround(entity, Math.ceil(entity.y));
                    return;
                }
            }
            if (!testForHalf) {
                entity.isInContactWithFloor = false;
            }
        }
        // Test for half-solid blocks
        if (testForHalf) {
            for (var x = start; x < end; x++) {
                index = level.getLevelIndex(x, Math.ceil(entity.y));
                tile = level.levView[index];
                if (tiles.HALF_SOLID.has(tile)) {
                    if (entity.sitOnChair && (tile === tiles.TILE_CHAIR_LEFT || tile === tiles.TILE_CHAIR_RIGHT)) {
                        entity.sitOnChair();
                    }

                    entityHitGround(entity, Math.ceil(entity.y) - 0.5);
                    return;
                }
            }
            entity.isInContactWithFloor = false;
        }
    }

    function testOnLadder(entity, level) {
        var index;
        var tile;
        for (var y = Math.max(entity.y + 1 | 0, 0);
             y < Math.min(Math.ceil(entity.y + entity.height), level.height - 1);
             y++) {

            index = level.getLevelIndex(entity.x + 0.5 | 0, y, level.width);
            tile = level.levView[index];
            if (tile === tiles.TILE_LADDER) {
                return true;
            }
        }
        return false;
    }

    function testHitUp(entity, level) {
        var index;
        var tile;
        for (var x = Math.max(entity.x | 0, 0);
             x < Math.min(Math.ceil(entity.x + entity.width), level.width - 1);
             x++) {

            index = level.getLevelIndex(x, Math.floor(entity.y) + entity.height + 1, level.width);
            tile = level.levView[index];
            if (tiles.SOLID.has(tile)) {
                return true;
            }
        }
        return false;
    }

    function upwardsHitTesting(entity, level) {
        if (testHitUp(entity, level)) {
            entity.velY = 0;
            entity.y = Math.floor(entity.y) - entity.height + 1;
            entity.jumpEnergy = 0;
            if (entity.headBump) entity.headBump();
        }
    }

    function sideHitTesting(entity, level) {
        var index;
        var tile;
        for (var y = Math.max(entity.y + 1 | 0, 0);
             y < Math.min(Math.ceil(entity.y + entity.height + 1), level.height - 1);
             y++) {

            if (entity.velX < 1) {
                // On left
                index = level.getLevelIndex(Math.ceil(entity.x - 1), y, level.width);
                tile = level.levView[index];
                if (tiles.SOLID.has(tile)) {
                    if (entity.bounce) {
                        entity.velX = -1 * entity.bounce * entity.velX;
                    } else {
                        entity.velX = 0;
                    }
                    entity.x = Math.ceil(entity.x);
                    return;
                }
            } else if (entity.velX > 1) {
                // On right
                index = level.getLevelIndex(Math.floor(entity.x + entity.width), y, level.width);
                tile = level.levView[index];
                if (tiles.SOLID.has(tile)) {
                    if (entity.bounce) {
                        entity.velX = -1 * entity.bounce * entity.velX;
                    } else {
                        entity.velX = 0;
                    }
                    entity.x = Math.floor(entity.x);
                    return;
                }
            }
        }
    }

    function tick(entity, delta, level) {
        var origY = entity.y;

        entity.x += entity.velX * DELTA_RATIO;
        if (entity.velX) {
            sideHitTesting(entity, level);
        }

        entity.y += entity.velY * DELTA_RATIO;
        if (entity.velY < 0) {
            downardsHitTesting(entity, level, origY);
        } else if (entity.velY > 0) {
            upwardsHitTesting(entity, level);
        }

        entity.x = Math.max(entity.x, 0);
        entity.x = Math.min(entity.x, level.width - 1);

        if (entity.velY && entity.isInContactWithFloor) {
            entity.isInContactWithFloor = false;
        }

        entity.velY -= GRAVITY * DELTA_RATIO;
        if (entity.velY > MAX_SPEED) entity.velY = MAX_SPEED;
        else if (-1 * entity.velY > MAX_SPEED) entity.velY = -1 * MAX_SPEED;
    }

    return {
        tick: tick,
        testHitUp: testHitUp,
        testOnLadder: testOnLadder,
    };
});
