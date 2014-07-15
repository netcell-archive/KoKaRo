angular.module('KoKaRo').factory('Rooms', ['Board','Players','$location','$firebase',function(Board, Players, $location, $firebase){
	var signs = Players.signs;
	return {
		room: null,
		connect: function(roomId, callback){
			this.room = $firebase(new Firebase(
				"https://kokaro.firebaseio.com/room/"+roomId
			));
			var _this = this;
			this.run(function(room){
				/* Reset if gameover */
				if (room.winner) {
					_this.reset();
				} else {
					if (!Players.join(room)) _this.createRoom();
					/* If it's a new room, populate a board */
					if (!room.board) {
						room.$update({
							board: Board.defaultBoard
						});
					} else {
						Board.board = room.board;
					}
				}
				callback(room);
			})
		},
		createRoom: function(){
			var token = Array.apply(0, Array(5)).map(function() {
			    return (function(charset){
			        return charset.charAt(Math.floor(Math.random() * charset.length))
			    }('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'));
			}).join('');
			$location.path('/'+token);
		},
		reset: function(){
			var room = this.room,
				player = Players.player,
				reset = {
					board: Board.defaultBoard,
					winner: false,
					justPlayed: false,
					turn: signs.indexOf(room.winner)
				};
			reset['player'+player^1] = false;
			room.$update(reset).then(function(){
				Players.joinAs(room, player);
			});
		},
		run: function(callback){
			var room = this.room;
			room.$on('loaded', function(){
				callback(room);
			});
		},
		play: function(i, j) {
			var room = this.room,
				turn = room.turn,
				winner = room.winner;
			/* Play the box when */
			if (turn===Players.player&&Board.cellIsEmpty(i,j)&&!winner) {
				var justPlayed = Board.play(i,j)
				winner = Board.checkGameOver(i,j);
				room.$update({
					board: Board.board,
					justPlayed: justPlayed,
					turn: turn^1,
					winner: signs[winner]
				});
			}
		}
	}
}]);