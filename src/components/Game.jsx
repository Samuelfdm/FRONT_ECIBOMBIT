import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import Phaser from "phaser";
import { charactersList } from '../constants/character';

const PhaserGame = ({ board, players, socket, playerId, gameId, enabled  }) => {
  const gameRef = useRef(null);
  const isDeadRef = useRef(false);
  const isGameOverRef = useRef(false);
  const hasActiveBomb = useRef(false);
  const navigate = useNavigate();
  let positionX = null;
  let positionY = null;

  useEffect(() => {
    if (!board || !players || !playerId || !socket) {
      console.warn("Missing required props:", { board, players, playerId, socket });
      return;
    }
    const keysPressed = { left: false, right: false, up: false, down: false };

    const handleKeyDown = (event) => {
      if (isDeadRef.current || isGameOverRef.current) return;
      switch (event.key) {
        case "ArrowLeft":
          keysPressed.left = true;
          break;
        case "ArrowRight":
          keysPressed.right = true;
          break;
        case "ArrowUp":
          keysPressed.up = true;
          break;
        case "ArrowDown":
          keysPressed.down = true;
          break;
        case " ":
          placeBomb();
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (event) => {
      if (isDeadRef.current || isGameOverRef.current) return;
      switch (event.key) {
        case "ArrowLeft":
          keysPressed.left = false;
          break;
        case "ArrowRight":
          keysPressed.right = false;
          break;
        case "ArrowUp":
          keysPressed.up = false;
          break;
        case "ArrowDown":
          keysPressed.down = false;
          break;
        default:
          break;
      }
    };

    const maxWidth = window.innerWidth * 0.95;
    const maxHeight = window.innerHeight * 0.95;
    const tileSize = Math.min(maxWidth / board.columns, maxHeight / board.rows);
    const tileMargin = 2.1; // Añade un margen entre las celdas
    const config = {
      type: Phaser.AUTO,
      width: board.columns * (tileSize + tileMargin),
      height: board.rows * (tileSize + tileMargin),
      parent: "phaser-container",
      pixelArt: false,
      transparent: true,
      antialias: true,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },
      audio: {
        noAudio: true,
      },
      scene: {
        preload,
        create,
        update,
      },
      scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      fps: 120,
    };
    let playerSprites = {};
    let wallsGroup;
    let blocksGroup;
    let currentPlayer;

    // Función para eliminar un jugador (sprite) de la escena
    function eliminatePlayerSprite(victimId) {
      if (!playerSprites[victimId]) return;

      const sprite = playerSprites[victimId];
      sprite.destroy();
      delete playerSprites[victimId];

      if (victimId === playerId) {
        // Si soy yo quien murió
        currentPlayer = null;
        isDeadRef.current = true;
      }
    }

    function preload() {
      players.forEach((player) => {
        const characterData = charactersList.find(
            (character) => character.id === player.character
        );
        if (characterData) {
          this.load.image(player.character, characterData.emoji);
        } else {
          console.warn(`No image found for character ID: ${player.character}`);
        }
      });
      this.load.image("wall", "/assets/luna.webp");
      this.load.image("block", "/assets/naveEspacial.png");
    }

    function create() {
      const background = this.add.graphics();
      background.fillStyle(0xb08cfe, 0.5);
      background.fillRoundedRect(
          0,
          0,
          board.columns * (tileSize + tileMargin),
          board.rows * (tileSize + tileMargin),
          12
      );

      wallsGroup = this.physics.add.staticGroup();
      blocksGroup = this.physics.add.staticGroup();

      board.cells.forEach((cell) => {
        const x = cell.x * (tileSize + tileMargin);
        const y = cell.y * (tileSize + tileMargin);

        if (cell.type === "WALL") {
          const wall = wallsGroup.create(x + tileSize / 2, y + tileSize / 2, "wall");
          wall.setDisplaySize(tileSize, tileSize);
          wall.refreshBody();
        } else if (cell.type === "BLOCK") {
          const block = blocksGroup.create(x + tileSize / 2, y + tileSize / 2, "block");
          block.setDisplaySize(tileSize, tileSize);
          block.refreshBody();
        }
      });

      players.forEach((player) => {
        const cell = board.cells.find((c) => c.playerId === player.id);
        if (!cell) return;

        const x = cell.x * (tileSize + tileMargin) + tileSize / 2;
        const y = cell.y * (tileSize + tileMargin) + tileSize / 2;
        const sprite = this.physics.add
            .sprite(x, y, player.character)
            .setDisplaySize(tileSize, tileSize)
            .setBounce(0)
            .setCollideWorldBounds(true)
            .setDrag(0.95)
            .setMaxVelocity(100);

        playerSprites[player.id] = sprite;

        if (player.id === playerId) {
          currentPlayer = sprite;
          positionX = currentPlayer.x;
          positionY = currentPlayer.y;
        }
      });

      const otherPlayers = Object.values(playerSprites).filter((sprite) => sprite !== currentPlayer);

      this.physics.add.collider(currentPlayer, wallsGroup, () => {
      });

      this.physics.add.collider(currentPlayer, blocksGroup, () => {
      });

      this.physics.add.overlap(currentPlayer, otherPlayers, () => {
      });

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

      //Actualizacion de los movimientos de otros jugadores
      socket.on("playerMoved", ({ playerId, x, y, direction }) => {
        const jugadorRemoto = playerSprites[playerId];
        if (jugadorRemoto) {
          const pixelX = x * (tileSize + tileMargin) + tileSize / 2;
          const pixelY = y * (tileSize + tileMargin) + tileSize / 2;
          jugadorRemoto.setPosition(pixelX, pixelY);
        }
      });
    }

    function update() {
      if (!currentPlayer || isGameOverRef.current || isDeadRef.current) return;

      const speed = 150;
      currentPlayer.setVelocity(0);

      let direction = null;

      if (keysPressed.left) {
        currentPlayer.setVelocityX(-speed);
        currentPlayer.setVelocityY(0);
        direction = "left";
      } else if (keysPressed.right) {
        currentPlayer.setVelocityX(speed);
        currentPlayer.setVelocityY(0);
        direction = "right";
      } else if (keysPressed.up) {
        currentPlayer.setVelocityY(-speed);
        currentPlayer.setVelocityX(0);
        direction = "up";
      } else if (keysPressed.down) {
        currentPlayer.setVelocityY(speed);
        currentPlayer.setVelocityX(0);
        direction = "down";
      }

      const afterCellX = Math.floor(currentPlayer.x / (tileSize + tileMargin));
      const afterCellY = Math.floor(currentPlayer.y / (tileSize + tileMargin));

      const beforeCellX = Math.floor(positionX / (tileSize + tileMargin));
      const beforeCellY = Math.floor(positionY / (tileSize + tileMargin));

      positionX = currentPlayer.x;
      positionY = currentPlayer.y;

      socket.emit("move", {
        direction,
        playerId,
        //para eliminar al jugador de su posicion actual del tablero
        xa: beforeCellX,
        ya: beforeCellY,
        //coordenadas nuevas para moverlo
        x: afterCellX,
        y: afterCellY,
        gameId,
      });

    }

    const placeBomb = () => {
      if (!currentPlayer || !gameRef.current?.scene || hasActiveBomb.current) return;
      const scene = gameRef.current.scene.keys.default;
      const cellX = Math.floor(currentPlayer.x / (tileSize + tileMargin));
      const cellY = Math.floor(currentPlayer.y / (tileSize + tileMargin));
      drawBomb(cellX, cellY); // Muestra la bomba localmente
      socket.emit("bombPlaced", { playerId, x: cellX, y: cellY, gameId });
      hasActiveBomb.current = true;
      const explosionTiles = [
        { x: cellX, y: cellY },
        { x: cellX - 1, y: cellY },
        { x: cellX + 1, y: cellY },
        { x: cellX, y: cellY - 1 },
        { x: cellX, y: cellY + 1 },
      ];

      scene.time.delayedCall(2000, () => {

      socket.emit("bombExploded", {
          playerId,
          explosionTiles,
          gameId,
      });
        handleExplosion(explosionTiles,true);
        hasActiveBomb.current = false;
      });
    };

    function showGameMessage(scene, text) {
      const message = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY, text, {
        fontSize: '32px',
        fill: '#fff',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: { x: 20, y: 10 },
        align: 'center'
      }).setOrigin(0.5);
    
      // Desaparece luego de 5 segundos
      scene.time.delayedCall(5000, () => {
        message.destroy();
      });
    }

    //Muestra el comportamiento de la bomba para el jugador que no lanzo la bomba
    const handleExplosion = (explosionTiles, isBombExploit) => {
      const scene = gameRef.current.scene.keys.default;
      explosionTiles.forEach(({ x, y }) => {
        const px = x * (tileSize + tileMargin) + tileSize / 2;
        const py = y * (tileSize + tileMargin) + tileSize / 2;

        // Destruir bloques si hay
        const block = blocksGroup.getChildren().find((b) =>
            Math.abs(b.x - px) < tileSize / 2 && Math.abs(b.y - py) < tileSize / 2
        );

        if (block) {
          block.destroy();
          board.cells = board.cells.map(cell =>
              cell.x === x && cell.y === y && cell.type === "BLOCK"
                  ? { ...cell, type: "EMPTY" }
                  : cell
          );
        }

        // Verificar colisiones con jugadores
        Object.entries(playerSprites).forEach(([id, sprite]) => {
          if (
              Math.abs(sprite.x - px) < tileSize / 2 &&
              Math.abs(sprite.y - py) < tileSize / 2
          ) {
            eliminatePlayerSprite(id);
            if (isBombExploit) {
              socket.emit("playerKilled", { gameId, killerId: playerId, victimId: id, playerId, x, y } );
            }
          }
        });

        // Mostrar explosión
        const explosion = scene.add.rectangle(px, py, tileSize, tileSize, 0xff0000, 0.5);
        scene.time.delayedCall(300, () => explosion.destroy());

      });
    };

    const drawBomb = (x, y) => {
      const scene = gameRef.current.scene.keys.default;
      const px = x * (tileSize + tileMargin) + tileSize / 2;
      const py = y * (tileSize + tileMargin) + tileSize / 2;
      const bomb = scene.add.circle(px, py, tileSize / 2 - 4, 0x000000);
      scene.time.delayedCall(2000, () => bomb.destroy()); // Se destruye cuando explota
    };

    socket.on("bombPlaced", ({ x, y }) => {
      drawBomb(x, y);
    });

    socket.on("bombExplodedClient", ({ explosionTiles }) => {
      handleExplosion(explosionTiles, false);
    });

    socket.on("playerLeft", ({ playerId }) => {
      eliminatePlayerSprite(playerId);
    });

    socket.on('playerDied', ({ victimId, killerId, victimUsername, killerUsername, suicide }) => {
      const scene = gameRef.current.scene.keys.default;
      if (playerId === victimId) {
        if (suicide) {
          showGameMessage(scene, `💀 Te has suicidado`);
        } else {
          showGameMessage(scene, `💀 Fuiste eliminado por ${killerUsername}`);
        }
      }
    });
    
    socket.on('gameOver', ({winnerUsernames, reason }) => {
        console.log(winnerUsernames);
        isGameOverRef.current = true;
        if (currentPlayer) {
          currentPlayer.setVelocity(0, 0);
          currentPlayer.body.enable = false; 
          currentPlayer.body.moves = false;
          currentPlayer.active = false; // 
        }
    });

    if (gameRef.current) {
      gameRef.current.destroy(true);
    }

    gameRef.current = new Phaser.Game(config);

    const resizeGame = () => {
      const canvas = document.querySelector("#phaser-container canvas");
      const parent = document.querySelector("#phaser-container");
      if (canvas && parent) {
        const scaleX = parent.clientWidth / canvas.width;
        const scaleY = parent.clientHeight / canvas.height;
        const scale = Math.min(scaleX, scaleY);
        canvas.style.transform = `scale(${scale})`;
        canvas.style.transformOrigin = "top left";
      }
    };
    resizeGame();
    window.addEventListener("resize", resizeGame);

    return () => {
      window.removeEventListener("resize", resizeGame);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      socket.off("playerMoved");
      socket.off("bombPlaced");
      socket.off("bombExplodedClient");
      socket.off("playerLeft");
      socket.off("playerKilled");
      socket.off("playerDied");
      gameRef.current.destroy(true);
    };
  }, [board, players, socket, playerId, gameId]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (socket && gameId && playerId) {
        const cell = board.cells.find(c => c.playerId === playerId);
        const x = cell?.x ?? 0;
        const y = cell?.y ?? 0;
        socket.emit("leaveGame", { gameId, playerId, x, y });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [socket, gameId, playerId, board]);

  const handleLeaveGame = () => {
    if (!socket || !gameId || !playerId) return;

    const cell = board.cells.find(c => c.playerId === playerId);
    const x = cell?.x ?? 0;
    const y = cell?.y ?? 0;

    socket.emit("leaveGame", { gameId, playerId, x, y }, () => {
      navigate("/options");
    });
  };

  return (
      <div
          id="phaser-container"
          style={{width: "65vw", height: "95vh", overflow: "hidden", position: "relative"}}
      >
        <button
            className="exit-button"
            onClick={handleLeaveGame}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              zIndex: 999
            }}
        >
          Salir del juego
        </button>
      </div>
  );
};

export default PhaserGame;