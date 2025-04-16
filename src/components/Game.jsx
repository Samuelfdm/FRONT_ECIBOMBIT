import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { io } from 'socket.io-client';
import '../style/GameP.css';

// Conexión con el servidor WebSocket
const socket = io('http://localhost:3000');

function PhaserGame() {
  const gameContainerRef = useRef(null);
  const gameInstanceRef = useRef(null);
  
  useEffect(() => {
    if (gameContainerRef.current && !gameInstanceRef.current) {
      // Configuración del juego adaptada al tamaño del contenedor
      const gameConfig = {
        type: Phaser.AUTO,
        width: gameContainerRef.current.clientWidth,
        height: gameContainerRef.current.clientHeight,
        backgroundColor: 'rgba(0,0,0,0)', // Usar rgba con alpha=0 para transparencia completa
        parent: gameContainerRef.current,
        scene: {
          preload,
          create,
          update
        },
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false
          }
        },
        // La clave está en estas dos propiedades:
        transparent: true, // Habilitar transparencia
        clearBeforeRender: true // Limpiar canvas antes de renderizar
      };

      
      
      gameInstanceRef.current = new Phaser.Game(gameConfig);
      gameInstanceRef.current.canvas.style.backgroundColor = 'transparent';
      // Manejar el cambio de tamaño de la ventana
      const handleResize = () => {
        if (gameInstanceRef.current) {
          gameInstanceRef.current.scale.resize(
            gameContainerRef.current.clientWidth,
            gameContainerRef.current.clientHeight
          );
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        if (gameInstanceRef.current) {
          gameInstanceRef.current.destroy(true);
          gameInstanceRef.current = null;
        }
      };
    }
  }, []);

  // Tamaño del tablero y los tiles
  const GRID_SIZE = 50;
  const BOARD_WIDTH = 13;
  const BOARD_HEIGHT = 11;

  // Matriz que define la estructura del tablero
  const BOARD_MATRIX = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 2, 0, 2, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ];

  let players = {};
  let walls;
  let dWalls;
  let cursors;
  let player;
  let spaceKey;
  let playerHealth = 100;
  let playerDamaged = false;

  // Precargar imágenes
  function preload() {
    this.load.image('destructive', '/assets/destructiveWall.png');
    this.load.image('bomb', '/assets/bomba.png');
    this.load.image('wall', '/assets/wall.png');
    this.load.image('player', '/assets/player.png');
    this.load.image('explosion', '/assets/explosion.png'); 
  }

  // Crear el juego
  function create() {

    this.cameras.main.transparent = true; // Hacer la cámara transparente


    // Ajustar el tamaño de los tiles para que encajen bien en el contenedor
    const containerWidth = this.sys.game.config.width;
    const containerHeight = this.sys.game.config.height;
    
    // Calcular el tamaño de grid para que el tablero se ajuste al contenedor
    const gridSizeX = containerWidth / (BOARD_WIDTH + 2); // Añadimos margen
    const gridSizeY = containerHeight / (BOARD_HEIGHT + 2); // Añadimos margen
    const calculatedGridSize = Math.min(gridSizeX, gridSizeY);
    
    // Usar el tamaño de grid calculado
    const GRID_SIZE_ADJUSTED = calculatedGridSize;

    // Centrar el tablero
    const offsetX = (containerWidth - BOARD_WIDTH * GRID_SIZE_ADJUSTED) / 2;
    const offsetY = (containerHeight - BOARD_HEIGHT * GRID_SIZE_ADJUSTED) / 2;

    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.GRID_SIZE = GRID_SIZE_ADJUSTED;

    // Crear grupo de paredes
    walls = this.physics.add.staticGroup();

    // Crear paredes destructibles
    dWalls = this.physics.add.staticGroup();

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (BOARD_MATRIX[y][x] === 1) {
          const wall = walls.create(offsetX + x * GRID_SIZE_ADJUSTED + GRID_SIZE_ADJUSTED / 2, offsetY + y * GRID_SIZE_ADJUSTED + GRID_SIZE_ADJUSTED / 2, 'wall');
          const wallScaleFactor = GRID_SIZE_ADJUSTED / wall.width;
          wall.setScale(wallScaleFactor);
          wall.refreshBody();
        } else if (BOARD_MATRIX[y][x] === 2) {
          const wall = dWalls.create(offsetX + x * GRID_SIZE_ADJUSTED + GRID_SIZE_ADJUSTED / 2, offsetY + y * GRID_SIZE_ADJUSTED + GRID_SIZE_ADJUSTED / 2, 'destructive');
          wall.setData('tileX', x);
          wall.setData('tileY', y);
          wall.setScale(GRID_SIZE_ADJUSTED / wall.width);
          wall.refreshBody();
        }
      }
    }

    // Crear el jugador y registrarlo en el servidor
    player = this.physics.add.sprite(offsetX + GRID_SIZE_ADJUSTED * 1.5, offsetY + GRID_SIZE_ADJUSTED * 1.5, 'player');
    player.setScale((GRID_SIZE_ADJUSTED * 0.8) / player.width);
    player.body.setSize(player.width * 0.8, player.height * 0.8);
    player.body.setOffset(player.width * 0.1, player.height * 0.1);
    this.physics.add.collider(player, walls);
    this.physics.add.collider(player, dWalls);
    
    socket.emit('newPlayer', { id: socket.id, x: player.x, y: player.y });

    // Asignar teclas como movimiento
    cursors = this.input.keyboard.createCursorKeys();

    this.bombs = this.physics.add.group();
    this.explosions = this.physics.add.group();

    // Asignar el espacio para colocar una bomba
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Escuchar la lista de jugadores del servidor
    socket.on('players', (data) => {
      // Primero eliminamos los jugadores que ya no existen
      Object.keys(players).forEach(id => {
        if (!data[id] && id !== socket.id) {
          if (players[id]) {
            players[id].destroy();
            delete players[id];
          }
        }
      });

      // Luego agregamos o actualizamos los jugadores existentes
      Object.entries(data).forEach(([id, playerData]) => {
        if (id !== socket.id) { // No crear un sprite para nosotros mismos
          if (!players[id]) {
            // Crear nuevo sprite de jugador para otros jugadores
            players[id] = this.physics.add.sprite(playerData.x, playerData.y, 'player');
            players[id].setScale((GRID_SIZE_ADJUSTED * 0.8) / players[id].width);
            players[id].setData('health', playerData.health || 100);
             
            this.physics.add.collider(players[id], walls);
            this.physics.add.collider(players[id], dWalls);
          } else {
            // Actualizar posición y salud de jugador existente
            players[id].x = playerData.x;
            players[id].y = playerData.y;
          }
        }
      });
    });

    // Escuchar movimiento de otros jugadores
    socket.on('playerMoved', (data) => {
      if (players[data.id]) {
        // Usar la interpolación incorporada de Phaser para un movimiento más suave
        this.tweens.add({
          targets: players[data.id],
          x: data.x,
          y: data.y,
          duration: 100,
          ease: 'Linear'
        });
      }
    });

    socket.on('addBomb', (data) => {
      const bombX = data.x;
      const bombY = data.y;

      const bomb = this.physics.add.sprite(bombX, bombY, 'bomb');
      bomb.setScale((GRID_SIZE_ADJUSTED * 0.8) / bomb.width);
      bomb.setDepth(1);

      this.time.delayedCall(3000, () => {
        bomb.destroy();

        // Mostrar efecto de explosión
        this.createExplosion(bombX, bombY);
      });
    });

    socket.on('bombExploded', (data) => {
      const { tileX, tileY, playersHit } = data;
      
      // Calcular coordenadas reales
      const bombX = this.offsetX + tileX * GRID_SIZE_ADJUSTED + GRID_SIZE_ADJUSTED / 2;
      const bombY = this.offsetY + tileY * GRID_SIZE_ADJUSTED + GRID_SIZE_ADJUSTED / 2;
      
      // Mostrar efecto de explosión
      this.createExplosion(bombX, bombY);
      
      // Destruir paredes
      const directions = [
        { dx: 0, dy: 0 },   // centro
        { dx: 1, dy: 0 },   // derecha
        { dx: -1, dy: 0 },  // izquierda
        { dx: 0, dy: 1 },   // abajo
        { dx: 0, dy: -1 },  // arriba
      ];
    
      directions.forEach(({ dx, dy }) => {
        const x = tileX + dx;
        const y = tileY + dy;
    
        if (BOARD_MATRIX[y] && BOARD_MATRIX[y][x] === 2) {
          dWalls.getChildren().forEach((wall) => {
            if (wall.getData('tileX') === x && wall.getData('tileY') === y) {
              wall.destroy();
              BOARD_MATRIX[y][x] = 0; // Marcar como vacío
            }
          });
        }
      });
      
      // Verificar si el jugador local fue dañado
      if (playersHit && playersHit.includes(socket.id)) {
        playerHealth -= 25; // Restar 25 de salud
        
        // Efectos visuales de daño
        this.cameras.main.shake(200, 0.01);
        playerDamaged = true;
        player.setTint(0xff0000);
        
        this.time.delayedCall(200, () => {
          player.clearTint();
          playerDamaged = false;
        });
        
        // Si la salud llega a 0, el jugador muere
        if (playerHealth <= 0) {
          socket.emit('playerDied', { id: socket.id });
          playerHealth = 0;
          // Mostrar mensaje de muerte
          const gameOverText = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY, 
            'GAME OVER', 
            { fontSize: '64px', fill: '#ff0000' }
          ).setOrigin(0.5);
        }
        
        // Informar al servidor de la salud actualizada
        socket.emit('updateHealth', { id: socket.id, health: playerHealth });
      }
    });
    
    // Escuchar actualizaciones de salud
    socket.on('playerHealthUpdate', (data) => {
      if (data.id === socket.id) {
        // Actualizar nuestra propia salud si el servidor lo indica
        playerHealth = data.health;
      } else if (players[data.id]) {      
        // Efecto visual de daño
        this.tweens.add({
          targets: players[data.id],
          alpha: 0.5,
          yoyo: true,
          duration: 100,
          repeat: 2
        });
      }
    });
    
    // Escuchar cuando un jugador muere
    socket.on('playerDied', (data) => {
      if (players[data.id]) {
        // Mostrar animación de muerte
        this.tweens.add({
          targets: players[data.id],
          alpha: 0,
          scale: 0,
          duration: 1000,
          onComplete: () => {
            if (players[data.id].healthText) {
              players[data.id].healthText.destroy();
            }
            players[data.id].destroy();
            delete players[data.id];
          }
        });
      }
    });

    this.createExplosion = (x, y) => {
      const tileX = Math.floor((x - this.offsetX) / this.GRID_SIZE);
      const tileY = Math.floor((y - this.offsetY) / this.GRID_SIZE);
      
      const directions = [
        { dx: 0, dy: 0 },   // centro
        { dx: 1, dy: 0 },   // derecha
        { dx: -1, dy: 0 },  // izquierda
        { dx: 0, dy: 1 },   // abajo
        { dx: 0, dy: -1 },  // arriba
      ];
      
      directions.forEach(({ dx, dy }) => {
        const expX = x + dx * this.GRID_SIZE;
        const expY = y + dy * this.GRID_SIZE;

        const wallX = tileX + dx;
        const wallY = tileY + dy;

        if (!(BOARD_MATRIX[wallY] && BOARD_MATRIX[wallY][wallX] === 1)) {
          const explosion = this.explosions.create(expX, expY, 'explosion');
          explosion.setScale((this.GRID_SIZE * 0.9) / explosion.width);
          explosion.setDepth(2);
          explosion.setAlpha(0.8);
          
          this.tweens.add({
            targets: explosion,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              explosion.destroy();
            }
          });
        }
      });
    };
  }

  // Actualizar el estado del juego
  function update() {
    if (playerHealth <= 0) {
      // Si el jugador está muerto, no puede moverse
      player.setVelocity(0, 0);
      return;
    }
    
    const PLAYER_SPEED = 200;

    if (cursors.left.isDown) {
      player.setVelocityX(-PLAYER_SPEED);
      player.setVelocityY(0);
    } else if (cursors.right.isDown) {
      player.setVelocityX(PLAYER_SPEED);
      player.setVelocityY(0);
    } else if (cursors.up.isDown) {
      player.setVelocityY(-PLAYER_SPEED);
      player.setVelocityX(0);
    } else if (cursors.down.isDown) {
      player.setVelocityY(PLAYER_SPEED);
      player.setVelocityX(0);
    } else {
      player.setVelocityX(0);
      player.setVelocityY(0);
    }

    // Emitir movimiento solo si cambio la posicion y no está dañado
    if (socket && player && !playerDamaged) {
      socket.emit('move', { id: socket.id, x: player.x, y: player.y});
    }

    // Emite la creacion de una bomba
    if (Phaser.Input.Keyboard.JustDown(spaceKey) && playerHealth > 0) {
      const bomb = this.bombs.create(player.x, player.y, 'bomb');
      bomb.setScale((this.GRID_SIZE * 0.8) / bomb.width);
      bomb.setImmovable(true);

      // Calcula la posicion en tiles
      const tileX = Math.floor((player.x - this.offsetX) / this.GRID_SIZE);
      const tileY = Math.floor((player.y - this.offsetY) / this.GRID_SIZE);

      socket.emit('addBomb', { id: socket.id, x: player.x, y: player.y, tileX, tileY });

      // Timer para explosion
      this.time.delayedCall(3000, () => {
        bomb.destroy();

        // Crear efecto de explosión
        this.createExplosion(player.x, player.y);
        
        // Emite al servidor que exploto
        socket.emit('bombExploded', {
          id: socket.id,
          tileX,
          tileY
        });
      });
    }
  }

  return (
    <div className="phaser-game-container" ref={gameContainerRef}></div>
  );
}

export default PhaserGame;